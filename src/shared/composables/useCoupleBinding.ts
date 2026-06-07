import { computed, ref } from 'vue';
import {
  bindCouple,
  cancelCoupleDisconnect,
  confirmCouple,
  deleteCouple,
  requestCoupleDisconnect,
} from '../../api/couple-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getCurrentUserId } from '../../app/user-context.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { Couple, Profile } from '../../types/domain.js';
import { useConfirm } from './useConfirm.js';

type UserColor = {
  main: string;
  dim: string;
};

const search = ref('');

export function useCoupleBinding() {
  const couple = useCoupleStore();
  const entries = useEntriesStore();
  const session = useSessionStore();
  const ui = useUiStore();
  const { confirmAction } = useConfirm();

  const currentUserId = computed(() => getCurrentUserId(session.currentUser));
  const currentProfile = computed(() => session.currentProfile);
  const activeCouple = computed(() => couple.activeCouple as Couple | null);
  const partnerId = computed(() => {
    const active = activeCouple.value;
    if (!active || !currentUserId.value) return '';
    return active.user_a === currentUserId.value ? active.user_b || '' : active.user_a || '';
  });
  const partnerProfile = computed<Profile | null>(() => partnerId.value ? entries.profiles[partnerId.value] || null : null);
  const partnerName = computed(() => partnerProfile.value?.display_name || '对方');
  const pendingReceived = computed(() => activeCouple.value ? [] : couple.pendingCouples.filter(item => item.requested_by !== currentUserId.value));
  const pendingSent = computed(() => activeCouple.value ? [] : couple.pendingCouples.filter(item => item.requested_by === currentUserId.value));
  const unavailableUserIds = computed(() => {
    const ids = new Set<string>([currentUserId.value, partnerId.value].filter(Boolean));
    couple.pendingCouples.forEach(item => {
      if (item.user_a) ids.add(item.user_a);
      if (item.user_b) ids.add(item.user_b);
    });
    return ids;
  });
  const bindableUsers = computed(() => {
    const query = search.value.trim().toLowerCase();
    return Object.values(entries.profiles)
      .filter(profile => profile.user_id && !unavailableUserIds.value.has(profile.user_id))
      .filter(profile => !query || (profile.display_name || '').toLowerCase().includes(query))
      .slice(0, 8);
  });
  const disconnectRequester = computed(() => String(activeCouple.value?.disconnect_requested_by || ''));
  const disconnectByMe = computed(() => !!disconnectRequester.value && disconnectRequester.value === currentUserId.value);
  const disconnectByPartner = computed(() => !!disconnectRequester.value && !disconnectByMe.value);
  const disconnectText = computed(() => disconnectByMe.value ? '撤销解除申请' : (disconnectByPartner.value ? '同意解除 Couple' : '申请解除 Couple'));
  const disconnectClass = computed(() => disconnectByPartner.value ? 'btn-primary' : (disconnectByMe.value ? 'btn-secondary' : 'btn-danger'));
  const myColor = computed(() => userColor(currentUserId.value));
  const partnerColor = computed(() => userColor(partnerId.value));

  function displayName(userId: string | undefined, fallback = '未知'): string {
    return userId ? entries.profiles[userId]?.display_name || fallback : fallback;
  }

  function userColor(userId: string): UserColor {
    const name = displayName(userId, '').toLowerCase();
    if (name === 'fank1ng') return { main: '#d4a853', dim: '#3a3020' };
    if (name === 'ceci') return { main: '#FF69B4', dim: '#2a1525' };
    return { main: '#5b9db0', dim: '#1a2a30' };
  }

  function otherUserId(item: Couple): string {
    return item.user_a === currentUserId.value ? item.user_b || '' : item.user_a || '';
  }

  async function bindUser(userId: string): Promise<void> {
    if (!currentUserId.value || !userId || userId === currentUserId.value) return;
    if (activeCouple.value) {
      ui.showToast('已经绑定 Couple');
      return;
    }
    const { error } = await bindCouple(currentUserId.value, userId);
    if (error) {
      const message = error.message || '';
      ui.showToast(/schema cache|does not exist|relation|couples/i.test(message)
        ? 'Couple 表尚未创建，请先执行升级 SQL'
        : (/user already has an active couple/i.test(message)
          ? '对方或你已经绑定 Couple'
          : `绑定请求失败: ${message}`));
      return;
    }
    search.value = '';
    ui.showToast('已发送绑定请求');
    await refreshVueData();
  }

  async function confirmBinding(coupleId: string | number): Promise<void> {
    if (activeCouple.value) {
      ui.showToast('已经绑定 Couple，不能确认新的绑定请求');
      return;
    }
    const { error } = await confirmCouple(coupleId);
    if (error) {
      ui.showToast(`确认失败: ${error.message}`);
      return;
    }
    ui.showToast('Couple 已绑定');
    await refreshVueData();
  }

  async function disconnect(coupleId: string | number): Promise<void> {
    const target = String(activeCouple.value?.id) === String(coupleId)
      ? activeCouple.value
      : couple.pendingCouples.find(item => String(item.id) === String(coupleId)) || null;
    const wasActive = target?.status === 'active';
    if (wasActive) {
      const requester = String(target?.disconnect_requested_by || '');
      if (!requester) {
        if (!confirmAction('将向对方发送解除 Couple 申请，对方同意后才会解除。确认发送？')) return;
        const { error } = await requestCoupleDisconnect(coupleId, currentUserId.value);
        if (error) {
          ui.showToast(/schema cache|does not exist|relation|disconnect_requested_by|column/i.test(error.message || '')
            ? 'Couple 表尚未升级，请先执行解除申请升级 SQL'
            : `发送解除申请失败: ${error.message}`);
          return;
        }
        ui.showToast('已发送解除申请');
        await refreshVueData();
        return;
      }
      if (requester === currentUserId.value) {
        const { error } = await cancelCoupleDisconnect(coupleId);
        if (error) {
          ui.showToast(`撤销解除申请失败: ${error.message}`);
          return;
        }
        ui.showToast('已撤销解除申请');
        await refreshVueData();
        return;
      }
      if (!confirmAction('对方请求解除 Couple。同意后，共享下次看队列也会一起删除，确认同意？')) return;
    }
    const { error } = await deleteCouple(coupleId);
    if (error) {
      ui.showToast(`${wasActive ? '同意解除失败' : '撤销失败'}: ${error.message}`);
      return;
    }
    ui.showToast(wasActive ? '已同意解除 Couple' : '已撤销绑定请求');
    await refreshVueData();
  }

  return {
    activeCouple,
    bindableUsers,
    bindUser,
    confirmBinding,
    currentProfile,
    currentUserId,
    disconnect,
    disconnectByMe,
    disconnectByPartner,
    disconnectClass,
    disconnectRequester,
    disconnectText,
    displayName,
    myColor,
    otherUserId,
    partnerColor,
    partnerId,
    partnerName,
    partnerProfile,
    pendingReceived,
    pendingSent,
    search,
    userColor,
  };
}
