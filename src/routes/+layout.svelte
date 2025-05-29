<script lang="ts">
	import '../app.css';
	import MainLayoutShell from '../components/layout/MainLayoutShell.svelte';

	let { children } = $props();
</script>

<MainLayoutShell />

<!-- Hide the original children for now since our layout shell is complete -->
<div class="hidden">
	{@render children()}
</div>
