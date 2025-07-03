import designConfig from '@tact/design/tailwind.config.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...designConfig,
  content: [
    './src/**/*.{html,js,svelte,ts}',
    '../../packages/ui/src/**/*.{svelte,ts,js}',
  ],
}; 