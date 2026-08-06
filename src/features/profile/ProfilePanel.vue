<script setup lang="ts">
import { computed } from 'vue';
import ImportExportToolbar from '../../shared/components/ImportExportToolbar.vue';
import { getSeasonAwareEntryScore } from '../../shared/scoring.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';

defineOptions({ name: 'ProfilePanel' });

const emit = defineEmits<{
  exportJson: [];
  importJson: [file: File];
  logout: [];
}>();

const session = useSessionStore();
const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const ui = useUiStore();

const userId = computed(() => (session.currentUser as { id?: string } | null)?.id || '');
const mine = computed(() => entries.entries.filter(entry => entry.user_id === userId.value));
const partnerId = computed(() => couple.partnerProfileId || '');
const partnerEntries = computed(() => entries.entries.filter(entry => entry.user_id === partnerId.value));
const displayName = computed(() => session.currentProfile?.display_name || '我的放映档案');
const canManageInvites = computed(() => ['fank1ng', 'ceci'].includes(displayName.value.toLowerCase()));
const partnerName = computed(() => entries.profiles[partnerId.value]?.display_name || 'Ceci');

function average(source: typeof entries.entries): string {
  if (!source.length) return '—';
  return (source.reduce((sum, entry) => sum + getSeasonAwareEntryScore(entry, entries.seasonRatings), 0) / source.length).toFixed(1);
}

function countType(type: 'movie' | 'series'): number {
  return mine.value.filter(entry => (entry.type || entry.media_type || 'movie') === type).length;
}

const stats = computed(() => [
  { value: mine.value.length, label: '我的记录' },
  { value: average(mine.value), label: '平均评分' },
  { value: lists.watchlist.length, label: '想看清单' },
  { value: couple.queue.length, label: '下次看' },
]);

const preferenceTags = computed(() => {
  const highRated = mine.value.filter(entry => getSeasonAwareEntryScore(entry, entries.seasonRatings) >= 8).length;
  const comments = mine.value.filter(entry => entry.comment?.trim()).length;
  return [
    `${countType('movie')} 部电影`,
    `${countType('series')} 部剧集`,
    `${highRated} 部高分收藏`,
    `${comments} 条观后感`,
  ];
});
</script>

<template>
  <section class="profile-panel" aria-labelledby="profile-heading">
    <header class="page-heading">
      <p class="eyebrow">PRIVATE SCREENING ARCHIVE</p>
      <h1 id="profile-heading">我的放映档案</h1>
      <p>身份、偏好与数据管理都集中在这里，原有账号能力保持完整。</p>
    </header>

    <div v-if="!session.isAuthenticated" class="profile-guest midnight-card">
      <span class="profile-monogram">F&amp;C</span>
      <div>
        <h2>登录后打开个人档案</h2>
        <p>公开发现与影库仍可浏览；记录、想看和双人功能会在登录后恢复。</p>
      </div>
      <div class="profile-actions">
        <button class="btn btn-secondary" type="button" @click="ui.openAuthModal('login')">登录</button>
        <button class="btn btn-primary" type="button" @click="ui.openAuthModal('register')">注册</button>
      </div>
    </div>

    <template v-else>
      <div class="identity-pair" aria-label="双人身份">
        <article class="identity-card fd-card">
          <span class="identity-mark">FD</span>
          <div><small>当前放映员</small><h2>{{ displayName }}</h2><p>{{ mine.length }} 条观影记录 · 均分 {{ average(mine) }}</p></div>
        </article>
        <span class="identity-link" aria-hidden="true">&amp;</span>
        <article class="identity-card ceci-card">
          <span class="identity-mark">C</span>
          <div><small>{{ partnerId ? 'Couple 档案' : '等待绑定' }}</small><h2>{{ partnerName }}</h2><p>{{ partnerId ? `${partnerEntries.length} 条记录 · 均分 ${average(partnerEntries)}` : '绑定后生成双人观影摘要' }}</p></div>
        </article>
      </div>

      <div class="profile-stats" aria-label="观影摘要">
        <article v-for="(stat, index) in stats" :key="stat.label" class="profile-stat" :style="{ '--delay': `${index * 45}ms` }">
          <strong>{{ stat.value }}</strong><span>{{ stat.label }}</span>
        </article>
      </div>

      <div class="profile-grid">
        <section class="midnight-card profile-preferences">
          <div class="card-heading"><div><p class="eyebrow">TASTE PROFILE</p><h2>观影偏好</h2></div></div>
          <div class="preference-list">
            <span v-for="(tag, index) in preferenceTags" :key="tag" :style="{ '--delay': `${180 + index * 55}ms` }">{{ tag }}</span>
          </div>
          <button class="text-action" type="button" @click="ui.navigate('library/stats')">查看完整统计 →</button>
        </section>

        <section class="midnight-card account-center">
          <div class="card-heading"><div><p class="eyebrow">ACCOUNT & ACCESS</p><h2>账号与关系</h2></div></div>
          <div class="account-action-grid">
            <button type="button" @click="ui.openAccountModal('changePassword')">修改密码</button>
            <button type="button" @click="ui.openAccountModal('couple')">Couple 关系</button>
            <button type="button" @click="ui.openAccountModal('blocked')">屏蔽管理</button>
            <button v-if="canManageInvites" type="button" @click="ui.openAccountModal('invites')">邀请码管理</button>
          </div>
          <label class="motion-setting">
            <span><strong>减少动态效果</strong><small>关闭位移、转盘和图表描边，只保留短暂淡化</small></span>
            <input type="checkbox" :checked="ui.reducedMotion" @change="ui.setReducedMotion(($event.target as HTMLInputElement).checked)">
          </label>
        </section>
      </div>

      <section class="midnight-card data-center">
        <div class="film-scan" aria-hidden="true"></div>
        <ImportExportToolbar @export-json="emit('exportJson')" @import-json="emit('importJson', $event)" />
        <button class="btn btn-secondary logout-action" type="button" @click="emit('logout')">退出登录</button>
      </section>
    </template>
  </section>
</template>

<style src="./styles.css"></style>
