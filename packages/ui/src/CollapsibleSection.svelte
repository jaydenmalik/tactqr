<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		icon?: string;
		open?: boolean;
		children: any;
		onToggle?: (open: boolean) => void;
	}
	
	let { title, subtitle, icon, open = false, children, onToggle }: Props = $props();
	let isOpen = $state(open);
	
	function toggle() {
		isOpen = !isOpen;
		onToggle?.(isOpen);
	}
</script>

<div class="border border-border rounded-lg overflow-hidden bg-card">
	<button 
		onclick={toggle}
		class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		aria-expanded={isOpen}
	>
		<div class="flex items-center gap-3">
			{#if icon}
				<span class="text-xl">{icon}</span>
			{/if}
			<div>
				<h2 class="font-semibold text-lg">{title}</h2>
				{#if subtitle}
					<p class="text-sm text-muted-foreground">{subtitle}</p>
				{/if}
			</div>
		</div>
		<svg 
			class="w-5 h-5 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			fill="none" 
			stroke="currentColor" 
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	
	{#if isOpen}
		<div class="border-t border-border">
			<div class="p-4">
				{@render children()}
			</div>
		</div>
	{/if}
</div> 