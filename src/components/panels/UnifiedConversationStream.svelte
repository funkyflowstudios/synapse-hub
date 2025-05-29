<script lang="ts">
	// Unified Conversation Stream - Center panel for conversation display and agent interaction
	export let width: string = '50%';
	
	// Placeholder conversation data
	const messages = [
		{
			id: 1,
			sender: 'user',
			content: 'Can you help me debug this React component?',
			timestamp: new Date(Date.now() - 300000)
		},
		{
			id: 2,
			sender: 'cursor',
			content: 'I\'d be happy to help! Please share the component code and describe the issue you\'re experiencing.',
			timestamp: new Date(Date.now() - 250000)
		},
		{
			id: 3,
			sender: 'user',
			content: 'Here\'s the component: [code block would go here]',
			timestamp: new Date(Date.now() - 200000)
		},
		{
			id: 4,
			sender: 'gemini',
			content: 'I can see the issue. The useEffect dependency array is missing a required dependency...',
			timestamp: new Date(Date.now() - 100000)
		}
	];
	
	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}
</script>

<main 
	class="unified-conversation-stream flex-1 bg-white dark:bg-slate-800 overflow-hidden"
	style="width: {width}"
	aria-label="Conversation Stream"
>
	<header class="border-b border-slate-200 dark:border-slate-700 p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Conversation Stream</h1>
			<div class="flex items-center gap-2">
				<!-- A2A Mode Toggle Placeholder -->
				<button class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-md text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
					A2A Mode
				</button>
				<button 
					class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
					aria-label="Settings"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
					</svg>
				</button>
			</div>
		</div>
	</header>

	<!-- Conversation Messages Area -->
	<div class="conversation-area h-full overflow-y-auto p-4 space-y-4">
		{#each messages as message (message.id)}
			<div class={`message-card ${message.sender === 'user' ? 'user-message' : 'agent-message'}`}>
				<div class="message-header">
					<span class="sender-name">
						{#if message.sender === 'user'}
							You
						{:else if message.sender === 'cursor'}
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 bg-blue-500 rounded-full"></span>
								Cursor
							</span>
						{:else if message.sender === 'gemini'}
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 bg-purple-500 rounded-full"></span>
								Gemini
							</span>
						{/if}
					</span>
					<span class="timestamp">{formatTime(message.timestamp)}</span>
				</div>
				<div class="message-content">
					{message.content}
				</div>
				
				<!-- Quick Actions for messages -->
				<div class="message-actions opacity-0 transition-opacity">
					<button class="action-btn" title="Copy message" aria-label="Copy message">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
					</button>
					<button class="action-btn" title="Quote message" aria-label="Quote message">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
						</svg>
					</button>
				</div>
			</div>
		{/each}
		
		<!-- A2A Visualization Placeholder -->
		<div class="a2a-visualization hidden">
			<div class="neural-network-placeholder bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg p-6 text-center">
				<p class="text-sm text-slate-600 dark:text-slate-400">A2A Neural Network Visualization</p>
				<p class="text-xs text-slate-500 dark:text-slate-500 mt-1">3D force-directed graph will render here</p>
				<!-- Placeholder for future WebGL visualization -->
				<div class="mt-4 grid grid-cols-3 gap-4">
					<div class="h-8 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
					<div class="h-8 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
					<div class="h-8 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	.unified-conversation-stream {
		/* CSS custom properties for future dynamic panel width manipulation */
		--panel-width: var(--conversation-stream-width, 50%);
		transition: width 200ms ease-in-out;
		display: flex;
		flex-direction: column;
	}
	
	.conversation-area {
		/* Prepare for virtualized scrolling */
		scroll-behavior: smooth;
	}
	
	.message-card {
		position: relative;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid;
		transition: all 200ms;
		backdrop-filter: blur(8px);
	}
	
	.user-message {
		background-color: rgb(239 246 255 / 1);
		border-color: rgb(191 219 254 / 1);
		margin-left: 2rem;
	}
	
	@media (prefers-color-scheme: dark) {
		.user-message {
			background-color: rgb(30 58 138 / 0.3);
			border-color: rgb(29 78 216 / 1);
		}
	}
	
	.agent-message {
		background-color: rgb(248 250 252 / 1);
		border-color: rgb(226 232 240 / 1);
		margin-right: 2rem;
	}
	
	@media (prefers-color-scheme: dark) {
		.agent-message {
			background-color: rgb(51 65 85 / 0.5);
			border-color: rgb(75 85 99 / 1);
		}
	}
	
	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	
	.sender-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(15 23 42 / 1);
	}
	
	@media (prefers-color-scheme: dark) {
		.sender-name {
			color: rgb(248 250 252 / 1);
		}
	}
	
	.timestamp {
		font-size: 0.75rem;
		color: rgb(100 116 139 / 1);
	}
	
	@media (prefers-color-scheme: dark) {
		.timestamp {
			color: rgb(148 163 184 / 1);
		}
	}
	
	.message-content {
		color: rgb(30 41 59 / 1);
		line-height: 1.625;
	}
	
	@media (prefers-color-scheme: dark) {
		.message-content {
			color: rgb(226 232 240 / 1);
		}
	}
	
	.message-actions {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		gap: 0.25rem;
	}
	
	.action-btn {
		padding: 0.25rem;
		color: rgb(148 163 184 / 1);
		transition: color 200ms;
		border-radius: 0.25rem;
	}
	
	.action-btn:hover {
		color: rgb(71 85 105 / 1);
	}
	
	@media (prefers-color-scheme: dark) {
		.action-btn:hover {
			color: rgb(226 232 240 / 1);
		}
	}
	
	/* Generative materiality preparation */
	.message-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}
	
	.message-card:hover .message-actions {
		opacity: 1;
	}
	
	/* Liquid crystal control effects */
	.message-card button {
		transition: all 200ms ease-in-out;
	}
</style> 