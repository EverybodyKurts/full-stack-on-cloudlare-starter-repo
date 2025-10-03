import { Hono } from 'hono';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { getDestinationForCountry, getRoutingDestination } from '@/helpers/route-ops';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
  const id = c.req.param('id');
  const linkInfo = await getRoutingDestination(c.env, id);

  if (!linkInfo) {
    return c.json({ message: 'Link not found' }, 404);
  }

  const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf);
  const headers = cfHeader.data;

  if (!cfHeader.success) {
    return c.text('Invalid Cloudflare headers', 400);
  }

  if (!headers) {
    return c.text('No Cloudflare header data found', 400);
  }

  const destination = getDestinationForCountry(linkInfo, headers.country);

  const queueMessage: LinkClickMessageType = {
    type: 'LINK_CLICK',
    data: {
      id: id,
      country: headers.country,
      destination: destination,
      accountId: linkInfo.accountId,
      latitude: headers.latitude,
      longitude: headers.longitude,
      timestamp: new Date().toISOString(),
    },
  };

  c.executionCtx.waitUntil(c.env.QUEUE.send(queueMessage));

  return c.redirect(destination);
});
