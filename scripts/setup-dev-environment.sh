#!/bin/bash

# =============================================================================
# Synapse-Hub Development Environment Setup Script
# =============================================================================
# This script sets up the complete development environment for Synapse-Hub
# Run with: chmod +x scripts/setup-dev-environment.sh && ./scripts/setup-dev-environment.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "
╔══════════════════════════════════════════════════════════════════════════════╗
║                     🚀 Synapse-Hub Development Setup                        ║
║                    AI-Powered Development Environment                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check prerequisites
log_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    log_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi

log_success "npm $(npm -v) is installed"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    log_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) is available"
    DOCKER_AVAILABLE=true
else
    log_warning "Docker is not available. Docker features will be skipped."
    DOCKER_AVAILABLE=false
fi

# Check Git
if ! command -v git &> /dev/null; then
    log_error "Git is not installed."
    exit 1
fi

log_success "Git $(git --version | cut -d' ' -f3) is installed"

# =============================================================================
# Environment Configuration
# =============================================================================

log_info "Setting up environment configuration..."

# Create .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f "config/environment.template" ]; then
        cp config/environment.template .env
        log_success "Created .env file from template"
    else
        log_warning "No environment template found. You'll need to create .env manually."
    fi
else
    log_info ".env file already exists"
fi

# =============================================================================
# Dependencies Installation
# =============================================================================

log_info "Installing dependencies..."

# Clean install to ensure consistency
if [ -d "node_modules" ]; then
    log_info "Cleaning existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

log_success "Dependencies installed"

# =============================================================================
# Database Setup
# =============================================================================

log_info "Setting up database..."

# Create database directory if it doesn't exist
mkdir -p data

# Initialize database if it doesn't exist
if [ ! -f "local.db" ]; then
    log_info "Creating database..."
    touch local.db
    
    # Run database migrations
    if npm run db:push &> /dev/null; then
        log_success "Database migrations completed"
    else
        log_warning "Database migration failed. You may need to run 'npm run db:push' manually."
    fi
else
    log_info "Database already exists"
fi

# =============================================================================
# Development Tools Setup
# =============================================================================

log_info "Setting up development tools..."

# Install global tools if not present
GLOBAL_TOOLS=(
    "tsx"
    "drizzle-kit"
    "@storybook/cli"
)

for tool in "${GLOBAL_TOOLS[@]}"; do
    if ! npm list -g "$tool" &> /dev/null; then
        log_info "Installing global tool: $tool"
        npm install -g "$tool" || log_warning "Failed to install $tool globally"
    else
        log_info "Global tool $tool is already installed"
    fi
done

# =============================================================================
# Git Hooks Setup
# =============================================================================

log_info "Setting up Git hooks..."

# Create git hooks directory
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Synapse-Hub pre-commit hook
echo "🔒 Running pre-commit validation..."
npm run validate:precommit
if [ $? -ne 0 ]; then
    echo "❌ Pre-commit validation failed. Please fix the issues before committing."
    exit 1
fi
echo "✅ Pre-commit validation passed!"
EOF

chmod +x .git/hooks/pre-commit
log_success "Git pre-commit hook installed"

# =============================================================================
# Docker Setup (if available)
# =============================================================================

if [ "$DOCKER_AVAILABLE" = true ]; then
    log_info "Setting up Docker development environment..."
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        log_info "Building Docker development images..."
        
        # Build the development images
        if docker compose build &> docker-build.log; then
            log_success "Docker images built successfully"
            rm -f docker-build.log
        else
            log_warning "Docker image build failed. Check docker-build.log for details."
        fi
    else
        log_warning "docker-compose not available. Skipping Docker setup."
    fi
fi

# =============================================================================
# VSCode Setup
# =============================================================================

log_info "Setting up VSCode configuration..."

# VSCode configuration is already in place from previous setup
if [ -d ".vscode" ]; then
    log_success "VSCode configuration is ready"
    
    # Check if code command is available
    if command -v code &> /dev/null; then
        log_info "You can install recommended extensions by running: code --install-extension <extension-id>"
        log_info "Extension recommendations are in .vscode/extensions.json"
    fi
else
    log_warning "VSCode configuration directory not found"
fi

# =============================================================================
# Initial Validation
# =============================================================================

log_info "Running initial validation..."

# Run smoke tests to verify setup
if npm run validate:smoke &> setup-validation.log; then
    log_success "Initial smoke tests passed"
    rm -f setup-validation.log
else
    log_warning "Some smoke tests failed. Check setup-validation.log for details."
fi

# =============================================================================
# Create helpful scripts
# =============================================================================

log_info "Creating development helper scripts..."

# Create start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
# Quick start script for development
echo "🚀 Starting Synapse-Hub development environment..."

# Check if Docker is available and user wants to use it
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "📦 Docker detected. Start with Docker? (y/n)"
    read -r USE_DOCKER
    
    if [ "$USE_DOCKER" = "y" ] || [ "$USE_DOCKER" = "Y" ]; then
        echo "🐳 Starting with Docker Compose..."
        docker-compose up -d
        echo "✅ Development environment started!"
        echo "🌐 App: http://localhost:5173"
        echo "📚 Storybook: http://localhost:6006"
        echo "🗄️ Drizzle Studio: http://localhost:4983"
        exit 0
    fi
fi

# Start without Docker
echo "💻 Starting local development servers..."
npm run dev &
npm run storybook &
npm run db:studio &

echo "✅ Development environment started!"
echo "🌐 App: http://localhost:5173"
echo "📚 Storybook: http://localhost:6006" 
echo "🗄️ Drizzle Studio: http://localhost:4983"
echo "📝 Run 'pkill -f node' to stop all servers"
EOF

chmod +x start-dev.sh

log_success "Created start-dev.sh helper script"

# =============================================================================
# Final Setup Summary
# =============================================================================

echo "
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ✅ Setup Complete!                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

🎉 Synapse-Hub development environment is ready!

📋 What was set up:
   ✅ Dependencies installed
   ✅ Database initialized
   ✅ Git hooks configured
   ✅ VSCode configuration ready
   ✅ Development scripts created
   $([ "$DOCKER_AVAILABLE" = true ] && echo "✅ Docker environment configured" || echo "⏭️ Docker setup skipped")

🚀 Quick Start Options:
   1. Local development:    ./start-dev.sh
   2. Docker development:   docker-compose up -d
   3. Manual start:         npm run dev

🔧 Available Commands:
   npm run dev              - Start development server
   npm run storybook        - Start Storybook
   npm run db:studio        - Start Drizzle Studio
   npm run validate:all     - Run all validation scripts
   npm run test             - Run tests
   npm run build            - Build for production

📚 URLs (when running):
   🌐 Application:          http://localhost:5173
   📚 Storybook:            http://localhost:6006
   🗄️ Database Studio:      http://localhost:4983

🐳 Docker Commands:
   docker-compose up -d     - Start all services
   docker-compose logs -f   - View logs
   docker-compose down      - Stop all services

📖 Documentation:
   README.md                - Project overview
   AI_DEVELOPMENT_OPTIMIZATION_CHECKLIST.md - Development guide

Happy coding! 🎯
"

# Open the project in VSCode if available
if command -v code &> /dev/null; then
    echo "🔧 Opening project in VSCode..."
    code .
fi 