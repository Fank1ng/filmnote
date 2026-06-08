<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import { useDocumentEvent } from '../composables/useDocumentEvent.js';

defineOptions({ name: 'AppHeader' });

const emit = defineEmits<{
  changePassword: [];
  login: [];
  manageInvites: [];
  manageBlocked: [];
  manageCouple: [];
  register: [];
  logout: [];
}>();

type UserLike = {
  id?: string;
  email?: string;
};

const session = useSessionStore();
const entries = useEntriesStore();
const open = ref(false);

const currentUser = computed(() => session.currentUser as UserLike | null);
const authenticated = computed(() => session.isAuthenticated);
const displayName = computed(() => {
  return session.currentProfile?.display_name || currentUser.value?.email?.split('@')[0] || '...';
});
const normalizedName = computed(() => displayName.value.toLowerCase());
const canManageInvites = computed(() => normalizedName.value === 'fank1ng' || normalizedName.value === 'ceci');
const userColor = computed(() => {
  if (normalizedName.value === 'fank1ng') return '#d4a853';
  if (normalizedName.value === 'ceci') return '#FF69B4';
  return '#5b9db0';
});
const headerCount = computed(() => {
  const userId = currentUser.value?.id;
  if (!userId) return '公开浏览';
  const movieCount = entries.entries.filter(entry => entry.user_id === userId && (entry.type || entry.media_type) === 'movie').length;
  const seriesCount = entries.entries.filter(entry => entry.user_id === userId && (entry.type || entry.media_type) === 'series').length;
  const parts: string[] = [];
  if (movieCount) parts.push(`${movieCount}部电影`);
  if (seriesCount) parts.push(`${seriesCount}部剧集`);
  return parts.length ? `共 ${parts.join(' ')}` : '暂无记录';
});

function toggleMenu(): void {
  open.value = !open.value;
}

function closeMenu(): void {
  open.value = false;
}

function run(action: () => void): void {
  closeMenu();
  action();
}

function onDocumentClick(): void {
  closeMenu();
}

useDocumentEvent('click', onDocumentClick);
</script>

<template>
  <header>
    <div class="logo"><span class="fd">FD</span>&amp;<span class="ce">Ceci</span></div>
    <div class="header-right">
      <span class="header-count">{{ headerCount }}</span>
      <div v-if="!authenticated" class="guest-auth-actions">
        <button type="button" class="link-button" @click="emit('login')">登录</button>
        <button type="button" class="btn btn-sm btn-primary" @click="emit('register')">注册</button>
      </div>
      <div v-else class="user-menu" :class="{ open }" @click.stop="toggleMenu">
        <span class="user-badge" :style="{ color: userColor }">{{ displayName }}</span>
        <span class="user-arrow">▾</span>
        <div class="user-dropdown">
          <button type="button" @click.stop="run(() => emit('changePassword'))">修改密码</button>
          <button type="button" @click.stop="run(() => emit('manageCouple'))">Couple 关系</button>
          <button v-if="canManageInvites" type="button" @click.stop="run(() => emit('manageInvites'))">邀请码管理</button>
          <button type="button" @click.stop="run(() => emit('manageBlocked'))">管理屏蔽</button>
          <button type="button" @click.stop="run(() => emit('logout'))">退出</button>
        </div>
      </div>
    </div>
  </header>
</template>
