export interface Env {
  TMDB_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  TMDB_CACHE?: KVNamespace;
}

export type WorkerExecutionContext = ExecutionContext;

export type ScheduledController = ScheduledEvent;
