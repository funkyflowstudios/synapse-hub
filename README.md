# Synapse Hub

A high-performance, AI-powered intelligent interface built with SvelteKit. Features dynamic UIs, liquid crystal controls, and sub-100ms performance targets.

## 🚀 Features

- **High Performance**: Sub-100ms interactive shell load time
- **Dynamic UI**: Adaptive layouts with liquid crystal controls
- **AI-Powered**: Intelligent interface components
- **Accessibility**: WCAG 2.2+ AAA compliance
- **Modern Stack**: SvelteKit + TypeScript + TailwindCSS

## 🛠 Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Styling**: TailwindCSS
- **Testing**: Vitest + Playwright
- **Development**: Storybook for component development
- **Quality**: ESLint + Prettier
- **Database**: Drizzle ORM with SQLite

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
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test            # Run all tests
npm run test:unit   # Unit tests only
npm run test:e2e    # End-to-end tests only

# Development Tools
npm run storybook   # Start Storybook
npm run lint        # Lint code
npm run format      # Format code
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── lib/           # Utilities and shared code
├── routes/        # SvelteKit routes
├── styles/        # Global styles and themes
├── workers/       # Web Workers for background tasks
└── stories/       # Storybook stories
```

## 🧪 Testing

The project includes comprehensive testing setup:
- **Unit Tests**: Component and logic testing with Vitest
- **E2E Tests**: End-to-end testing with Playwright
- **Storybook Tests**: Component interaction testing

## 🚀 Deployment

Built for deployment on modern platforms:
- Vercel, Netlify, or any Node.js hosting
- Static site generation supported
- Optimized builds with code splitting

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and code of conduct.

---

Built with ❤️ using SvelteKit
