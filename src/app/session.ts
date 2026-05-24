import { refreshVueData } from './data-sync.js';
import { getSupabaseClient } from '../api/supabase.js';
import { SESSION_KEY } from '../config/constants.js';
import { useCoupleStore } from '../stores/couple.js';
import { useEntriesStore } from '../stores/entries.js';
import { useListsStore } from '../stores/lists.js';
import { useSessionStore } from '../stores/session.js';
import { useUiStore } from '../stores/ui.js';
import type { Profile } from '../types/domain.js';

type UserLike = {
  id?: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
};

type AuthSession = {
  user?: UserLike | null;
};

type AuthSubscription = {
  data?: {
    subscription?: {
      unsubscribe?: () => void;
    };
  };
};

let sessionCheckTimer: number | null = null;
let removeVisibilityCheck: (() => void) | null = null;
let removeAuthListener: (() => void) | null = null;
let initializingUserId = '';
let lastSessionCheck = 0;

function userFromSession(data: unknown): UserLike | null {
  return ((data as { session?: AuthSession | null } | null)?.session?.user || null) as UserLike | null;
}

function sessionToken(): string {
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

function clearDataStores(): void {
  useEntriesStore().setEntries([]);
  useEntriesStore().setSeasonRatings([]);
  useEntriesStore().setProfiles({});
  useListsStore().setWatchlist([]);
  useListsStore().setBlockedMovies([]);
  const couple = useCoupleStore();
  couple.setActiveCouple(null);
  couple.setPendingCouples([]);
  couple.setPartnerProfileId(null);
  couple.setQueue([]);
  couple.setRecommendations([]);
  couple.setRecommendationState('idle');
}

async function loadCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseClient()
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message || '账号信息加载失败');
  return (data || null) as Profile | null;
}

export async function applyAuthenticatedUser(user: UserLike): Promise<void> {
  if (!user.id) throw new Error('登录信息缺少用户 ID');
  const session = useSessionStore();
  const ui = useUiStore();
  if (initializingUserId === user.id) return;
  initializingUserId = user.id;
  try {
    session.setRestoring(true);
    session.setUser(user, null);
    const profile = await loadCurrentProfile(user.id);
    if (profile) {
      const token = sessionToken();
      const { error } = await getSupabaseClient()
        .from('user_preferences')
        .update({ session_token: token })
        .eq('user_id', user.id);
      if (error) throw new Error(error.message || '会话刷新失败');
      session.setUser(user, { ...profile, session_token: token });
      await refreshVueData();
      startSessionTokenGuard();
    } else {
      clearDataStores();
      session.setUser(user, null);
    }
  } catch (error) {
    ui.showToast(error instanceof Error ? error.message : String(error));
    await logoutCurrentUser(false);
  } finally {
    session.setRestoring(false);
    initializingUserId = '';
  }
}

export async function saveDisplayName(name: string): Promise<Profile> {
  const session = useSessionStore();
  const user = session.currentUser as UserLike | null;
  const normalized = name.trim();
  if (!normalized) throw new Error('请输入显示名称');
  if (!/^[a-zA-Z0-9]{1,6}$/.test(normalized)) throw new Error('用户名仅支持英文和数字，最多6位');
  if (!user?.id) throw new Error('请先登录');

  const db = getSupabaseClient();
  const { data: duplicate } = await db
    .from('user_preferences')
    .select('user_id')
    .eq('display_name', normalized)
    .maybeSingle();
  if ((duplicate as Profile | null)?.user_id && (duplicate as Profile).user_id !== user.id) {
    throw new Error('该用户名已被使用');
  }

  const profile = { user_id: user.id, display_name: normalized, session_token: sessionToken() };
  const { error } = await db.from('user_preferences').upsert(profile);
  if (error) throw new Error(error.message || '名称保存失败');
  session.setUser(user, profile);
  await refreshVueData();
  startSessionTokenGuard();
  return profile;
}

async function checkSessionToken(): Promise<void> {
  const session = useSessionStore();
  const user = session.currentUser as UserLike | null;
  if (!user?.id || !session.currentProfile) return;
  const now = Date.now();
  if (now - lastSessionCheck < 5000) return;
  lastSessionCheck = now;
  const { data } = await getSupabaseClient()
    .from('user_preferences')
    .select('session_token')
    .eq('user_id', user.id)
    .maybeSingle();
  const remoteToken = (data as Profile | null)?.session_token;
  const localToken = sessionStorage.getItem(SESSION_KEY);
  if (remoteToken && localToken && remoteToken !== localToken) {
    useUiStore().showToast('账号已在其他位置登录');
    await logoutCurrentUser(false);
  }
}

export function startSessionTokenGuard(): void {
  if (sessionCheckTimer) window.clearInterval(sessionCheckTimer);
  removeVisibilityCheck?.();
  sessionCheckTimer = window.setInterval(() => void checkSessionToken(), 10000);
  const onVisibility = () => {
    if (!document.hidden) void checkSessionToken();
  };
  document.addEventListener('visibilitychange', onVisibility);
  removeVisibilityCheck = () => document.removeEventListener('visibilitychange', onVisibility);
}

export function stopSessionTokenGuard(): void {
  if (sessionCheckTimer) window.clearInterval(sessionCheckTimer);
  sessionCheckTimer = null;
  removeVisibilityCheck?.();
  removeVisibilityCheck = null;
}

export async function initializeVueSession(): Promise<void> {
  const session = useSessionStore();
  session.setRestoring(true);
  try {
    const db = getSupabaseClient();
    const { data, error } = await db.auth.getSession();
    if (error) throw new Error(error.message || '会话恢复失败');
    const user = userFromSession(data);
    if (user) await applyAuthenticatedUser(user);
    else {
      session.clearSession();
      clearDataStores();
    }

    if (!removeAuthListener) {
      const result = db.auth.onAuthStateChange((event: string, nextSession: unknown) => {
        const authUser = (nextSession as AuthSession | null)?.user || null;
        if (event === 'SIGNED_OUT') {
          stopSessionTokenGuard();
          sessionStorage.removeItem(SESSION_KEY);
          session.clearSession();
          clearDataStores();
          return;
        }
        if (authUser && ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          void applyAuthenticatedUser(authUser as UserLike);
        }
      }) as AuthSubscription;
      const subscription = result.data?.subscription;
      removeAuthListener = () => subscription?.unsubscribe?.();
    }
  } catch (error) {
    useUiStore().showToast(error instanceof Error ? error.message : String(error));
    session.clearSession();
    clearDataStores();
  } finally {
    session.setRestoring(false);
  }
}

export async function logoutCurrentUser(signOut = true): Promise<void> {
  stopSessionTokenGuard();
  if (signOut) await getSupabaseClient().auth.signOut();
  sessionStorage.removeItem(SESSION_KEY);
  useSessionStore().clearSession();
  clearDataStores();
  useUiStore().setActiveTab('rate');
}
