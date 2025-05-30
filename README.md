# Synapse Hub

A high-performance, AI-powered intelligent interface built with SvelteKit. Features dynamic three-panel layout, AI agent collaboration, unified design system, and sub-100ms performance targets with WCAG 2.2+ AAA accessibility compliance.

## 🚀 Core Features

### Interface & Design

- **Three-Panel Dynamic Layout**: InputControlNexus (left), CoCreationCanvas (center), OrchestrationForesightDeck (right)
- **Unified Button System**: Consistent glass morphism styling with subtle green hue accents
- **Icon-Free Interface**: Clean, text-based UI elements for improved accessibility and clarity
- **Adaptive Responsiveness**: Fluid panel sizing with mobile-optimized single-column layout
- **Liquid Crystal Controls**: Sophisticated backdrop-filter effects and smooth transitions

### AI & Collaboration

- **Multi-Agent Support**: Seamless integration with Cursor and Gemini AI assistants
- **Agent-to-Agent (A2A) Collaboration**: Real-time AI-to-AI communication and coordination
- **Intelligent Input System**: Universal input field with voice support and file attachments
- **Contextual Quick Actions**: Dynamic action buttons based on conversation context
- **File Upload & Processing**: Smart file handling with preview and content recognition

### Performance & Accessibility

- **Sub-100ms Load Time**: Optimized SvelteKit application with aggressive performance budgets
- **WCAG 2.2+ AAA Compliance**: Full accessibility support with keyboard navigation and screen readers
- **Reduced Motion Support**: Respects user motion preferences throughout the interface
- **High Contrast Modes**: Accessible theming for users with visual impairments
- **Focus Management**: Proper focus states and keyboard interaction patterns

## 🎨 Visual Philosophy

### "Quiet Intelligence & Fluid Sophistication"

- **Clean, Minimal Interface**: Almost invisible design that surfaces controls when needed
- **Sophisticated Depth System**: Subtle shadows and glass morphism effects
- **Consistent Green Accent Theme**: Unified green hue system for interactive elements
- **Smooth Animations**: Cubic-bezier transitions with performance optimization

## 🛠 Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Styling**: Custom CSS with CSS Custom Properties (no external frameworks)
- **Testing**: Vitest + Playwright for comprehensive test coverage
- **Development**: Storybook for component development and documentation
- **Quality**: ESLint + Prettier for code consistency
- **Database**: Drizzle ORM with SQLite
- **Performance**: Web Workers for background processing

## 🏗 Architecture

### Panel System

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ InputControl    │ CoCreationCanvas     │ OrchestrationFore-  │
│ Nexus (Left)    │ (Center)            │ sightDeck (Right)   │
├─────────────────┼──────────────────────┼─────────────────────┤
│ • AI Target     │ • Conversation       │ • Agent Status      │
│   Selection     │   Stream             │ • System Monitoring │
│ • Universal     │ • Message History    │ • A2A Controls      │
│   Input         │ • File Attachments   │ • Quick Actions     │
│ • Quick Actions │ • Voice Input        │ • Settings          │
│ • File Upload   │ • Send Controls      │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Responsive Behavior

- **Desktop (≥1200px)**: Full three-panel layout with adaptive widths
- **Tablet (768-1199px)**: Two-panel with floating island for right panel
- **Mobile (<768px)**: Single-column with persistent input footer

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/funkyflowstudios/synapse-hub.git
cd synapse-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test            # Run all tests
npm run test:unit   # Unit tests with Vitest
npm run test:e2e    # End-to-end tests with Playwright

# Development Tools
npm run storybook   # Start Storybook component library
npm run lint        # Lint code with ESLint
npm run format      # Format code with Prettier

# Quality Assurance
npm run check       # Svelte type checking
npm run check:watch # Watch mode for type checking
```

## 📁 Project Structure

```
src/
├── components/         # UI Components
│   ├── panels/        # Main interface panels
│   │   ├── InputControlNexus.svelte       # Left panel
│   │   ├── CoCreationCanvas.svelte        # Center panel
│   │   └── OrchestrationForesightDeck.svelte # Right panel
│   ├── layout/        # Layout components
│   └── ui/            # Reusable UI components
├── lib/               # Utilities and shared code
│   ├── server/        # Server-side utilities
│   └── theme.ts       # Theme management
├── routes/            # SvelteKit routes
├── styles/            # Global styles and themes
├── workers/           # Web Workers for background tasks
└── stories/           # Storybook component stories
```

## 🎯 Key Components

### InputControlNexus (Left Panel)

- **AI Agent Selection**: Toggle between Cursor and Gemini
- **Universal Input**: Multi-format input with voice support
- **Quick Actions**: Context-aware action buttons
- **File Upload**: Drag-and-drop file attachment system
- **Platform Integration**: Connect to various development platforms

### CoCreationCanvas (Center Panel)

- **Conversation Stream**: Real-time AI conversation display
- **Multi-Agent Selection**: Choose between Cursor and/or Gemini AI simultaneously
- **Message Management**: Rich message formatting and file attachments
- **Agent Collaboration**: Visual indicators for A2A communication
- **Voice Input**: Speech-to-text with visual feedback
- **File Processing**: Smart file preview and content recognition
- **Cost Awareness**: API credit usage warnings for multi-agent conversations

### OrchestrationForesightDeck (Right Panel)

- **System Monitoring**: Real-time performance metrics
- **Agent Status**: Connection and processing state indicators
- **A2A Controls**: Agent-to-Agent collaboration settings
- **Quick Actions**: Context-sensitive operation buttons
- **Settings Management**: User preferences and configuration

## 🧪 Testing Strategy

### Comprehensive Test Coverage

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: Panel interactions and data flow
- **E2E Tests**: Full user workflows and accessibility
- **Visual Tests**: Component rendering and responsive behavior
- **Performance Tests**: Load time and animation frame rates

### Accessibility Testing

- **Screen Reader Compatibility**: NVDA, JAWS, VoiceOver support
- **Keyboard Navigation**: Full interface accessible via keyboard
- **Color Contrast**: WCAG 2.2+ AAA compliant color ratios
- **Motion Preferences**: Reduced motion support throughout

## 🚀 Performance Features

### Optimization Strategies

- **Sub-50ms Long Animation Frames**: GPU-accelerated transitions
- **Lazy Loading**: Component-based code splitting
- **Virtual Scrolling**: Efficient handling of large conversation streams
- **Web Workers**: Background processing for AI communication
- **Resource Preloading**: Predictive asset loading

### Bundle Optimization

- **Tree Shaking**: Minimal JavaScript bundles
- **CSS Optimization**: Efficient styling with custom properties
- **Image Optimization**: WebP/AVIF format support
- **Compression**: Brotli/Gzip compression for all assets

## 🎨 Design System

### Button System

All buttons follow a unified design pattern with enhanced consistency:

- **Glass Morphism**: Subtle backdrop-filter effects with sophisticated depth
- **Green Hue Accents**: Consistent `rgba(34, 197, 94, 0.3)` border treatment for action buttons
- **Neutral Base**: Clean glass styling for regular buttons without distracting colors
- **Active States**: Green accents reserved for selected/active states and primary actions
- **Hover States**: Transform and shadow elevation changes with gradient overlays
- **Focus Management**: Visible focus indicators for accessibility
- **Size Consistency**: Minimum 44px height for touch accessibility
- **Layout Stability**: Fixed dimensions prevent UI shifting during state changes

### Color Palette

- **Primary Green**: `#22c55e` for interactive elements
- **Surface Colors**: Sophisticated glass morphism backgrounds
- **Text Hierarchy**: Semantic color naming for accessibility
- **Theme Support**: Light, Dark, and Twilight modes

## 📊 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: Full support for assistive technologies

## 🔧 Configuration

### Environment Variables

```bash
# Optional: API endpoints for AI services
VITE_CURSOR_API_URL=your_cursor_endpoint
VITE_GEMINI_API_URL=your_gemini_endpoint

# Optional: Analytics and monitoring
VITE_ANALYTICS_ID=your_analytics_id
```

### Theme Customization

The interface supports extensive theming through CSS Custom Properties. See `src/app.css` for the complete theming system.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please read our:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

### Development Guidelines

- Follow the established design system
- Maintain WCAG 2.2+ AAA compliance
- Include comprehensive tests
- Document component APIs in Storybook

---

**Built with ❤️ using SvelteKit • Designed for Intelligence, Performance, and Accessibility**
