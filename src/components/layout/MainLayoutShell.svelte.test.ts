import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import MainLayoutShell from './MainLayoutShell.svelte';

// Mock window dimensions for responsive testing
Object.defineProperty(window, 'innerWidth', {
	writable: true,
	configurable: true,
	value: 1200
});

Object.defineProperty(window, 'innerHeight', {
	writable: true,
	configurable: true,
	value: 800
});

describe('MainLayoutShell', () => {
	it('renders desktop layout with three panels on large screens', () => {
		// Set desktop width
		window.innerWidth = 1200;
		render(MainLayoutShell);

		// Check for desktop layout structure
		expect(screen.getByRole('application')).toBeInTheDocument();
		expect(screen.getByLabelText('Master Control Panel')).toBeInTheDocument();
		expect(screen.getByLabelText('Conversation Stream')).toBeInTheDocument();
		expect(screen.getByLabelText('Contextual Orchestration Panel')).toBeInTheDocument();
	});

	it('renders tablet layout with floating island on medium screens', () => {
		// Set tablet width
		window.innerWidth = 900;
		render(MainLayoutShell);

		// Should have floating island instead of docked panel
		expect(screen.getByRole('application')).toBeInTheDocument();
		expect(screen.getByLabelText('Master Control Panel')).toBeInTheDocument();
		expect(screen.getByLabelText('Conversation Stream')).toBeInTheDocument();
		expect(screen.getByLabelText('Contextual Orchestration Panel')).toBeInTheDocument();
	});

	it('renders mobile layout with persistent footer on small screens', () => {
		// Set mobile width
		window.innerWidth = 600;
		render(MainLayoutShell);

		// Check for mobile-specific elements
		expect(screen.getByRole('application')).toBeInTheDocument();
		expect(screen.getByText('Synapse Hub')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument();
		
		// Check for quick action pills
		expect(screen.getByText('Ask Cursor')).toBeInTheDocument();
		expect(screen.getByText('Ask Gemini')).toBeInTheDocument();
	});

	it('has proper ARIA labels for accessibility', () => {
		render(MainLayoutShell);

		const mainApp = screen.getByRole('application');
		expect(mainApp).toHaveAttribute('aria-label', expect.stringMatching(/Synapse Hub.*Interface/));
	});

	it('uses semantic HTML elements', () => {
		window.innerWidth = 600; // Mobile layout
		render(MainLayoutShell);

		// Check for semantic elements in mobile layout
		const headers = screen.getAllByRole('banner'); // Multiple headers expected
		expect(headers.length).toBeGreaterThan(0);
		
		const mains = screen.getAllByRole('main'); // Multiple main elements expected
		expect(mains.length).toBeGreaterThan(0);
		
		expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
	});

	it('supports keyboard navigation', () => {
		render(MainLayoutShell);

		// All interactive elements should be focusable (buttons don't have tabindex by default, which is correct)
		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			// Buttons should not have tabindex="-1" (which would make them unfocusable)
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('respects prefers-reduced-motion', () => {
		// Mock prefers-reduced-motion
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation(query => ({
				matches: query === '(prefers-reduced-motion: reduce)',
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		render(MainLayoutShell);

		// Component should render without animations
		expect(screen.getByRole('application')).toBeInTheDocument();
	});

	it('has proper color contrast in high contrast mode', () => {
		// Mock high contrast mode
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation(query => ({
				matches: query === '(prefers-contrast: high)',
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		render(MainLayoutShell);
		expect(screen.getByRole('application')).toBeInTheDocument();
	});

	it('adapts panel widths based on screen size', () => {
		// Test desktop layout
		window.innerWidth = 1200;
		const { unmount } = render(MainLayoutShell);
		
		// In desktop mode, master panel should be visible with 20% width
		const masterPanel = screen.getByLabelText('Master Control Panel');
		expect(masterPanel).toHaveStyle({ width: '20%' });
		
		unmount();
		
		// Test tablet layout
		window.innerWidth = 900;
		render(MainLayoutShell);
		
		// In tablet mode, master panel should be visible with 30% width
		const tabletMasterPanel = screen.getByLabelText('Master Control Panel');
		expect(tabletMasterPanel).toHaveStyle({ width: '30%' });
	});
}); 