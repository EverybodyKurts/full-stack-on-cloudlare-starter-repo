import { getLink } from '@repo/data-ops/queries/links';
import { linkSchema, LinkSchemaType } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import moment from 'moment';

async function getLinkInfoFromKv(env: Env, id: string): Promise<LinkSchemaType | null> {
  const linkInfo = await env.CACHE.get(id, { type: 'json' });
  if (!linkInfo) return null;

  try {
    return linkSchema.parse(linkInfo);
  } catch (error) {
    console.error('Failed to parse link info from KV:', error);
    return null;
  }
}

async function saveLinkInfoToKv(env: Env, id: string, linkInfo: LinkSchemaType): Promise<void> {
  try {
    await env.CACHE.put(id, JSON.stringify(linkInfo), { expirationTtl: 60 * 60 * 24 }); // Cache for 1 day
  } catch (error) {
    console.error('Failed to save link info to KV:', error);
  }
}

export async function getRoutingDestinations(env: Env, id: string): Promise<LinkSchemaType | null> {
  const linkInfo = await getLinkInfoFromKv(env, id);
  if (linkInfo) return linkInfo;

  const linkInfoFromDb = await getLink(id);
  if (!linkInfoFromDb) return null;

  await saveLinkInfoToKv(env, id, linkInfoFromDb);
  return linkInfoFromDb;
}

export function getDestinationForCountry(linkInfo: LinkSchemaType, countryCode?: string): string {
  if (!countryCode) {
    return linkInfo.destinations.default;
  }

  // Check if the country code exists in destinations
  if (linkInfo.destinations[countryCode]) {
    return linkInfo.destinations[countryCode];
  }

  // Fallback to default
  return linkInfo.destinations.default;
}

export async function scheduleEvalWorkflow(env: Env, event: LinkClickMessageType) {
  const doId = env.EVALUATION_SCHEDULER.idFromName(`${event.data.id}:${event.data.destination}`);
  const stub = env.EVALUATION_SCHEDULER.get(doId);
  await stub.collectLinkClick(event.data.accountId, event.data.id, event.data.destination, event.data.country || 'UNKNOWN');
}

export async function captureLinkClickInBackground(env: Env, event: LinkClickMessageType) {
  await env.QUEUE.send(event);
  const doId = env.LINK_CLICK_TRACKER.idFromName(event.data.accountId);
  const stub = env.LINK_CLICK_TRACKER.get(doId);
  if (!event.data.latitude || !event.data.longitude || !event.data.country) return;
  await stub.addClick(event.data.latitude, event.data.longitude, event.data.country, moment().valueOf());
}
