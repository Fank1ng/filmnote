import { defineStore } from 'pinia';
import type { MediaType } from '../types/domain.js';

export type ListMode = 'entries' | 'watchlist';
export type OwnerFilter = 'all' | 'me';
export type SortBy = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'count-desc' | 'title';
export type ScoreFilter = 'all' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2' | '1';

type ListControlsState = {
  mode: ListMode;
  type: MediaType;
  owner: OwnerFilter;
  search: string;
  sort: SortBy;
  score: ScoreFilter;
  page: number;
  watchlistPage: number;
};

export const useListControlsStore = defineStore('listControls', {
  state: (): ListControlsState => ({
    mode: 'entries',
    type: 'movie',
    owner: 'all',
    search: '',
    sort: 'date-desc',
    score: 'all',
    page: 1,
    watchlistPage: 1,
  }),
  actions: {
    setMode(mode: ListMode) {
      this.mode = mode;
    },
    setType(type: MediaType) {
      this.type = type;
      this.page = 1;
    },
    setOwner(owner: OwnerFilter) {
      this.owner = owner;
      this.page = 1;
    },
    setSearch(search: string) {
      this.search = search;
      this.page = 1;
    },
    setSort(sort: SortBy) {
      this.sort = sort;
      this.page = 1;
    },
    setScore(score: ScoreFilter) {
      this.score = score;
      this.page = 1;
    },
    setPage(page: number) {
      this.page = Math.max(1, page);
    },
    setWatchlistPage(page: number) {
      this.watchlistPage = Math.max(1, page);
    },
    showEntry(mediaType: MediaType = 'movie') {
      this.mode = 'entries';
      this.type = mediaType;
      this.owner = 'all';
      this.search = '';
      this.score = 'all';
      this.page = 1;
    },
  },
});
