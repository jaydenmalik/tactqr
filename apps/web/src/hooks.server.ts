import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      // Replace the theme placeholder with 'light' as default
      return html.replace('%sveltekit.theme%', 'light');
    }
  });

  return response;
}; 