import { getLink } from '@repo/data-ops/queries/links';
import { linkSchema, LinkSchemaType } from '@repo/data-ops/zod-schema/links';

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

export async function getRoutingDestination(env: Env, id: string): Promise<LinkSchemaType | null> {
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
