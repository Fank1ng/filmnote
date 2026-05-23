import { defineStore } from 'pinia';
import type { Entry, Profile, SeasonRating } from '../types/domain.js';

type EntriesState = {
  entries: Entry[];
  seasonRatings: SeasonRating[];
  profiles: Record<string, Profile>;
  loading: boolean;
};

export const useEntriesStore = defineStore('entries', {
  state: (): EntriesState => ({
    entries: [],
    seasonRatings: [],
    profiles: {},
    loading: false,
  }),
  getters: {
    movieEntries: state => state.entries.filter(entry => (entry.type || entry.media_type) !== 'series'),
    seriesEntries: state => state.entries.filter(entry => (entry.type || entry.media_type) === 'series'),
  },
  actions: {
    setEntries(entries: Entry[]) {
      this.entries = entries;
    },
    setSeasonRatings(seasonRatings: SeasonRating[]) {
      this.seasonRatings = seasonRatings;
    },
    setProfiles(profiles: Record<string, Profile>) {
      this.profiles = profiles;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
