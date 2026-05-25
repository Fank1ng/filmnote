<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getSupabaseClient } from '../../api/supabase.js';
import { generateInviteCode, loadInviteCodes } from '../../api/profile-api.js';
import { removeBlockedMovie as removeBlockedMovieRecord } from '../../api/list-api.js';
import { BaseModal, PaginationControls } from '../../shared/components/index.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';

defineOptions({ name: 'AccountModals' });

type UserLike = {
  id?: string;
};

type InviteCode = {
  code: string;
  expires_at?: string;
  use_count?: number;
  max_uses?: number;
};

const pageSize = 12;

const session = useSessionStore();
const lists = useListsStore();
const ui = useUiStore();

const password = ref('');
const inviteCodes = ref<InviteCode[]>([]);
const inviteLoading = ref(false);
const blockedPage = ref(1);
const busy = ref(false);
const errorMessage = ref('');

const currentUser = computed(() => session.currentUser as UserLike | null);
const changePasswordOpen = computed(() => ui.accountModal === 'changePassword');
const invitesOpen = computed(() => ui.accountModal === 'invites');
const blockedOpen = computed(() => ui.accountModal === 'blocked');
const activeInviteCodes = computed(() => {
  const now = Date.now();
  return inviteCodes.value.filter(code => {
    const expiresAt = code.expires_at ? new Date(code.expires_at).getTime() : 0;
    return expiresAt > now && (code.use_count ?? 0) < (code.max_uses ?? 1);
  });
});
const blockedMovies = computed(() => lists.blockedMovies);
const blockedTotalPages = computed(() => Math.max(1, Math.ceil(blockedMovies.value.length / pageSize)));
const blockedPageItems = computed(() => {
  const start = (blockedPage.value - 1) * pageSize;
  return blockedMovies.value.slice(start, start + pageSize);
});

function closeAccountModal(): void {
  ui.closeAccountModal();
  password.value = '';
  errorMessage.value = '';
}

function formatRemaining(code: InviteCode): string {
  if (!code.expires_at) return '';
  const remaining = Math.max(0, new Date(code.expires_at).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `剩余 ${hours}小时${minutes}分`;
}

async function changePassword(): Promise<void> {
  errorMessage.value = '';
  if (password.value.length < 6) {
    errorMessage.value = '密码至少6位';
    return;
  }
  busy.value = true;
  try {
    const { error } = await getSupabaseClient().auth.updateUser({ password: password.value });
    if (error) throw error;
    ui.showToast('密码已修改');
    closeAccountModal();
  } catch (error) {
    errorMessage.value = '修改失败: ' + (error instanceof Error ? error.message : String(error));
  } finally {
    busy.value = false;
  }
}

async function refreshInvites(): Promise<void> {
  inviteLoading.value = true;
  try {
    const { data, error } = await loadInviteCodes();
    if (error) throw error;
    inviteCodes.value = (data ?? []) as InviteCode[];
  } catch (error) {
    ui.showToast('邀请码加载失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    inviteLoading.value = false;
  }
}

async function createInviteCode(): Promise<void> {
  busy.value = true;
  try {
    const { data, error } = await generateInviteCode();
    if (error) throw error;
    ui.showToast('已生成: ' + String(data));
    await refreshInvites();
  } catch (error) {
    ui.showToast('生成失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    busy.value = false;
  }
}

async function copyInvite(code: string): Promise<void> {
  await navigator.clipboard.writeText(code);
  ui.showToast('已复制邀请码');
}

async function removeBlocked(tmdbId: number): Promise<void> {
  const userId = currentUser.value?.id;
  if (!userId) return;
  busy.value = true;
  try {
    await removeBlockedMovieRecord(userId, tmdbId);
    lists.setBlockedMovies(lists.blockedMovies.filter(item => item.tmdb_id !== tmdbId));
    if (blockedPage.value > blockedTotalPages.value) blockedPage.value = blockedTotalPages.value;
  } catch (error) {
    ui.showToast('操作失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    busy.value = false;
  }
}

watch(invitesOpen, open => {
  if (open) void refreshInvites();
});

watch(blockedOpen, open => {
  if (open) blockedPage.value = 1;
});
</script>

<template>
  <BaseModal :open="changePasswordOpen" max-width="380px" labelled-by="change-password-title" @close="closeAccountModal">
    <h3 id="change-password-title">修改密码</h3>
    <p class="modal-hint">输入新密码（至少6位）</p>
    <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>
    <input v-model="password" type="password" placeholder="新密码" @keyup.enter="changePassword">
    <div class="btn-group modal-actions">
      <button class="btn btn-secondary btn-sm" type="button" @click="closeAccountModal">取消</button>
      <button class="btn btn-primary btn-sm" type="button" :disabled="busy" @click="changePassword">
        {{ busy ? '保存中...' : '确认修改' }}
      </button>
    </div>
  </BaseModal>

  <BaseModal :open="invitesOpen" max-width="420px" labelled-by="invite-title" @close="closeAccountModal">
    <h3 id="invite-title">邀请码管理</h3>
    <div class="invite-toolbar">
      <button class="btn btn-primary btn-sm" type="button" :disabled="busy" @click="createInviteCode">
        {{ busy ? '生成中...' : '生成邀请码' }}
      </button>
      <span>有效期 3 小时，一码一人</span>
    </div>
    <div class="invite-list">
      <p v-if="inviteLoading" class="modal-hint">加载中...</p>
      <p v-else-if="!activeInviteCodes.length" class="modal-hint">暂无有效邀请码，点击上方按钮生成</p>
      <div v-for="code in activeInviteCodes" v-else :key="code.code" class="invite-row">
        <div>
          <code>{{ code.code }}</code>
          <span>{{ formatRemaining(code) }}</span>
        </div>
        <button class="btn btn-xs btn-secondary" type="button" @click="copyInvite(code.code)">复制</button>
      </div>
    </div>
    <div class="btn-group modal-actions">
      <button class="btn btn-secondary btn-sm" type="button" @click="closeAccountModal">关闭</button>
    </div>
  </BaseModal>

  <BaseModal :open="blockedOpen" max-width="680px" labelled-by="blocked-title" @close="closeAccountModal">
    <div class="modal-title-row">
      <h3 id="blocked-title">不再推荐的电影 ({{ blockedMovies.length }})</h3>
      <button class="btn btn-xs btn-secondary" type="button" @click="closeAccountModal">关闭</button>
    </div>
    <div v-if="!blockedMovies.length" class="empty-state">
      <p>暂无不推荐电影</p>
    </div>
    <div v-else class="discover-grid">
      <div v-for="item in blockedPageItems" :key="item.tmdb_id" class="discover-card">
        <div class="dc-poster-wrap">
          <div class="dc-no-poster">No poster</div>
        </div>
        <div class="dc-info">
          <div class="dc-title">TMDB #{{ item.tmdb_id }}</div>
          <div v-if="item.reason" class="dc-reasons">
            <span class="dc-reason">{{ item.reason }}</span>
          </div>
          <div class="dc-action">
            <button class="btn btn-xs btn-secondary" type="button" :disabled="busy" @click="removeBlocked(item.tmdb_id)">
              恢复推荐
            </button>
          </div>
        </div>
      </div>
    </div>
    <PaginationControls
      v-if="blockedMovies.length > pageSize"
      :page="blockedPage"
      :total-pages="blockedTotalPages"
      kind="blocked"
      @change="blockedPage = $event"
    />
  </BaseModal>
</template>
