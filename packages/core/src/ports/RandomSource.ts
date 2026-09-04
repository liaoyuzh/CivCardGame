export interface RandomSource {
  next(): number;
}

export const systemRandom: RandomSource = {
  next: () => Math.random(),
};
