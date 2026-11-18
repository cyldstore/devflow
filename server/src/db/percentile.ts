// nearest-rank：0.75 × n 向上取整，再减 1
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.min(index, sorted.length - 1)];
}