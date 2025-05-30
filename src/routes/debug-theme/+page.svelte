<script>
	import { onMount } from 'svelte';

	let domTheme = '';
	let storedTheme = '';
	let computedBgColor = '';

	function debugTheme() {
		if (typeof window === 'undefined') return;

		// Get stored theme
		storedTheme = localStorage.getItem('synapse-theme') || 'none';

		// Get DOM theme
		domTheme = document.documentElement.getAttribute('data-theme') || 'none';

		// Get computed background color
		computedBgColor = getComputedStyle(document.body).backgroundColor;

		console.log('Debug theme info:', { storedTheme, domTheme, computedBgColor });
	}

	function forceApplyTheme(theme) {
		console.log('Forcing theme:', theme);

		// Apply to DOM
		document.documentElement.setAttribute('data-theme', theme);

		// Save to storage
		localStorage.setItem('synapse-theme', theme);

		// Force reflow
		document.body.style.display = 'none';
		void document.body.offsetHeight; // Use void to indicate intentional expression
		document.body.style.display = '';

		// Update debug info
		setTimeout(debugTheme, 100);
	}

	onMount(() => {
		debugTheme();

		// Refresh debug info every second
		const interval = setInterval(debugTheme, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Theme Debug - Synapse Hub</title>
</svelte:head>

<div class="debug-container">
	<h1>Theme Debug Page</h1>

	<div class="debug-info">
		<h2>Current Theme State</h2>
		<p><strong>Stored in localStorage:</strong> {storedTheme}</p>
		<p><strong>Applied to DOM (data-theme):</strong> {domTheme}</p>
		<p><strong>Computed background color:</strong> {computedBgColor}</p>
	</div>

	<div class="theme-controls">
		<h2>Force Apply Theme</h2>
		<button on:click={() => forceApplyTheme('light')}>Force Light</button>
		<button on:click={() => forceApplyTheme('dark')}>Force Dark</button>
		<button on:click={() => forceApplyTheme('twilight')}>Force Twilight</button>
		<button on:click={() => forceApplyTheme('auto')}>Force Auto</button>
	</div>

	<div class="color-samples">
		<h2>Theme Colors Test</h2>
		<div class="color-sample primary">Primary Background</div>
		<div class="color-sample secondary">Secondary Background</div>
		<div class="color-sample text">Primary Text</div>
	</div>
</div>

<style>
	.debug-container {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
		background: var(--color-surface-primary);
		color: var(--color-text-primary);
		min-height: 100vh;
	}

	.debug-info,
	.theme-controls,
	.color-samples {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid var(--color-border-primary);
		border-radius: 0.5rem;
		background: var(--color-surface-secondary);
	}

	.theme-controls button {
		margin: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-interactive-primary);
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.theme-controls button:hover {
		background: var(--color-interactive-primary-hover);
	}

	.color-sample {
		padding: 1rem;
		margin: 0.5rem 0;
		border-radius: 0.25rem;
	}

	.color-sample.primary {
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-primary);
	}

	.color-sample.secondary {
		background: var(--color-background-secondary);
		border: 1px solid var(--color-border-primary);
	}

	.color-sample.text {
		color: var(--color-text-primary);
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
	}
</style>
