import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/tact' : ''
		},
		alias: {
			$lib: './src/lib',
			'@tact/core': '../../packages/core/src',
			'@tact/data': '../../packages/data/src',
			'@tact/ui': '../../packages/ui/src',
			'@tact/design': '../../packages/design/src'
		}
	}
};

export default config; 