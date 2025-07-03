<script lang="ts">
	interface Option {
		value: string | number;
		label: string;
	}

	interface Props {
		id?: string;
		label?: string;
		value: string | number;
		options: Option[];
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		hint?: string;
		class?: string;
		onchange?: (value: string | number) => void;
	}

	let {
		id = `select-${Math.random().toString(36).slice(2)}`,
		label,
		value = $bindable(),
		options,
		placeholder,
		disabled = false,
		required = false,
		error,
		hint,
		class: className = '',
		onchange
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		value = target.value;
		onchange?.(value);
	}

	const selectClasses = `
    flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring 
    focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
    ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
    ${className}
  `.trim();
</script>

<div class="space-y-2">
  {#if label}
    <label for={id} class="text-sm font-medium leading-none">
      {label}
      {#if required}
        <span class="text-destructive ml-1">*</span>
      {/if}
    </label>
  {/if}
  
  <select
    {id}
    class={selectClasses}
    {disabled}
    {required}
    onchange={handleChange}
    bind:value={value}
    aria-invalid={error ? 'true' : 'false'}
    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
  >
    {#if placeholder}
      <option value="" disabled selected>{placeholder}</option>
    {/if}
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  
  {#if error}
    <p id="{id}-error" class="text-sm text-destructive" role="alert">
      {error}
    </p>
  {:else if hint}
    <p id="{id}-hint" class="text-sm text-muted-foreground">
      {hint}
    </p>
  {/if}
</div> 