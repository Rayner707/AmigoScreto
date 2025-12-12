import { kv } from '@vercel/kv';
import { createDerangement } from './derangement';
import { participants } from './participants';
import { makeRng } from './seededRandom';
import { deriveToken } from './tokens';

const tokenSecret = process.env.TOKEN_SECRET || 'dev-secret-change-me';
const rng = makeRng(tokenSecret);

const PAIRS_KEY = 'amigo:pairs';
const CLAIMS_KEY = 'amigo:claims';

const kvAvailable = Boolean(process.env.KV_REST_API_URL || process.env.KV_URL);
const claimState = globalThis.__AMIGO_CLAIMS__ || new Map();
globalThis.__AMIGO_CLAIMS__ = claimState;
let pairsCache = null;

function buildPairsMap() {
  const derangement = createDerangement(participants, rng);
  if (!derangement) {
    throw new Error('No se pudo generar el derangement inicial');
  }

  const map = new Map();
  derangement.forEach(({ giver, receiver }) => {
    const token = deriveToken(giver, tokenSecret);
    map.set(token, { giver, receiver });
  });
  return map;
}

async function ensurePairs() {
  if (pairsCache) return pairsCache;

  if (kvAvailable) {
    const stored = await kv.hgetall(PAIRS_KEY);
    if (stored && Object.keys(stored).length > 0) {
      const map = new Map();
      Object.entries(stored).forEach(([token, payload]) => {
        try {
          const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
          map.set(token, parsed);
        } catch {
          // skip corrupted entries
        }
      });
      if (map.size > 0) {
        pairsCache = map;
        return pairsCache;
      }
    }
  }

  const map = buildPairsMap();
  pairsCache = map;

  if (kvAvailable) {
    const entries = {};
    map.forEach((value, key) => {
      entries[key] = JSON.stringify(value);
    });
    await kv.hset(PAIRS_KEY, entries);
  }

  return pairsCache;
}

export async function claimAssignment(token, nameInput) {
  if (!token || !nameInput) {
    return { error: 'Falta token o nombre.' };
  }

  const pairs = await ensurePairs();
  const record = pairs.get(token);
  if (!record) {
    return { error: 'Token inválido.' };
  }

  const normalizedInput = nameInput.trim().toLowerCase();
  const normalizedGiver = record.giver.trim().toLowerCase();

  if (normalizedInput !== normalizedGiver) {
    return { error: 'El nombre no coincide con el enlace recibido.' };
  }

  if (kvAvailable) {
    const claimed = await kv.hget(CLAIMS_KEY, token);
    if (claimed === '1') {
      return { error: 'Este enlace ya fue usado para revelar el amigo secreto.' };
    }
    await kv.hset(CLAIMS_KEY, { [token]: '1' }); // marca como reclamado
  } else {
    if (claimState.get(token) === true) {
      return { error: 'Este enlace ya fue usado para revelar el amigo secreto.' };
    }
    claimState.set(token, true);
  }

  return {
    giver: record.giver,
    receiver: record.receiver,
    alreadyClaimed: false
  };
}

export async function getPairByToken(token) {
  const pairs = await ensurePairs();
  return pairs.get(token) || null;
}

export async function listTokens() {
  const pairs = await ensurePairs();

  let claimed = new Map();

  if (kvAvailable) {
    const claimedHash = await kv.hgetall(CLAIMS_KEY);
    claimed = new Map(
      Object.entries(claimedHash || {}).map(([key, value]) => [key, value === '1'])
    );
  } else {
    claimed = claimState;
  }

  return Array.from(pairs.entries()).map(([token, data]) => ({
    token,
    giver: data.giver,
    receiver: data.receiver,
    claimed: claimed.get(token) === true
  }));
}
