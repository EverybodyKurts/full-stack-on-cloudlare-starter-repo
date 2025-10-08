import { WorkerEntrypoint } from 'cloudflare:workers';
import { App } from './hono/app';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { handleLinkClick } from './queue-handlers/link-clicks';
export { DestinationEvaluationWorkflow } from './workflows/destination-evaluation-workflow';
export { EvaluationScheduler } from './durable-objects/evaluation-scheduler';
export { LinkClickTracker } from './durable-objects/link-click-tracker';

export default class DataService extends WorkerEntrypoint<Env> {
  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);

    initDatabase(env.DB);
  }

  fetch(request: Request) {
    return App.fetch(request, this.env, this.ctx);
  }

  async queue(batch: MessageBatch<unknown>): Promise<void> {
    for (const message of batch.messages) {
      console.log('Message Body:', message.body);
      const parsedMessage = QueueMessageSchema.safeParse(message.body);
      if (parsedMessage.success) {
        const event = parsedMessage.data;

        if (event.type === 'LINK_CLICK') {
          await handleLinkClick(this.env, event);
        }
      } else {
        console.error('Invalid message format:', parsedMessage.error);
      }
    }
  }
}
