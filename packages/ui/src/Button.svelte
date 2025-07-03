<script lang="ts">
  type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  type ButtonSize = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (event: MouseEvent) => void;
    children: any;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    class: className = '',
    onclick,
    children
  }: Props = $props();

  // Compute classes based on variant and size
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg'
  };

  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button
  class={buttonClasses}
  {type}
  disabled={disabled || loading}
  onclick={onclick}
>
  {#if loading}
    <div class="w-4 h-4 spinner mr-2"></div>
  {/if}
  {@render children()}
</button> 