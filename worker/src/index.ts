import { handleRequest, handleScheduled } from './routes';
import type { Env, ScheduledController, WorkerExecutionContext } from './worker-types';

export default {
  fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },

  scheduled(event: ScheduledController, env: Env, ctx: WorkerExecutionContext): void {
    handleScheduled(event, env, ctx);
  },
};
