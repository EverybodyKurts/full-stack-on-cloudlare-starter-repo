import { WorkerEntrypoint } from 'cloudflare:workers';
import { App } from './hono/app';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';

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
        // Process the valid message
        console.log('Valid message:', parsedMessage.data);
        const event = parsedMessage.data;
        if (event.type === 'LINK_CLICK') {
        }
      } else {
        console.error('Invalid message format:', parsedMessage.error);
      }
    }
  }
}
