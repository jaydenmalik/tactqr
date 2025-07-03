<script lang="ts">
  interface Props {
    class?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: any;
  }

  let {
    class: className = '',
    hover = false,
    padding = 'md',
    children
  }: Props = $props();

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  const hoverClasses = hover ? 'card-hover cursor-pointer' : '';
  
  const cardClasses = `${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`.trim();
</script>

<div class={cardClasses}>
  {@render children()}
</div> 