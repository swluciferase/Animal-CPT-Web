/**
 * Cloudflare Pages middleware.
 * Block direct access via velomynd.sigmacog.xyz.
 * Requests via proxy (animal-cpt-web.pages.dev) pass through.
 */
export async function onRequest({ request, next }) {
  const host = new URL(request.url).hostname;
  if (host === 'velomynd.sigmacog.xyz') {
    return new Response('Access denied', { status: 403 });
  }
  return next();
}
