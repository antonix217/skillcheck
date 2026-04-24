import { GameId } from './types';

export const GAMES: { id: GameId; title: string; description: string; unit: string }[] = [
  { 
    id: 'reaction', 
    title: 'Reaction Time', 
    description: 'When the screen turns GREEN, click as fast as you can.',
    unit: 'ms'
  },
  {
    id: 'aim',
    title: 'Aim Precision',
    description: 'Click the targets as they appear on the screen. Be fast and precise.',
    unit: ' hits'
  },
  {
    id: 'memory',
    title: 'Visual Memory',
    description: 'Watch the grid sequence and repeat it accurately. Grid expands at higher levels.',
    unit: ' lvl'
  },
  { 
    id: 'typing', 
    title: 'Typing Speed', 
    description: 'Type the displayed text as fast and accurately as possible.',
    unit: 'WPM'
  },
  {
    id: 'math',
    title: 'Math Sprint',
    description: 'Solve as many math problems as you can in 60 seconds. Difficulty escalates.',
    unit: ' solved'
  },
  {
    id: 'pattern',
    title: 'Pattern Scan',
    description: 'Find and click the unique symbol in the grid. Grids grow indefinitely.',
    unit: ' lvls'
  },
  {
    id: 'color',
    title: 'Color Perception',
    description: 'Identify the square with a slightly different shade. Differences become subtler each level.',
    unit: ' lvl'
  }
];

// Seed data for percentiles (medians based on average human performance)
export const SEED_DISTRIBUTIONS: Record<GameId, number[]> = {
  reaction: [350, 320, 290, 270, 250, 230, 215, 200, 190, 180], // Lower is better
  aim: [200, 400, 550, 700, 800, 850, 900, 950, 980, 1000],
  memory: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  typing: [20, 35, 45, 55, 65, 75, 85, 95, 110, 130],
  math: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
  pattern: [1500, 1200, 1000, 850, 700, 600, 500, 450, 400, 350], // Lower is better
  color: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
};
