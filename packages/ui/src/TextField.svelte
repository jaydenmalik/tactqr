<script lang="ts">
  type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

  interface Props {
    id?: string;
    label?: string;
    type?: InputType;
    value: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    hint?: string;
    class?: string;
    autocomplete?: string;
    onchange?: (value: string) => void;
    oninput?: (value: string) => void;
    onblur?: () => void;
    onfocus?: () => void;
  }

  let {
    id = `textfield-${Math.random().toString(36).slice(2)}`,
    label,
    type = 'text',
    value = $bindable(),
    placeholder,
    disabled = false,
    required = false,
    error,
    hint,
    class: className = '',
    autocomplete,
    onchange,
    oninput,
    onblur,
    onfocus
  }: Props = $props();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    oninput?.(target.value);
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onchange?.(target.value);
  }

  const inputClasses = `
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
    disabled:opacity-50 transition-colors
    ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
    ${className}
  `.trim();
</script>

<div class="space-y-2">
  {#if label}
    <label for={id} class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {label}
      {#if required}
        <span class="text-destructive ml-1">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    {id}
    {type}
    {value}
    {placeholder}
    {disabled}
    {required}
    {autocomplete}
    class={inputClasses}
    aria-invalid={error ? 'true' : 'false'}
    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
    oninput={handleInput}
    onchange={handleChange}
    onblur={onblur}
    onfocus={onfocus}
  />
  
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