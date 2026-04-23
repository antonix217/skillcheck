import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}

export function calculatePercentile(score: number, distribution: number[]): number {
  if (distribution.length === 0) return 50;
  const count = distribution.filter(s => s < score).length;
  return (count / distribution.length) * 100;
}
