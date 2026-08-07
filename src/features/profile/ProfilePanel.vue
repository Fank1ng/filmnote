<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { TMDB_IMG } from '../../config/constants.js';
import BaseModal from '../../shared/components/BaseModal.vue';
import ImportExportToolbar from '../../shared/components/ImportExportToolbar.vue';
import { getSeasonAwareEntryScore } from '../../shared/scoring.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useModalStore } from '../../stores/modals.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore, type AccountModal } from '../../stores/ui.js';
import type { Entry, RatingDims } from '../../types/domain.js';

defineOptions({ name: 'ProfilePanel' });

const emit = defineEmits<{
  exportJson: [];
  importJson: [file: File];
  logout: [];
}>();

const dimensions: Array<{ key: keyof RatingDims; label: string }> = [
  { key: 'story', label: '故事' },
  { key: 'character', label: '角色' },
  { key: 'visual', label: '视觉' },
  { key: 'editing', label: '剪辑' },
  { key: 'sound', label: '声音' },
  { key: 'emotion', label: '情感' },
];
const monthLabels = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const session = useSessionStore();
const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const mediaModals = useModalStore();
const ui = useUiStore();
const settingsOpen = ref(false);
const selectedMonth = ref(new Date().getMonth());
const storyReplay = ref(0);
const projectorReplay = ref(0);

const userId = computed(() => (session.currentUser as { id?: string } | null)?.id || '');
const mine = computed(() => entries.entries.filter(entry => entry.user_id === userId.value));
const partnerId = computed(() => couple.partnerProfileId || '');
const displayName = computed(() => session.currentProfile?.display_name || '我的放映档案');
const canManageInvites = computed(() => ['fank1ng', 'ceci'].includes(displayName.value.toLowerCase()));
const partnerName = computed(() => entries.profiles[partnerId.value]?.display_name || 'Ceci');

function recordDate(entry: Entry): Date | null {
  const value = entry.created_at || entry.updated_at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function score(entry: Entry): number {
  return getSeasonAwareEntryScore(entry, entries.seasonRatings);
}

function average(source: Entry[]): string {
  if (!source.length) return '—';
  return (source.reduce((sum, entry) => sum + score(entry), 0) / source.length).toFixed(1);
}

function byScoreThenDate(a: Entry, b: Entry): number {
  return score(b) - score(a) || Number(recordDate(b)) - Number(recordDate(a));
}

const datedMine = computed(() => mine.value
  .map(entry => ({ entry, date: recordDate(entry) }))
  .filter((item): item is { entry: Entry; date: Date } => !!item.date)
  .sort((a, b) => Number(b.date) - Number(a.date)));
const storyYear = computed(() => {
  const currentYear = new Date().getFullYear();
  return datedMine.value.some(item => item.date.getFullYear() === currentYear)
    ? currentYear
    : datedMine.value[0]?.date.getFullYear() || currentYear;
});
const yearEntries = computed(() => datedMine.value.filter(item => item.date.getFullYear() === storyYear.value).map(item => item.entry));
const monthBuckets = computed(() => Array.from({ length: 12 }, (_, month) => datedMine.value
  .filter(item => item.date.getFullYear() === storyYear.value && item.date.getMonth() === month)
  .map(item => item.entry)));
const selectedEntries = computed(() => monthBuckets.value[selectedMonth.value] || []);
const annualHero = computed(() => [...yearEntries.value].sort(byScoreThenDate)[0] || [...mine.value].sort(byScoreThenDate)[0] || null);
const heroEntry = computed(() => [...selectedEntries.value].sort(byScoreThenDate)[0] || annualHero.value);
const highestEntry = computed(() => [...mine.value].sort(byScoreThenDate)[0] || null);
const recentComment = computed(() => datedMine.value.find(item => item.entry.comment?.trim())?.entry || null);
const heroPoster = computed(() => heroEntry.value?.poster_path ? `${TMDB_IMG}${heroEntry.value.poster_path}` : '');
const maxMonthCount = computed(() => Math.max(1, ...monthBuckets.value.map(bucket => bucket.length)));
const yearStats = computed(() => [
  { value: yearEntries.value.length, label: `${storyYear.value} 记录` },
  { value: average(yearEntries.value), label: '年度均分' },
  { value: yearEntries.value.filter(entry => score(entry) >= 8).length, label: '高分收藏' },
  { value: yearEntries.value.filter(entry => entry.comment?.trim()).length, label: '观后感' },
]);
const fingerprint = computed(() => dimensions.map(dimension => {
  const values = yearEntries.value.map(entry => Number(entry.ratings?.[dimension.key])).filter(value => Number.isFinite(value));
  return { ...dimension, value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0 };
}));

function fingerprintPoint(value: number, index: number): string {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / dimensions.length;
  const radius = 82 * Math.max(0, Math.min(value / 10, 1));
  return `${(110 + Math.cos(angle) * radius).toFixed(1)},${(105 + Math.sin(angle) * radius).toFixed(1)}`;
}

function fingerprintLevel(level: number): string {
  return dimensions.map((_, index) => fingerprintPoint(level * 10, index)).join(' ');
}

const fingerprintPolygon = computed(() => fingerprint.value.map((item, index) => fingerprintPoint(item.value, index)).join(' '));

function chooseMonth(month: number): void {
  if (!monthBuckets.value[month]?.length) return;
  selectedMonth.value = month;
  projectorReplay.value += 1;
}

function openEntry(entry: Entry | null): void {
  if (entry) mediaModals.openEntryDetail(entry.id);
}

function openAccountModal(modal: Exclude<AccountModal, null>): void {
  settingsOpen.value = false;
  void nextTick(() => ui.openAccountModal(modal));
}

function navigateTogether(): void {
  ui.navigate('together/overview');
}

function logout(): void {
  settingsOpen.value = false;
  emit('logout');
}

watch([storyYear, () => yearEntries.value.length], () => {
  const newestMonth = monthBuckets.value.findLastIndex(bucket => bucket.length > 0);
  selectedMonth.value = newestMonth >= 0 ? newestMonth : new Date().getMonth();
  projectorReplay.value += 1;
}, { immediate: true });
watch(() => ui.activeTab, activeTab => {
  if (activeTab === 'profile') storyReplay.value += 1;
}, { immediate: true });
</script>

<template>
  <section class="profile-panel" aria-labelledby="profile-heading">
    <div v-if="!session.isAuthenticated" class="profile-guest-shell">
      <header class="page-heading">
        <p class="eyebrow">PRIVATE SCREENING ARCHIVE</p>
        <h1 id="profile-heading">我的放映档案</h1>
        <p>登录后打开个人观影故事、偏好与数据管理。</p>
      </header>
      <div class="profile-guest midnight-card">
        <span class="profile-monogram">F&amp;C</span>
        <div><h2>登录后打开个人档案</h2><p>公开发现与影库仍可浏览；记录、想看和双人功能会在登录后恢复。</p></div>
        <div class="profile-actions"><button class="btn btn-secondary" type="button" @click="ui.openAuthModal('login')">登录</button><button class="btn btn-primary" type="button" @click="ui.openAuthModal('register')">注册</button></div>
      </div>
    </div>

    <div v-else :key="`${storyReplay}-${projectorReplay}`" class="profile-story">
      <header class="profile-story-heading">
        <div><p class="eyebrow">PRIVATE SCREENING ARCHIVE / {{ storyYear }}</p><h1 id="profile-heading">{{ displayName }} 的观影故事</h1><p>按记录日期整理这一年的银幕记忆。</p></div>
        <button class="profile-manage-button" type="button" @click="settingsOpen = true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" /></svg>
          档案管理
        </button>
      </header>

      <section class="profile-projector" :style="{ '--profile-hero': heroPoster ? `url(${heroPoster})` : 'none' }" aria-label="年度观影主舞台">
        <div class="profile-projector-backdrop" aria-hidden="true"></div>
        <div class="profile-projector-curtain left" aria-hidden="true"></div><div class="profile-projector-curtain right" aria-hidden="true"></div>
        <div class="profile-projector-copy">
          <p class="eyebrow">{{ selectedEntries.length ? `${monthLabels[selectedMonth]} / 本月主片` : `${storyYear} / 年度主片` }}</p>
          <h2>{{ heroEntry?.title || '等待第一条观影记录' }}</h2>
          <p>{{ heroEntry ? `${heroEntry.year || '年份未知'} · 评分 ${score(heroEntry).toFixed(1)}` : '完成一次评分后，这里会亮起第一束放映光。' }}</p>
          <button v-if="heroEntry" type="button" class="profile-hero-action" @click="openEntry(heroEntry)">查看这部作品</button>
        </div>
        <button v-if="partnerId" class="profile-couple-badge" type="button" @click="navigateTogether">
          <span>FD</span><i>&amp;</i><span class="ceci">{{ partnerName.slice(0, 1).toUpperCase() }}</span>
          <small>进入我们的放映厅</small>
        </button>
        <div class="profile-year-stats" aria-label="年度观影摘要">
          <span v-for="(stat, index) in yearStats" :key="stat.label" :style="{ '--delay': `${index * 45}ms` }"><b>{{ stat.value }}</b>{{ stat.label }}</span>
        </div>
      </section>

      <section class="profile-timeline midnight-card" aria-labelledby="profile-timeline-title">
        <div class="profile-section-heading"><div><p class="eyebrow">RECORD TIMELINE</p><h2 id="profile-timeline-title">{{ storyYear }} 记录时间线</h2></div><p>{{ selectedEntries.length ? `${monthLabels[selectedMonth]}记录 ${selectedEntries.length} 部` : '选择有记录的月份' }}</p></div>
        <div class="profile-months" role="list" aria-label="按月份查看记录">
          <button
            v-for="(bucket, month) in monthBuckets"
            :key="month"
            type="button"
            :disabled="!bucket.length"
            :class="{ active: selectedMonth === month }"
            :aria-pressed="selectedMonth === month"
            :aria-label="`${month + 1} 月，${bucket.length} 条记录`"
            @click="chooseMonth(month)"
          >
            <i><b :style="{ '--level': Math.max(.08, bucket.length / maxMonthCount) }"></b></i><span>{{ month + 1 }}</span><small>{{ bucket.length }}</small>
          </button>
        </div>
        <div v-if="selectedEntries.length" class="profile-filmstrip" aria-label="所选月份的影片">
          <button v-for="entry in selectedEntries" :key="entry.id" type="button" @click="openEntry(entry)">
            <img v-if="entry.poster_path" :src="`${TMDB_IMG}${entry.poster_path}`" :alt="entry.title" loading="lazy">
            <span v-else>{{ entry.title }}</span>
            <strong>{{ entry.title }}</strong><small>{{ score(entry).toFixed(1) }}</small>
          </button>
        </div>
        <p v-else class="profile-empty-note">这一年还没有可展示的月份记录。</p>
      </section>

      <div class="profile-story-grid">
        <section class="midnight-card profile-fingerprint" aria-labelledby="fingerprint-title">
          <div class="profile-section-heading"><div><p class="eyebrow">RATING FINGERPRINT</p><h2 id="fingerprint-title">年度评分指纹</h2></div><p>六维评分均值</p></div>
          <div class="profile-fingerprint-layout">
            <svg viewBox="0 0 220 210" role="img" :aria-label="`${storyYear} 年六维评分指纹`">
              <polygon v-for="level in [.25,.5,.75,1]" :key="level" :points="fingerprintLevel(level)" fill="none" stroke="var(--border)" />
              <line v-for="(_, index) in dimensions" :key="index" x1="110" y1="105" :x2="fingerprintPoint(10,index).split(',')[0]" :y2="fingerprintPoint(10,index).split(',')[1]" stroke="var(--border)" />
              <polygon class="profile-fingerprint-shape" :points="fingerprintPolygon" fill="var(--gold)" fill-opacity=".18" stroke="var(--gold)" stroke-width="2.5" />
            </svg>
            <div class="profile-fingerprint-values"><span v-for="item in fingerprint" :key="item.key"><i>{{ item.label }}</i><b>{{ item.value ? item.value.toFixed(1) : '—' }}</b></span></div>
          </div>
        </section>

        <section class="profile-story-cards">
          <button class="profile-story-card signature" type="button" :disabled="!highestEntry" @click="openEntry(highestEntry)">
            <span>个人封神</span><strong>{{ highestEntry?.title || '暂无评分作品' }}</strong><em>{{ highestEntry ? `总分 ${score(highestEntry).toFixed(1)}` : '完成评分后生成' }}</em>
          </button>
          <button class="profile-story-card aftertaste" type="button" :disabled="!recentComment" @click="openEntry(recentComment)">
            <span>最近余味</span><blockquote>{{ recentComment?.comment || '写下一条观后感后，它会留在这里。' }}</blockquote><em>{{ recentComment?.title || '暂无观后感' }}</em>
          </button>
          <button class="profile-story-card relationship" type="button" @click="partnerId ? navigateTogether() : openAccountModal('couple')">
            <span>双人关系</span><strong>{{ partnerId ? `FD × ${partnerName}` : '等待绑定 Couple' }}</strong><em>{{ partnerId ? `${couple.queue.length} 部下次看` : '绑定后生成共同档案' }}</em>
          </button>
        </section>
      </div>
    </div>

    <BaseModal class="profile-manage-overlay" :open="settingsOpen" max-width="440px" labelled-by="profile-manage-title" @close="settingsOpen = false">
      <div class="profile-manage-drawer">
        <header><div><p class="eyebrow">ARCHIVE CONTROL</p><h2 id="profile-manage-title">档案管理</h2></div><button type="button" aria-label="关闭档案管理" @click="settingsOpen = false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
        <p>账号、关系和数据能力仍使用原有流程。</p>
        <div class="profile-control-grid">
          <button type="button" @click="openAccountModal('changePassword')"><span>01</span><b>修改密码</b><small>更新当前登录密码</small></button>
          <button type="button" @click="openAccountModal('couple')"><span>02</span><b>Couple 关系</b><small>绑定、申请或解除关系</small></button>
          <button type="button" @click="openAccountModal('blocked')"><span>03</span><b>屏蔽管理</b><small>恢复不再推荐的电影</small></button>
          <button v-if="canManageInvites" type="button" @click="openAccountModal('invites')"><span>04</span><b>邀请码管理</b><small>生成和查看邀请码</small></button>
        </div>
        <ImportExportToolbar @export-json="emit('exportJson')" @import-json="emit('importJson', $event)" />
        <label class="motion-setting"><span><strong>减少动态效果</strong><small>关闭位移、转盘和图表描边，只保留短暂淡化</small></span><input type="checkbox" :checked="ui.reducedMotion" @change="ui.setReducedMotion(($event.target as HTMLInputElement).checked)"></label>
        <button class="btn btn-danger profile-logout" type="button" @click="logout">退出登录</button>
      </div>
    </BaseModal>
  </section>
</template>

<style src="./styles.css"></style>
