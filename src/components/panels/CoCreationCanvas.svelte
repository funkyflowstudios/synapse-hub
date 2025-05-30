<script lang="ts">
	// Co-Creation Canvas - Center panel for AI conversation
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	// Message interface
	interface Message {
		id: string;
		content: string;
		sender: 'user' | 'cursor' | 'gemini';
		timestamp: Date;
		type: 'text' | 'code' | 'file';
		files?: UploadedFile[];
		multicast: boolean;
	}

	interface UploadedFile {
		id: string;
		name: string;
		size: number;
		type: string;
		content?: string; // For text files
		dataUrl?: string; // For preview
		preview?: string; // Generated preview text
	}

	// Sample conversation
	let messages: Message[] = [
		{
			id: '1',
			content: "Welcome to Synapse Hub! I'm ready to help you with your development tasks.",
			sender: 'cursor',
			timestamp: new Date(Date.now() - 300000),
			type: 'text',
			multicast: false
		},
		{
			id: '2',
			content: 'Can you help me create a responsive navigation component for my SvelteKit app?',
			sender: 'user',
			timestamp: new Date(Date.now() - 240000),
			type: 'text',
			multicast: false
		},
		{
			id: '3',
			content:
				"I'll create a responsive navigation component for you. Here's a modern implementation with semantic HTML, mobile-friendly design, and accessibility features. The component will include a collapsible menu for mobile devices and clean styling that works across all screen sizes.",
			sender: 'cursor',
			timestamp: new Date(Date.now() - 180000),
			type: 'text',
			multicast: false
		}
	];

	// Scroll behavior
	let messagesContainer: HTMLElement;

	// AI Agent state - Updated for multi-selection
	let selectedAgents: Set<'cursor' | 'gemini'> = new Set(['cursor']);
	let cursorActive = true;
	let geminiActive = false;

	// A2A Collaboration state
	let a2aEnabled = false;

	// Voice input state
	let isListening = false;
	let isVoiceSupported = false;
	let recognition: SpeechRecognition | null = null;
	let messageText = '';

	// File upload state
	let uploadedFiles: UploadedFile[] = [];
	let fileInput: HTMLInputElement;
	let isDragOver = false;
	let isUploading = false;

	// Supported file types
	const supportedFileTypes = {
		images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
		documents: [
			'application/pdf',
			'text/plain',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		],
		code: [
			'text/javascript',
			'text/typescript',
			'text/html',
			'text/css',
			'application/json',
			'text/xml',
			'text/yaml'
		],
		spreadsheets: [
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		],
		all: function () {
			return [...this.images, ...this.documents, ...this.code, ...this.spreadsheets];
		}
	};

	// Check for voice support on component mount
	onMount(() => {
		// Check if speech recognition is supported
		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			isVoiceSupported = true;
			const SpeechRecognition =
				(window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition })
					.webkitSpeechRecognition || window.SpeechRecognition;
			recognition = new SpeechRecognition();

			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = 'en-US';

			recognition.onstart = () => {
				isListening = true;
			};

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let transcript = '';
				for (let i = event.resultIndex; i < event.results.length; i++) {
					transcript += event.results[i][0].transcript;
				}
				messageText = transcript;
			};

			recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
				console.error('Speech recognition error:', event.error);
				isListening = false;
			};

			recognition.onend = () => {
				isListening = false;
			};
		}

		// Set up drag and drop on the entire component
		const canvas = document.querySelector('.co-creation-canvas');
		if (canvas) {
			canvas.addEventListener('dragover', handleDragOver);
			canvas.addEventListener('drop', handleDrop);
			canvas.addEventListener('dragleave', handleDragLeave);
		}

		return () => {
			if (canvas) {
				canvas.removeEventListener('dragover', handleDragOver);
				canvas.removeEventListener('drop', handleDrop);
				canvas.removeEventListener('dragleave', handleDragLeave);
			}
		};
	});

	function scrollToBottom() {
		if (messagesContainer) {
			// Check if user is near the bottom (within 100px) before auto-scrolling
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

			// Only auto-scroll if user is near the bottom or hasn't scrolled manually
			if (isNearBottom || scrollTop === 0) {
				requestAnimationFrame(() => {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				});
			}
		}
	}

	function forceScrollToBottom() {
		if (messagesContainer) {
			// Always scroll to bottom - used when user sends a message
			// Use multiple approaches to ensure it works
			const scrollToEnd = () => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			};

			// Try immediately
			scrollToEnd();

			// Try with requestAnimationFrame
			requestAnimationFrame(() => {
				scrollToEnd();
			});

			// Try with a small delay to ensure DOM is updated
			setTimeout(() => {
				scrollToEnd();
			}, 10);
		}
	}

	function formatTimestamp(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;

		return date.toLocaleDateString();
	}

	function getAgentColor(sender: Message['sender']) {
		switch (sender) {
			case 'cursor':
				return 'var(--color-agent-cursor)';
			case 'gemini':
				return 'var(--color-agent-gemini)';
			default:
				return 'var(--color-text-secondary)';
		}
	}

	function selectAgent(agent: 'cursor' | 'gemini') {
		if (selectedAgents.has(agent)) {
			selectedAgents.delete(agent);
		} else {
			selectedAgents.add(agent);
		}
		selectedAgents = selectedAgents; // Trigger reactivity
		dispatch('agentSelected', { agents: Array.from(selectedAgents) });
	}

	function toggleA2A() {
		a2aEnabled = !a2aEnabled;
		dispatch('a2aToggle', { enabled: a2aEnabled });
	}

	function toggleVoiceInput() {
		if (!isVoiceSupported || !recognition) return;

		if (isListening) {
			recognition.stop();
		} else {
			recognition.start();
		}
	}

	function sendMessage() {
		if (selectedAgents.size === 0) {
			// Don't send if no agents selected
			return;
		}

		if (messageText.trim() || uploadedFiles.length > 0) {
			// Add message to conversation
			const newMessage = {
				id: Date.now().toString(),
				content: messageText.trim() || 'Shared files',
				sender: 'user' as const,
				timestamp: new Date(),
				type: uploadedFiles.length > 0 ? ('file' as const) : ('text' as const),
				files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
				multicast: selectedAgents.size > 1
			};

			messages = [...messages, newMessage];
			messageText = '';
			uploadedFiles = [];

			// Stop listening if currently active
			if (isListening && recognition) {
				recognition.stop();
			}

			// Force scroll to bottom immediately and after DOM update
			forceScrollToBottom();
			setTimeout(forceScrollToBottom, 100);

			dispatch('messagesSent', { message: newMessage, agents: Array.from(selectedAgents) });
		}
	}

	function handleKeypress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Initialize component
	onMount(() => {
		if (messages.length > 0) {
			setTimeout(scrollToBottom, 200);
		}
	});

	// File upload functions
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		// Only set to false if we're leaving the main container
		if (!event.relatedTarget || !(event.target as Element).contains(event.relatedTarget as Node)) {
			isDragOver = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = false;

		const files = Array.from(event.dataTransfer?.files || []);
		if (files.length > 0) {
			processFiles(files);
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		if (files.length > 0) {
			processFiles(files);
		}
		// Reset input
		target.value = '';
	}

	async function processFiles(files: File[]) {
		isUploading = true;

		for (const file of files) {
			// Check file size (10MB limit)
			if (file.size > 10 * 1024 * 1024) {
				console.warn(`File ${file.name} is too large (max 10MB)`);
				continue;
			}

			// Check file type
			const isSupported =
				supportedFileTypes.all().includes(file.type) ||
				file.name.match(
					/\.(js|ts|jsx|tsx|svelte|vue|py|java|cpp|c|h|cs|php|rb|go|rs|swift|kt|scala|sh|md|txt|log|env|config|ini|toml|sql|graphql|prisma)$/i
				);

			if (!isSupported) {
				console.warn(`File type ${file.type} not supported for ${file.name}`);
				continue;
			}

			try {
				const uploadedFile = await createUploadedFile(file);
				uploadedFiles = [...uploadedFiles, uploadedFile];
			} catch (error) {
				console.error(`Error processing file ${file.name}:`, error);
			}
		}

		isUploading = false;
	}

	async function createUploadedFile(file: File): Promise<UploadedFile> {
		const uploadedFile: UploadedFile = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			name: file.name,
			size: file.size,
			type: file.type || 'application/octet-stream'
		};

		// Handle different file types
		if (supportedFileTypes.images.includes(file.type)) {
			// For images, create a data URL for preview
			uploadedFile.dataUrl = await readFileAsDataURL(file);
		} else if (file.type.startsWith('text/') || isTextFile(file.name)) {
			// For text files, read the content
			uploadedFile.content = await readFileAsText(file);
			uploadedFile.preview =
				uploadedFile.content.substring(0, 200) + (uploadedFile.content.length > 200 ? '...' : '');
		} else {
			// For other files, just store basic info
			uploadedFile.preview = `${file.name} (${formatFileSize(file.size)})`;
		}

		return uploadedFile;
	}

	function readFileAsDataURL(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	function readFileAsText(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		});
	}

	function isTextFile(filename: string): boolean {
		const textExtensions = [
			'.js',
			'.ts',
			'.jsx',
			'.tsx',
			'.svelte',
			'.vue',
			'.py',
			'.java',
			'.cpp',
			'.c',
			'.h',
			'.cs',
			'.php',
			'.rb',
			'.go',
			'.rs',
			'.swift',
			'.kt',
			'.scala',
			'.sh',
			'.md',
			'.txt',
			'.log',
			'.env',
			'.config',
			'.ini',
			'.toml',
			'.sql',
			'.graphql',
			'.prisma',
			'.json',
			'.xml',
			'.yaml',
			'.yml',
			'.html',
			'.css',
			'.scss',
			'.sass',
			'.less'
		];
		return textExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function removeFile(fileId: string) {
		uploadedFiles = uploadedFiles.filter((file) => file.id !== fileId);
	}

	function triggerFileUpload() {
		fileInput?.click();
	}

	function getFileIcon(file: UploadedFile): string {
		if (supportedFileTypes.images.includes(file.type)) return '🖼️';
		if (file.type.includes('pdf')) return '📄';
		if (file.type.includes('word') || file.name.endsWith('.docx')) return '📝';
		if (file.type.includes('excel') || file.name.endsWith('.xlsx')) return '📊';
		if (file.type.includes('json') || file.name.endsWith('.json')) return '{}';
		if (file.name.match(/\.(js|ts|jsx|tsx)$/)) return '⚡';
		if (file.name.endsWith('.svelte')) return '🔥';
		if (file.name.endsWith('.vue')) return '💚';
		if (file.name.match(/\.(py|java|cpp|c|cs|php|rb|go|rs)$/)) return '💻';
		if (file.name.match(/\.(html|css|scss|sass)$/)) return '🎨';
		if (file.name.match(/\.(md|txt|log)$/)) return '📋';
		return '📁';
	}
</script>

<main
	class="co-creation-canvas glass-panel-secondary"
	class:drag-over={isDragOver}
	aria-label="Conversation"
>
	<!-- Drag & Drop Overlay -->
	{#if isDragOver}
		<div class="drag-overlay">
			<div class="drag-message">
				<div class="drag-icon">📁</div>
				<h3>Drop files here</h3>
				<p>Images, documents, code files supported</p>
			</div>
		</div>
	{/if}

	<!-- Conversation Stream -->
	<div class="conversation-stream" bind:this={messagesContainer}>
		{#each messages as message (message.id)}
			<article
				class="message bubble-3d"
				class:user-message={message.sender === 'user'}
				class:ai-message={message.sender !== 'user'}
				class:user-bubble={message.sender === 'user'}
				class:ai-bubble={message.sender !== 'user'}
			>
				<!-- Message Header -->
				<header class="message-header">
					<div class="sender-info">
						<div class="sender-avatar" style="background: {getAgentColor(message.sender)}">
							{message.sender === 'user' ? 'U' : message.sender.charAt(0).toUpperCase()}
						</div>
						<div class="sender-details">
							<span class="sender-name">
								{message.sender === 'user'
									? 'You'
									: message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}
							</span>
							<time class="message-timestamp">
								{formatTimestamp(message.timestamp)}
							</time>
						</div>
					</div>
					{#if message.multicast && message.sender === 'user'}
						<div class="multicast-indicator">
							<span class="multicast-icon">📡</span>
							<span class="multicast-text">Sent to multiple AIs</span>
						</div>
					{/if}
				</header>

				<!-- Message Content -->
				<div class="message-content">
					{message.content}
				</div>

				<!-- File Attachments -->
				{#if message.files && message.files.length > 0}
					<div class="message-files">
						{#each message.files as file (file.id)}
							<div class="file-attachment">
								<div class="file-header">
									<span class="file-icon">{getFileIcon(file)}</span>
									<div class="file-info">
										<span class="file-name">{file.name}</span>
										<span class="file-size">{formatFileSize(file.size)}</span>
									</div>
								</div>
								{#if file.dataUrl && supportedFileTypes.images.includes(file.type)}
									<div class="file-preview image-preview">
										<img src={file.dataUrl} alt={file.name} loading="lazy" />
									</div>
								{:else if file.preview && file.content}
									<div class="file-preview text-preview">
										<pre><code>{file.preview}</code></pre>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</article>
		{/each}
	</div>

	<!-- Message Input -->
	<div class="message-input-area">
		<!-- AI Agent Selection -->
		<div class="agent-selector">
			<div class="agent-selector-main">
				<span class="agent-label">AI Assistant:</span>
				<div class="agent-buttons">
					<button
						class="agent-btn button-3d"
						class:active={selectedAgents.has('cursor')}
						on:click={() => selectAgent('cursor')}
					>
						<div class="agent-indicator cursor" class:active={selectedAgents.has('cursor')}></div>
						<span>Cursor</span>
					</button>

					<button
						class="agent-btn button-3d"
						class:active={selectedAgents.has('gemini')}
						on:click={() => selectAgent('gemini')}
					>
						<div class="agent-indicator gemini" class:active={selectedAgents.has('gemini')}></div>
						<span>Gemini</span>
					</button>
				</div>

				<!-- A2A Collaboration Toggle -->
				<div class="a2a-control">
					<span class="a2a-label">A2A</span>
					<button
						class="toggle-switch"
						class:active={a2aEnabled}
						on:click={toggleA2A}
						title="Agent-to-Agent Collaboration"
						aria-label="Toggle Agent-to-Agent Collaboration"
					>
						<div class="toggle-track">
							<div class="toggle-thumb"></div>
						</div>
					</button>
				</div>

				<!-- Multi-Agent Status & Cost Warning - Positioned to not affect main layout -->
				{#if selectedAgents.size > 1}
					<div class="multi-agent-status">
						<div class="cost-warning">
							<span class="warning-icon">💡</span>
							<span class="warning-text">Sending to {selectedAgents.size} AIs will use {selectedAgents.size}x API credits</span>
						</div>
					</div>
				{:else if selectedAgents.size === 0}
					<div class="multi-agent-status">
						<div class="no-agent-warning">
							<span class="warning-icon">⚠️</span>
							<span class="warning-text">Select at least one AI to send messages</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- File Attachments Preview -->
		{#if uploadedFiles.length > 0}
			<div class="attached-files">
				<div class="attached-files-header">
					<span class="attached-files-label">📎 Attached Files ({uploadedFiles.length})</span>
				</div>
				<div class="attached-files-list">
					{#each uploadedFiles as file (file.id)}
						<div class="attached-file">
							<div class="attached-file-info">
								<span class="file-icon">{getFileIcon(file)}</span>
								<div class="file-details">
									<span class="file-name">{file.name}</span>
									<span class="file-size">{formatFileSize(file.size)}</span>
								</div>
							</div>
							<button
								class="remove-file-btn"
								on:click={() => removeFile(file.id)}
								title="Remove file"
							>
								×
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="input-wrapper">
			<!-- Hidden file input -->
			<input
				type="file"
				bind:this={fileInput}
				on:change={handleFileSelect}
				multiple
				accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.xml,.yaml,.yml,.md,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.log,.env,.config,.ini,.toml,.sql,.graphql,.prisma"
				style="display: none;"
			/>

			<textarea
				class="message-input"
				class:listening={isListening}
				placeholder={isListening ? 'Listening...' : 'Type your message...'}
				rows="2"
				bind:value={messageText}
				on:keydown={handleKeypress}
			></textarea>

			<!-- File Upload Button -->
			<button
				class="file-upload-button button-3d"
				on:click={triggerFileUpload}
				disabled={isUploading}
				aria-label="Attach files"
				title="Attach files (images, documents, code)"
			>
				{#if isUploading}
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="loading-spinner"
					>
						<path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
					</svg>
				{:else}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
						/>
					</svg>
				{/if}
			</button>

			<!-- Voice Input Button -->
			{#if isVoiceSupported}
				<button
					class="voice-button button-3d"
					class:listening={isListening}
					on:click={toggleVoiceInput}
					aria-label={isListening ? 'Stop listening' : 'Start voice input'}
					title={isListening ? 'Stop listening' : 'Start voice input'}
				>
					{#if isListening}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
						</svg>
					{:else}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
							/>
						</svg>
					{/if}
				</button>
			{/if}

			<!-- Send Button -->
			<button
				class="send-button button-3d"
				on:click={sendMessage}
				disabled={(!messageText.trim() && uploadedFiles.length === 0) || selectedAgents.size === 0}
				aria-label="Send message"
			>
				{#if selectedAgents.size > 1}
					Send to {selectedAgents.size} AIs
				{:else if selectedAgents.size === 1}
					Send
				{:else}
					Select AI
				{/if}
			</button>
		</div>
	</div>
</main>

<style>
	.co-creation-canvas {
		height: 100%;
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.co-creation-canvas.drag-over {
		border-color: var(--color-interactive-primary);
		background: color-mix(
			in srgb,
			var(--color-interactive-primary) 5%,
			var(--color-surface-primary)
		);
	}

	/* Drag & Drop Overlay */
	.drag-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: color-mix(
			in srgb,
			var(--color-interactive-primary) 10%,
			var(--color-background-glass)
		);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		border-radius: var(--radius-lg);
	}

	.drag-message {
		text-align: center;
		padding: var(--spacing-xl);
		background: var(--color-surface-primary);
		border: 2px dashed var(--color-interactive-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-elevation-medium);
	}

	.drag-icon {
		font-size: 48px;
		margin-bottom: var(--spacing-md);
	}

	.drag-message h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text-primary);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
	}

	.drag-message p {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	/* Conversation Stream */
	.conversation-stream {
		flex: 1 1 auto;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		scroll-behavior: smooth;
		min-height: 0;
		height: 0; /* Force flex item to respect container height */
	}

	/* Messages */
	.message {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		max-width: 75%;
		margin-bottom: var(--spacing-sm);
		word-wrap: break-word;
		overflow-wrap: break-word;
		flex-shrink: 0; /* Prevent messages from shrinking */
		min-height: fit-content;
	}

	.message.user-message {
		align-self: flex-end;
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
		padding: var(--spacing-md);
	}

	.message.ai-message {
		align-self: flex-start;
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
		padding: var(--spacing-md);
	}

	/* Message Header */
	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-sm);
		padding-bottom: var(--spacing-xs);
		border-bottom: 1px solid var(--color-border-muted);
	}

	.sender-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.multicast-indicator {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
	}

	.multicast-icon {
		font-size: var(--font-size-sm);
	}

	.multicast-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.sender-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-xs);
		color: var(--color-text-inverse);
		font-weight: var(--font-weight-semibold);
		flex-shrink: 0;
	}

	.sender-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.sender-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.message-timestamp {
		font-size: var(--font-size-xs);
		color: var(--color-text-quaternary);
	}

	/* Message Content */
	.message-content {
		line-height: var(--line-height-relaxed);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	/* File Attachments in Messages */
	.message-files {
		margin-top: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.file-attachment {
		background: var(--color-surface-tertiary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		overflow: hidden;
	}

	.file-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-xs);
	}

	.file-icon {
		font-size: var(--font-size-lg);
		flex-shrink: 0;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.file-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-size {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
	}

	.file-preview {
		margin-top: var(--spacing-xs);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.image-preview img {
		max-width: 100%;
		max-height: 200px;
		width: auto;
		height: auto;
		display: block;
		border-radius: var(--radius-sm);
	}

	.text-preview {
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		max-height: 120px;
		overflow-y: auto;
	}

	.text-preview pre {
		margin: 0;
		padding: var(--spacing-sm);
		font-size: var(--font-size-xs);
		font-family: var(--font-mono);
		color: var(--color-text-primary);
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}

	/* Message Input */
	.message-input-area {
		flex: 0 0 auto; /* Don't grow or shrink, use natural size */
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid var(--color-border-primary);
		background: var(--color-surface-secondary);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	/* Attached Files Preview */
	.attached-files {
		background: var(--color-surface-tertiary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
	}

	.attached-files-header {
		margin-bottom: var(--spacing-sm);
	}

	.attached-files-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.attached-files-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.attached-file {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-xs);
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-smooth);
	}

	.attached-file:hover {
		background: var(--color-surface-hover);
	}

	.attached-file-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		min-width: 0;
		flex: 1;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.remove-file-btn {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: var(--font-size-sm);
		flex-shrink: 0;
	}

	.remove-file-btn:hover {
		background: var(--color-error);
		color: var(--color-text-inverse);
		border-color: var(--color-error);
	}

	.input-wrapper {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.message-input {
		flex: 1;
		padding: var(--spacing-lg);
		min-height: 120px;
		max-height: 280px;
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		color: var(--color-text-primary);
		font-size: var(--font-size-lg);
		line-height: var(--line-height-relaxed);
		resize: none;
		outline: none;
		transition: border-color var(--transition-smooth);
	}

	.message-input:focus {
		border-color: var(--color-border-focus);
	}

	.message-input.listening {
		border-color: var(--color-success);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-success) 20%, transparent);
	}

	.message-input::placeholder {
		color: var(--color-text-quaternary);
	}

	.voice-button {
		min-width: 52px;
		height: 52px;
		padding: var(--spacing-sm);
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.voice-button:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.voice-button.listening {
		background: var(--color-interactive-primary);
		color: var(--color-text-inverse);
		border-color: var(--color-interactive-primary);
		animation: pulse-button 1.5s ease-in-out infinite;
	}

	@keyframes pulse-button {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.send-button {
		min-width: 140px; /* Fixed width to accommodate longer text */
		min-height: 44px;
		padding: var(--spacing-md);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		box-shadow:
			var(--shadow-elevation-low),
			0 0 8px rgba(34, 197, 94, 0.1);
	}

	.send-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity var(--transition-smooth);
	}

	.send-button:hover:not(:disabled) {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow:
			var(--shadow-elevation-medium),
			0 0 16px rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.send-button:hover:not(:disabled)::before {
		opacity: 1;
	}

	.send-button:disabled {
		background: var(--color-border-secondary);
		color: var(--color-text-quaternary);
		cursor: not-allowed;
		transform: none;
		box-shadow: var(--shadow-elevation-low);
	}

	/* AI Agent Selection */
	.agent-selector {
		display: flex;
		flex-direction: column;
	}

	.agent-selector-main {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		min-height: 40px; /* Fixed height to prevent shifting */
		position: relative; /* For absolute positioning of warning */
	}

	.agent-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.agent-buttons {
		display: flex;
		gap: var(--spacing-sm);
	}

	.agent-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
	}

	.agent-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity var(--transition-smooth);
	}

	.agent-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-elevation-medium);
	}

	.agent-btn:hover::before {
		opacity: 1;
	}

	.agent-btn.active {
		background: var(--color-surface-primary);
		color: var(--color-text-primary);
		border: 2px solid var(--color-interactive-primary); /* Single border declaration */
		box-shadow: 0 0 8px rgba(22, 163, 74, 0.2);
		transform: translateY(-1px);
	}

	.agent-btn.active::before {
		opacity: 1;
	}

	.agent-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-border-secondary);
		transition: all var(--transition-smooth);
		position: relative;
	}

	.agent-indicator.active {
		transform: scale(1.2);
	}

	.agent-indicator.cursor.active {
		background: var(--color-agent-cursor);
		box-shadow: 0 0 8px var(--color-agent-cursor);
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	.agent-indicator.gemini.active {
		background: var(--color-agent-gemini);
		box-shadow: 0 0 8px var(--color-agent-gemini);
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	@keyframes subtle-pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* A2A Collaboration Toggle */
	.a2a-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding-left: var(--spacing-md);
		border-left: 1px solid var(--color-border-primary);
	}

	.a2a-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.toggle-switch {
		position: relative;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
	}

	.toggle-track {
		width: 32px;
		height: 16px;
		background: var(--color-border-secondary);
		border-radius: 8px;
		position: relative;
		transition: all var(--transition-smooth);
	}

	.toggle-switch.active .toggle-track {
		background: var(--color-interactive-primary);
	}

	.toggle-thumb {
		width: 12px;
		height: 12px;
		background: var(--color-text-inverse);
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: all var(--transition-smooth);
	}

	.toggle-switch.active .toggle-thumb {
		transform: translateX(16px);
	}

	/* File Upload Button */
	.file-upload-button {
		width: 52px;
		height: 52px;
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.file-upload-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-elevation-low);
	}

	.file-upload-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Multi-Agent Status & Cost Warning - Positioned to not affect main layout */
	.multi-agent-status {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		flex-shrink: 0;
	}

	.cost-warning,
	.no-agent-warning {
		background: var(--color-surface-tertiary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--font-size-xs);
		white-space: nowrap;
		box-shadow: var(--shadow-elevation-low);
	}

	.warning-icon {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		flex-shrink: 0;
	}

	.warning-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		line-height: 1.2;
	}
</style>
