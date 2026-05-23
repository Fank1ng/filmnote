import { defineStore } from 'pinia';
import type { Profile } from '../types/domain.js';

type SessionState = {
  currentUser: unknown;
  currentProfile: Profile | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
};

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    currentUser: null,
    currentProfile: null,
    isAuthenticated: false,
    isRestoring: false,
  }),
  actions: {
    setUser(user: unknown, profile: Profile | null = null) {
      this.currentUser = user;
      this.currentProfile = profile;
      this.isAuthenticated = !!user;
    },
    clearSession() {
      this.currentUser = null;
      this.currentProfile = null;
      this.isAuthenticated = false;
    },
    setRestoring(isRestoring: boolean) {
      this.isRestoring = isRestoring;
    },
  },
});
