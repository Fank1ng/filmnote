import { defineStore } from 'pinia';
import type { Entry } from '../types/domain.js';

type QuickRateRequest =
  | { seq: number; kind: 'rate'; media: unknown; opts?: Record<string, unknown> }
  | { seq: number; kind: 'edit'; id: Entry['id']; opts?: { targetSeasonNumber?: number; enableTargetSeason?: boolean } };

type MediaDetailRequest = {
  seq: number;
  media: unknown;
};

type EntryDetailRequest = {
  seq: number;
  id: Entry['id'];
};

export const useModalStore = defineStore('modals', {
  state: () => ({
    seq: 0,
    quickRateRequest: null as QuickRateRequest | null,
    mediaDetailRequest: null as MediaDetailRequest | null,
    entryDetailRequest: null as EntryDetailRequest | null,
  }),
  actions: {
    openQuickRate(media: unknown, opts: Record<string, unknown> = {}) {
      this.quickRateRequest = { seq: ++this.seq, kind: 'rate', media, opts };
    },
    openQuickEdit(id: Entry['id'], opts: { targetSeasonNumber?: number; enableTargetSeason?: boolean } = {}) {
      this.quickRateRequest = { seq: ++this.seq, kind: 'edit', id, opts };
    },
    openMediaDetail(media: unknown) {
      this.mediaDetailRequest = { seq: ++this.seq, media };
    },
    openEntryDetail(id: Entry['id']) {
      this.entryDetailRequest = { seq: ++this.seq, id };
    },
  },
});
