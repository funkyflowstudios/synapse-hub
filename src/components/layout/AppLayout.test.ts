import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AppLayout from './AppLayout.svelte';

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
	writable: true,
	configurable: true,
	value: 1024,
});

// Mock window.dispatchEvent for resize events
const mockDispatchEvent = vi.fn();
window.dispatchEvent = mockDispatchEvent;

describe('AppLayout', () => {
	beforeEach(() => {
		// Reset window width before each test
		window.innerWidth = 1024;
		vi.clearAllMocks();
	});

	it('renders all three panels on desktop', () => {
		window.innerWidth = 1200;
		render(AppLayout);

		// Should render all three main sections
		expect(screen.getByRole('complementary', { name: /master control panel/i })).toBeInTheDocument();
		expect(screen.getByRole('main', { name: /conversation stream/i })).toBeInTheDocument();
		expect(screen.getByRole('complementary', { name: /contextual orchestration panel/i })).toBeInTheDocument();
	});

	it('adapts to tablet layout with floating orchestration panel', () => {
		window.innerWidth = 800;
		render(AppLayout);

		// Master control panel should still be visible
		expect(screen.getByRole('complementary', { name: /master control panel/i })).toBeInTheDocument();
		
		// Main conversation stream should be visible
		expect(screen.getByRole('main', { name: /conversation stream/i })).toBeInTheDocument();
		
		// Orchestration panel should be present but floating
		expect(screen.getByRole('complementary', { name: /contextual orchestration panel/i })).toBeInTheDocument();
	});

	it('adapts to mobile layout with single column and footer', () => {
		window.innerWidth = 600;
		render(AppLayout);

		// Main conversation stream should be visible
		expect(screen.getByRole('main', { name: /conversation stream/i })).toBeInTheDocument();
		
		// Mobile footer should be present
		expect(screen.getByRole('contentinfo')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /open universal input/i })).toBeInTheDocument();
		
		// Mobile navigation should be present
		expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /show master control/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /show context panel/i })).toBeInTheDocument();
	});

	it('applies correct CSS classes for different breakpoints', () => {
		const { container, rerender } = render(AppLayout);

		// Desktop
		window.innerWidth = 1200;
		rerender({});
		expect(container.querySelector('.app-layout')).toHaveClass('desktop');

		// Tablet
		window.innerWidth = 800;
		rerender({});
		expect(container.querySelector('.app-layout')).toHaveClass('tablet');

		// Mobile
		window.innerWidth = 600;
		rerender({});
		expect(container.querySelector('.app-layout')).toHaveClass('mobile');
	});

	it('has proper semantic structure', () => {
		render(AppLayout);

		// Check for proper landmark roles
		expect(screen.getByRole('main')).toBeInTheDocument();
		expect(screen.getAllByRole('complementary')).toHaveLength(2); // Master control + orchestration panels
	});

	it('supports keyboard navigation', () => {
		render(AppLayout);

		// All interactive elements should be focusable
		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('has proper ARIA labels for accessibility', () => {
		window.innerWidth = 600; // Mobile view to get all elements
		render(AppLayout);

		// Check for proper ARIA labels
		expect(screen.getByRole('button', { name: /open universal input/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /show master control/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /show context panel/i })).toBeInTheDocument();
		expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
	});

	it('accepts and applies custom className', () => {
		const { container } = render(AppLayout, { props: { class: 'custom-class' } });
		expect(container.querySelector('.app-layout')).toHaveClass('custom-class');
	});

	it('manages panel state correctly for responsive behavior', () => {
		const { container } = render(AppLayout);

		// Check that CSS custom properties are set
		const appLayout = container.querySelector('.app-layout');
		expect(appLayout).toHaveStyle({ '--master-panel-width': '22%' });
		expect(appLayout).toHaveStyle({ '--main-panel-width': '56%' });
		expect(appLayout).toHaveStyle({ '--orchestration-panel-width': '22%' });
	});
}); 