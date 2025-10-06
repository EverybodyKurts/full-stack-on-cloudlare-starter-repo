import { DurableObject } from 'cloudflare:workers';

export class EvaluationScheduler extends DurableObject {
  count: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.count = (await ctx.storage.get<number>('count')) || this.count;
    });
  }

  async increment(): Promise<number> {
    this.count++;
    await this.ctx.storage.put('count', this.count);
    return this.count;
  }

  async getCount(): Promise<number> {
    return this.count;
  }
}
