<script lang="ts">
	import '../app.css';
	import MainLayoutShell from '../components/layout/MainLayoutShell.svelte';
	import { themeService } from '../lib/theme';
	import { onMount } from 'svelte';

	let { children } = $props();
	
	// Initialize theme service on mount to ensure proper theme application
	onMount(() => {
		// Theme service auto-initializes, but this ensures it runs in browser context
		themeService.getCurrentTheme();
	});
</script>

<MainLayoutShell />

<!-- Hide the original children for now since our layout shell is complete -->
<div class="hidden">
	{@render children()}
</div>
