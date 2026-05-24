<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getSupabaseClient } from '../../api/supabase.js';
import { applyAuthenticatedUser } from '../../app/session.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';

defineOptions({ name: 'AuthOverlay' });

type AuthMode = 'login' | 'register' | 'reset' | 'newPassword';
type AuthUser = {
  id?: string;
  identities?: unknown[];
};
type AuthData = {
  user?: AuthUser | null;
  session?: { user?: AuthUser | null } | null;
};
type AuthStateSubscription = {
  data?: {
    subscription?: {
      unsubscribe?: () => void;
    };
  };
};

const session = useSessionStore();
const ui = useUiStore();

const mode = ref<AuthMode>('login');
const email = ref('');
const password = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerName = ref('');
const inviteCode = ref('');
const resetEmail = ref('');
const newPassword = ref('');
const errorMessage = ref('');
const busy = ref(false);
let removeAuthListener: { subscription?: { unsubscribe?: () => void } } | null = null;

const visible = computed(() => !session.isAuthenticated);
const subtitle = computed(() => {
  if (mode.value === 'register') return '创建账号';
  if (mode.value === 'reset') return '找回密码';
  if (mode.value === 'newPassword') return '设置新密码';
  return '欢迎回来';
});

function setMode(nextMode: AuthMode): void {
  mode.value = nextMode;
  errorMessage.value = '';
  if (nextMode === 'reset') resetEmail.value = email.value;
}

function showError(message: string): void {
  errorMessage.value = message;
}

function validateDisplayName(name: string): boolean {
  return /^[a-zA-Z0-9]{1,6}$/.test(name);
}

async function finishLogin(user: unknown): Promise<void> {
  await applyAuthenticatedUser(user as AuthUser);
}

async function login(): Promise<void> {
  if (!email.value.trim() || !password.value) {
    showError('请填写邮箱和密码');
    return;
  }
  busy.value = true;
  errorMessage.value = '';
  try {
    const db = getSupabaseClient();
    const { data, error } = await db.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });
    const authData = data as AuthData | null;
    if (error || !authData?.user) {
      showError('登录失败，请检查邮箱和密码');
      return;
    }
    await finishLogin(authData.user);
  } catch (error) {
    showError('错误: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    busy.value = false;
  }
}

async function register(): Promise<void> {
  const name = registerName.value.trim();
  const mail = registerEmail.value.trim();
  if (!mail || !registerPassword.value) {
    showError('请填写邮箱和密码');
    return;
  }
  if (!name) {
    showError('请填写显示名称');
    return;
  }
  if (!validateDisplayName(name)) {
    showError('用户名仅支持英文和数字，最多6位');
    return;
  }
  if (!inviteCode.value.trim()) {
    showError('请填写邀请码');
    return;
  }

  busy.value = true;
  errorMessage.value = '';
  try {
    const db = getSupabaseClient();
    const { data: valid, error: inviteError } = await db.rpc('claim_invite_code', { p_code: inviteCode.value.trim() });
    if (inviteError || !valid) {
      showError('邀请码无效或已用完');
      return;
    }

    const { data: duplicate } = await db
      .from('user_preferences')
      .select('user_id')
      .eq('display_name', name)
      .maybeSingle();
    if (duplicate) {
      showError('该用户名已被使用，请换一个');
      return;
    }

    const { data: signupResult, error: signupError } = await db.auth.signUp({
      email: mail,
      password: registerPassword.value,
      options: { data: { display_name: name } },
    });
    const signupData = signupResult as AuthData | null;
    if (signupError) {
      showError(signupError.message.includes('already registered') ? '该邮箱已注册，请直接登录' : signupError.message);
      return;
    }
    if (signupData?.user?.identities?.length === 0) {
      showError('该邮箱已注册，请直接登录');
      return;
    }

    const { data: loginResult, error: loginError } = await db.auth.signInWithPassword({
      email: mail,
      password: registerPassword.value,
    });
    const loginData = loginResult as AuthData | null;
    if (loginError || !loginData?.user) {
      showError('注册成功但登录失败，请尝试手动登录');
      return;
    }
    await finishLogin(loginData.user);
    ui.showToast('注册成功！');
  } catch (error) {
    showError('错误: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    busy.value = false;
  }
}

async function sendReset(): Promise<void> {
  const mail = resetEmail.value.trim();
  if (!mail) {
    showError('请输入邮箱');
    return;
  }
  busy.value = true;
  errorMessage.value = '';
  try {
    const db = getSupabaseClient();
    const { error } = await db.auth.resetPasswordForEmail(mail, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) {
      showError('发送失败: ' + error.message);
      return;
    }
    ui.showToast('重置邮件已发送，请查收并点击链接');
    setMode('login');
  } finally {
    busy.value = false;
  }
}

async function updatePassword(): Promise<void> {
  if (!newPassword.value || newPassword.value.length < 6) {
    showError('密码至少6位');
    return;
  }
  busy.value = true;
  errorMessage.value = '';
  try {
    const db = getSupabaseClient();
    const { error } = await db.auth.updateUser({ password: newPassword.value });
    if (error) {
      showError('更新失败: ' + error.message);
      return;
    }
    ui.showToast('密码已更新');
    const { data } = await db.auth.getSession();
    const authData = data as AuthData | null;
    if (authData?.session?.user) await finishLogin(authData.session.user);
    setMode('login');
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  const db = getSupabaseClient();
  const { data } = db.auth.onAuthStateChange((event: string) => {
    if (event === 'PASSWORD_RECOVERY') setMode('newPassword');
  }) as AuthStateSubscription;
  removeAuthListener = data ?? null;
});

onBeforeUnmount(() => {
  removeAuthListener?.subscription?.unsubscribe?.();
});
</script>

<template>
  <div v-if="visible" class="auth-overlay-vue">
    <div class="auth-box">
      <h1><span class="fd">FD</span>&amp;<span class="ce">Ceci</span></h1>
      <p class="subtitle">{{ subtitle }}</p>
      <div class="auth-error">{{ errorMessage }}</div>

      <form v-if="mode === 'login'" @submit.prevent="login">
        <input v-model="email" type="email" placeholder="邮箱" autocomplete="email">
        <input v-model="password" type="password" placeholder="密码" autocomplete="current-password">
        <button class="btn btn-primary" type="submit" :disabled="busy" style="width:100%">{{ busy ? '登录中...' : '登录' }}</button>
        <div style="text-align:center;margin-top:8px">
          <button class="link-button" type="button" @click="setMode('reset')">忘记密码？</button>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:0.85rem;color:var(--text2)">
          没有账号？<button class="link-button link-gold" type="button" @click="setMode('register')">注册</button>
        </div>
      </form>

      <form v-else-if="mode === 'register'" @submit.prevent="register">
        <input v-model="registerEmail" type="email" placeholder="邮箱" autocomplete="email">
        <input v-model="registerPassword" type="password" placeholder="密码（至少6位）" autocomplete="new-password">
        <input v-model="registerName" type="text" placeholder="显示名称（英文或数字，最多6位）">
        <input v-model="inviteCode" type="text" placeholder="邀请码">
        <button class="btn btn-primary" type="submit" :disabled="busy" style="width:100%">{{ busy ? '注册中...' : '注册' }}</button>
        <div style="text-align:center;margin-top:8px;font-size:0.85rem;color:var(--text2)">
          <button class="link-button link-gold" type="button" @click="setMode('login')">返回登录</button>
        </div>
      </form>

      <form v-else-if="mode === 'reset'" @submit.prevent="sendReset">
        <p style="color:var(--text2);font-size:0.8rem;margin-bottom:8px">输入邮箱，我们将发送重置链接</p>
        <input v-model="resetEmail" type="email" placeholder="邮箱" autocomplete="email">
        <button class="btn btn-primary" type="submit" :disabled="busy" style="width:100%;margin-bottom:6px">
          {{ busy ? '发送中...' : '发送重置邮件' }}
        </button>
        <button class="link-button" type="button" @click="setMode('login')">返回登录</button>
      </form>

      <form v-else @submit.prevent="updatePassword">
        <p style="color:var(--text2);font-size:0.8rem;margin-bottom:8px">设置新密码</p>
        <input v-model="newPassword" type="password" placeholder="新密码（至少6位）" autocomplete="new-password">
        <button class="btn btn-primary" type="submit" :disabled="busy" style="width:100%">
          {{ busy ? '更新中...' : '更新密码并登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
