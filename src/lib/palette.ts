/**
 * Hyper-Personalized Palette System
 * Foundation for adaptive theming based on harmonious color palettes
 */

export interface ColorPalette {
	id: string;
	name: string;
	description: string;
	primary: string;
	secondary: string;
	accent: string;
	highlight?: string; // Optional 4th color

	// Contextual variations
	primaryMuted: string;
	secondaryMuted: string;
	accentMuted: string;
	highlightMuted?: string;

	// Metadata for future AI-driven selection
	mood: 'energetic' | 'calm' | 'focused' | 'creative' | 'professional';
	timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
	season: 'spring' | 'summer' | 'autumn' | 'winter' | 'any';
}

/**
 * Predefined harmonious palettes for the foundation
 * These serve as templates for the hyper-personalized system
 */
export const SAMPLE_PALETTES: ColorPalette[] = [
	{
		id: 'emerald-matrix',
		name: 'Emerald Matrix',
		description: 'Sophisticated green and teal inspired by digital interfaces',
		primary: '#22c55e', // Emerald green
		secondary: '#14b8a6', // Teal
		accent: '#34d399', // Light emerald
		highlight: '#06d6a0', // Bright teal
		primaryMuted: '#dcfce7',
		secondaryMuted: '#ccfbf1',
		accentMuted: '#d1fae5',
		highlightMuted: '#a7f3d0',
		mood: 'focused',
		timeOfDay: 'any',
		season: 'any'
	},

	{
		id: 'cyber-forest',
		name: 'Cyber Forest',
		description: 'Deep greens with electric accents for night coding sessions',
		primary: '#16a34a', // Dark green
		secondary: '#059669', // Emerald
		accent: '#10b981', // Green
		highlight: '#20d9d0', // Electric teal
		primaryMuted: '#bbf7d0',
		secondaryMuted: '#a7f3d0',
		accentMuted: '#6ee7b7',
		highlightMuted: '#99f6e4',
		mood: 'focused',
		timeOfDay: 'night',
		season: 'any'
	},

	{
		id: 'ocean-breeze',
		name: 'Ocean Breeze',
		description: 'Calming blues and teals inspired by coastal waters',
		primary: '#0ea5e9', // Sky blue
		secondary: '#06b6d4', // Cyan
		accent: '#3b82f6', // Blue
		highlight: '#8b5cf6', // Purple accent
		primaryMuted: '#e0f2fe',
		secondaryMuted: '#cffafe',
		accentMuted: '#dbeafe',
		highlightMuted: '#ede9fe',
		mood: 'calm',
		timeOfDay: 'any',
		season: 'summer'
	},

	{
		id: 'forest-depths',
		name: 'Forest Depths',
		description: 'Grounding greens and earth tones for deep focus',
		primary: '#059669', // Emerald
		secondary: '#65a30d', // Lime green
		accent: '#dc2626', // Red accent for contrast
		highlight: '#f59e0b', // Amber highlight
		primaryMuted: '#d1fae5',
		secondaryMuted: '#ecfccb',
		accentMuted: '#fee2e2',
		highlightMuted: '#fef3c7',
		mood: 'focused',
		timeOfDay: 'afternoon',
		season: 'autumn'
	},

	{
		id: 'sunset-energy',
		name: 'Sunset Energy',
		description: 'Warm oranges and purples for creative energy',
		primary: '#ea580c', // Orange
		secondary: '#dc2626', // Red
		accent: '#7c3aed', // Violet
		highlight: '#ec4899', // Pink
		primaryMuted: '#fed7aa',
		secondaryMuted: '#fecaca',
		accentMuted: '#ddd6fe',
		highlightMuted: '#fbcfe8',
		mood: 'energetic',
		timeOfDay: 'evening',
		season: 'any'
	},

	{
		id: 'midnight-professional',
		name: 'Midnight Professional',
		description: 'Sophisticated grays and blues for professional work',
		primary: '#374151', // Cool gray
		secondary: '#4f46e5', // Indigo
		accent: '#06b6d4', // Cyan accent
		primaryMuted: '#f3f4f6',
		secondaryMuted: '#e0e7ff',
		accentMuted: '#cffafe',
		mood: 'professional',
		timeOfDay: 'night',
		season: 'winter'
	}
];

/**
 * Service for managing personalized palettes
 */
class PaletteService {
	private currentPalette: ColorPalette | null = null;
	private callbacks: Set<(palette: ColorPalette | null) => void> = new Set();

	constructor() {
		this.initializePalette();
	}

	/**
	 * Initialize palette from localStorage or default
	 */
	private initializePalette() {
		if (typeof window === 'undefined') return;

		const savedPaletteId = localStorage.getItem('synapse-palette');
		if (savedPaletteId) {
			const palette = SAMPLE_PALETTES.find((p) => p.id === savedPaletteId);
			if (palette) {
				this.currentPalette = palette;
				this.applyPalette(palette);
			}
		}
	}

	/**
	 * Apply a palette to the CSS custom properties
	 */
	private applyPalette(palette: ColorPalette | null) {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;

		if (!palette) {
			// Remove palette-specific custom properties
			root.style.removeProperty('--palette-primary');
			root.style.removeProperty('--palette-secondary');
			root.style.removeProperty('--palette-accent');
			root.style.removeProperty('--palette-highlight');
			root.style.removeProperty('--palette-primary-muted');
			root.style.removeProperty('--palette-secondary-muted');
			root.style.removeProperty('--palette-accent-muted');
			root.style.removeProperty('--palette-highlight-muted');
			return;
		}

		// Apply palette colors as CSS custom properties
		root.style.setProperty('--palette-primary', palette.primary);
		root.style.setProperty('--palette-secondary', palette.secondary);
		root.style.setProperty('--palette-accent', palette.accent);
		root.style.setProperty('--palette-primary-muted', palette.primaryMuted);
		root.style.setProperty('--palette-secondary-muted', palette.secondaryMuted);
		root.style.setProperty('--palette-accent-muted', palette.accentMuted);

		if (palette.highlight) {
			root.style.setProperty('--palette-highlight', palette.highlight);
		}
		if (palette.highlightMuted) {
			root.style.setProperty('--palette-highlight-muted', palette.highlightMuted);
		}

		// Override interactive colors with palette when active
		root.style.setProperty('--color-interactive-primary', palette.primary);
		root.style.setProperty('--color-interactive-secondary', palette.secondary);
	}

	/**
	 * Set the active palette
	 */
	setPalette(palette: ColorPalette | null) {
		this.currentPalette = palette;

		// Persist to localStorage
		if (typeof localStorage !== 'undefined') {
			if (palette) {
				localStorage.setItem('synapse-palette', palette.id);
			} else {
				localStorage.removeItem('synapse-palette');
			}
		}

		// Apply the palette
		this.applyPalette(palette);

		// Notify callbacks
		this.notifyCallbacks();
	}

	/**
	 * Get the current active palette
	 */
	getCurrentPalette(): ColorPalette | null {
		return this.currentPalette;
	}

	/**
	 * Get all available palettes
	 */
	getAvailablePalettes(): ColorPalette[] {
		return SAMPLE_PALETTES;
	}

	/**
	 * Get palette suggestions based on context
	 * Placeholder for future AI-driven recommendations
	 */
	getSuggestedPalettes(context?: {
		timeOfDay?: string;
		mood?: string;
		season?: string;
	}): ColorPalette[] {
		if (!context) return SAMPLE_PALETTES;

		return SAMPLE_PALETTES.filter((palette) => {
			if (
				context.timeOfDay &&
				palette.timeOfDay !== 'any' &&
				palette.timeOfDay !== context.timeOfDay
			) {
				return false;
			}
			if (context.mood && palette.mood !== context.mood) {
				return false;
			}
			if (context.season && palette.season !== 'any' && palette.season !== context.season) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Subscribe to palette changes
	 */
	subscribe(callback: (palette: ColorPalette | null) => void) {
		this.callbacks.add(callback);

		// Call immediately with current state
		callback(this.currentPalette);

		// Return unsubscribe function
		return () => {
			this.callbacks.delete(callback);
		};
	}

	/**
	 * Notify all subscribers of palette changes
	 */
	private notifyCallbacks() {
		this.callbacks.forEach((callback) => {
			callback(this.currentPalette);
		});
	}

	/**
	 * Generate a palette from a base color (future wallpaper/screen analysis)
	 * Placeholder for future AI-driven palette generation
	 */
	generatePaletteFromColor(baseColor: string): ColorPalette {
		// TODO: Implement color harmony algorithms
		// This is a placeholder that will be enhanced with AI analysis
		return {
			id: `generated-${Date.now()}`,
			name: 'Generated Palette',
			description: 'AI-generated harmonious palette',
			primary: baseColor,
			secondary: baseColor, // TODO: Calculate complementary
			accent: baseColor, // TODO: Calculate accent
			primaryMuted: baseColor + '20', // TODO: Proper muted calculation
			secondaryMuted: baseColor + '20',
			accentMuted: baseColor + '20',
			mood: 'calm',
			timeOfDay: 'any',
			season: 'any'
		};
	}
}

// Create singleton instance
export const paletteService = new PaletteService();

/**
 * Svelte store for reactive palette updates
 */
export function createPaletteStore() {
	let currentPalette: ColorPalette | null = paletteService.getCurrentPalette();
	const subscribers: Set<(value: ColorPalette | null) => void> = new Set();

	// Subscribe to palette service
	paletteService.subscribe((palette) => {
		currentPalette = palette;

		// Notify Svelte subscribers
		subscribers.forEach((callback) => {
			callback(currentPalette);
		});
	});

	return {
		subscribe(callback: (value: ColorPalette | null) => void) {
			subscribers.add(callback);
			// Call immediately with current value
			callback(currentPalette);

			return () => {
				subscribers.delete(callback);
			};
		},
		setPalette: (palette: ColorPalette | null) => paletteService.setPalette(palette),
		getCurrentPalette: () => paletteService.getCurrentPalette(),
		getAvailablePalettes: () => paletteService.getAvailablePalettes(),
		getSuggestedPalettes: (context?: { timeOfDay?: string; mood?: string; season?: string }) =>
			paletteService.getSuggestedPalettes(context),
		generateFromColor: (color: string) => paletteService.generatePaletteFromColor(color)
	};
}
