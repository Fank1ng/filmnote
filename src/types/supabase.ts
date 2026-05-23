export type QueryResult<T = unknown> = Promise<{
  data: T | null;
  error: { message: string; code?: string } | null;
}>;

export type SupabaseQueryBuilder<T = unknown> = {
  select(columns?: string): SupabaseQueryBuilder<T>;
  insert(payload: unknown): SupabaseQueryBuilder<T>;
  update(payload: unknown): SupabaseQueryBuilder<T>;
  upsert(payload: unknown): SupabaseQueryBuilder<T>;
  delete(): SupabaseQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
  or(filter: string): SupabaseQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder<T>;
  maybeSingle(): QueryResult<T>;
  single(): QueryResult<T>;
  then<TResult1 = { data: T | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
};

export type SupabaseAuth = {
  getSession(): QueryResult<{ session: unknown }>;
  signOut(): QueryResult;
  signInWithPassword(credentials: unknown): QueryResult;
  signUp(credentials: unknown): QueryResult;
  resetPasswordForEmail(email: string, options?: unknown): QueryResult;
  updateUser(payload: unknown): QueryResult;
  onAuthStateChange(callback: (event: string, session: unknown) => void): unknown;
};

export type SupabaseClient = {
  auth: SupabaseAuth;
  from<T = unknown>(table: string): SupabaseQueryBuilder<T>;
  rpc<T = unknown>(fn: string, args?: unknown): QueryResult<T>;
  channel(name: string): unknown;
};

export type SupabaseFactory = {
  createClient(url: string, key: string): SupabaseClient;
};
