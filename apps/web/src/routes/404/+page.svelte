<script>
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Handle client-side routing for SPA
		const path = window.location.pathname;
		if (path !== `${base}/404`) {
			// Navigate to the requested path using SvelteKit router
			goto(path.replace(base, '') || '/');
		}
	});
</script>

<svelte:head>
	<title>Page Not Found - Tact</title>
</svelte:head>

<div class="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
	<div class="text-center">
		<h1 class="text-6xl font-bold mb-4">404</h1>
		<p class="text-xl mb-8">Oops! This page could not be found.</p>
		<a href="{base}/" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
			Go Back Home
		</a>
	</div>
</div> 