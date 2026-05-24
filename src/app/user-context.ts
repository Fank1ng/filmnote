type UserLike = {
  id?: string;
  [key: string]: unknown;
};

export function getLegacyCurrentUser<T extends UserLike = UserLike>(): T | null {
  return null;
}

export function getCurrentUser<T extends UserLike = UserLike>(piniaUser: unknown): T | null {
  return (piniaUser as T | null) || null;
}

export function getCurrentUserId(piniaUser: unknown): string {
  return getCurrentUser(piniaUser)?.id || '';
}
