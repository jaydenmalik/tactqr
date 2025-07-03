<script lang="ts">
	import Button from './Button.svelte';
	
	interface Props {
		title?: string;
		totalBalance?: number;
		monthlySpending?: number;
		currency?: string;
		onThemeToggle?: () => void;
		onExport?: () => void;
		theme?: 'light' | 'dark';
	}
	
	let { 
		title = "Budget Tracker", 
		totalBalance = 0, 
		monthlySpending = 0, 
		currency = "USD",
		onThemeToggle,
		onExport,
		theme = 'light'
	}: Props = $props();
	
	function formatMoney(amount: number, currencyCode: string = 'USD') {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currencyCode,
			minimumFractionDigits: 2,
		}).format(amount / 100);
	}
</script>

<div class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container flex h-16 items-center justify-between px-4">
		<!-- Left side - App title and key metrics -->
		<div class="flex items-center gap-6">
			<h1 class="text-xl font-bold">{title}</h1>
			<div class="hidden md:flex items-center gap-4 text-sm">
				<div class="flex items-center gap-1">
					<span class="text-muted-foreground">Balance:</span>
					<span class="font-medium text-success">{formatMoney(totalBalance, currency)}</span>
				</div>
				<div class="w-px h-4 bg-border"></div>
				<div class="flex items-center gap-1">
					<span class="text-muted-foreground">Monthly:</span>
					<span class="font-medium text-destructive">{formatMoney(monthlySpending, currency)}</span>
				</div>
			</div>
		</div>
		
		<!-- Right side - Actions -->
		<div class="flex items-center gap-2">
			{#if onExport}
				<Button variant="outline" size="sm" onclick={onExport}>
					{#snippet children()}
						<span class="hidden sm:inline">Export</span>
						<span class="sm:hidden">📊</span>
					{/snippet}
				</Button>
			{/if}
			
			{#if onThemeToggle}
				<Button variant="ghost" size="sm" onclick={onThemeToggle}>
					{#snippet children()}
						{#if theme === 'light'}
							🌙
						{:else}
							☀️
						{/if}
					{/snippet}
				</Button>
			{/if}
		</div>
	</div>
	
	<!-- Mobile metrics bar -->
	<div class="md:hidden border-t border-border bg-muted/30 px-4 py-2">
		<div class="flex justify-center gap-6 text-sm">
			<div class="flex items-center gap-1">
				<span class="text-muted-foreground">Balance:</span>
				<span class="font-medium text-success">{formatMoney(totalBalance, currency)}</span>
			</div>
			<div class="flex items-center gap-1">
				<span class="text-muted-foreground">Monthly:</span>
				<span class="font-medium text-destructive">{formatMoney(monthlySpending, currency)}</span>
			</div>
		</div>
	</div>
</div> 