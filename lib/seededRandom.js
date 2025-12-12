import crypto from 'crypto';

export function makeRng(seedString) {
  const hash = crypto.createHash('sha256').update(seedString).digest();
  let state = hash.readUInt32BE(0);

  return () => {
    // LCG parameters from Numerical Recipes
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000; // [0,1)
  };
}
