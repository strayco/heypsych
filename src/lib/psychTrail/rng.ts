/**
 * PsychTrails - Seeded Random Number Generator
 *
 * Deterministic RNG for reproducible simulation runs.
 * Uses a simple Linear Congruential Generator (LCG) algorithm.
 */

/**
 * Seeded random number generator for deterministic simulations
 */
export class SeededRNG {
  private state: number;

  /**
   * Create a new RNG with the given seed
   * @param seed - Integer seed value (will be normalized to 32-bit unsigned)
   */
  constructor(seed: number) {
    // Normalize seed to 32-bit unsigned integer
    this.state = Math.abs(Math.floor(seed)) % 0x7fffffff;
    if (this.state === 0) this.state = 1; // Avoid zero state
  }

  /**
   * Generate next random number in [0, 1)
   * Uses LCG: X(n+1) = (a * X(n) + c) mod m
   */
  next(): number {
    // LCG constants (from Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = 0x100000000; // 2^32

    this.state = (a * this.state + c) % m;
    return this.state / m;
  }

  /**
   * Generate random integer in [min, max] (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Return true with given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Shuffle array in-place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array]; // Don't mutate input
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Get current state (for saving/loading)
   */
  getState(): number {
    return this.state;
  }

  /**
   * Restore state (for saving/loading)
   */
  setState(state: number): void {
    this.state = state;
  }
}

/**
 * Create a random seed from current timestamp + random noise
 */
export function generateSeed(): number {
  return Math.floor(Date.now() * Math.random());
}
