import { defineStore } from 'pinia';
import type { BlockedMovie, WatchlistItem } from '../types/domain.js';

type ListsState = {
  watchlist: WatchlistItem[];
  blockedMovies: BlockedMovie[];
  loading: boolean;
};

export const useListsStore = defineStore('lists', {
  state: (): ListsState => ({
    watchlist: [],
    blockedMovies: [],
    loading: false,
  }),
  getters: {
    watchlistIds: state => new Set(state.watchlist.map(item => `${item.media_type}:${item.tmdb_id}`)),
    blockedMovieIds: state => new Set(state.blockedMovies.map(item => item.tmdb_id)),
  },
  actions: {
    setWatchlist(watchlist: WatchlistItem[]) {
      this.watchlist = watchlist;
    },
    setBlockedMovies(blockedMovies: BlockedMovie[]) {
      this.blockedMovies = blockedMovies;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
