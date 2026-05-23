import type { MediaType } from '../../types/domain.js';

export type StatsFilter = 'me' | 'others' | 'compare';

export type StatsControlState = {
  filter?: StatsFilter;
  type?: MediaType;
  otherUser?: string | null;
};

export type UserColor = {
  key: string;
  main: string;
  dim: string;
};

export function asStatsControlState(input: unknown): StatsControlState {
  return (input || {}) as StatsControlState;
}

