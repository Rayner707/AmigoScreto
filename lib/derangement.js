function shuffleWithRng(items, rng = Math.random) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createDerangement(list, rng) {
  const givers = [...list];
  let receivers = [];
  let attempts = 0;

  do {
    receivers = shuffleWithRng(givers, rng);
    attempts += 1;
    if (attempts > 12000) return null;
  } while (givers.some((name, index) => name === receivers[index]));

  return givers.map((giver, index) => ({ giver, receiver: receivers[index] }));
}
