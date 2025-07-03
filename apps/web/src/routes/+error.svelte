<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold text-foreground">
			{$page.status || 'Error'}
		</h1>
		<p class="text-lg text-muted-foreground">
			{$page.error?.message || 'Something went wrong'}
		</p>
		<a 
			href="/" 
			class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
		>
			Go Home
		</a>
	</div>
</div> 