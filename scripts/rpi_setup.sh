#!/bin/bash

# Synapse-Hub Raspberry Pi Setup Script
# This script automates the deployment of Synapse-Hub backend on Raspberry Pi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PYTHON_VERSION="3.11"
SERVICE_USER="synapse"
PROJECT_DIR="$HOME/synapse-hub"
BACKEND_DIR="$PROJECT_DIR/rpi-backend"
REPO_URL="${REPO_URL:-https://github.com/your-username/synapse-hub.git}"
INSTALL_NGINX=${INSTALL_NGINX:-false}
SETUP_SERVICE=${SETUP_SERVICE:-true}

# Functions
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

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if running on Raspberry Pi
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        log_warning "This script is designed for Raspberry Pi, but continuing anyway..."
    fi
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root!"
        exit 1
    fi
    
    # Check available disk space (minimum 8GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 8388608 ]]; then  # 8GB in KB
        log_warning "Less than 8GB available disk space. Consider cleaning up or using a larger SD card."
    fi
    
    log_success "System requirements check completed"
}

update_system() {
    log_info "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    
    log_info "Installing essential packages..."
    sudo apt install -y \
        git \
        curl \
        wget \
        vim \
        htop \
        python3-pip \
        python3-venv \
        python3-dev \
        build-essential \
        libssl-dev \
        libffi-dev \
        software-properties-common \
        jq
    
    log_success "System update completed"
}

install_python() {
    log_info "Installing Python $PYTHON_VERSION..."
    
    # Add deadsnakes PPA
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt update
    
    # Install Python 3.11
    sudo apt install -y \
        python$PYTHON_VERSION \
        python$PYTHON_VERSION-venv \
        python$PYTHON_VERSION-dev
    
    # Verify installation
    if python$PYTHON_VERSION --version; then
        log_success "Python $PYTHON_VERSION installed successfully"
    else
        log_error "Failed to install Python $PYTHON_VERSION"
        exit 1
    fi
}

setup_project_structure() {
    log_info "Setting up project structure..."
    
    # Clone repository if it doesn't exist
    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_info "Cloning repository from $REPO_URL..."
        git clone "$REPO_URL" "$PROJECT_DIR"
    else
        log_info "Project directory already exists, pulling latest changes..."
        cd "$PROJECT_DIR"
        git pull
    fi
    
    # Create necessary directories
    cd "$BACKEND_DIR"
    mkdir -p data logs storage
    chmod 755 data logs storage
    
    log_success "Project structure setup completed"
}

setup_python_environment() {
    log_info "Setting up Python virtual environment..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment
    if [[ ! -d "venv" ]]; then
        python$PYTHON_VERSION -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip setuptools wheel
    
    # Install dependencies
    log_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    log_success "Python environment setup completed"
}

create_environment_config() {
    log_info "Creating environment configuration..."
    
    cd "$BACKEND_DIR"
    
    # Get local IP address for CORS configuration
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    cat > .env << EOF
# Application Settings
SYNAPSE_APP_NAME=Synapse-Hub Backend
SYNAPSE_VERSION=0.1.0
SYNAPSE_DEBUG=false
SYNAPSE_ENVIRONMENT=production

# Server Settings
SYNAPSE_HOST=0.0.0.0
SYNAPSE_PORT=8000
SYNAPSE_RELOAD=false
SYNAPSE_WORKERS=2

# Database Settings
SYNAPSE_DATABASE_URL=sqlite+aiosqlite:///./synapse_hub.db?cache=shared&journal_mode=WAL
SYNAPSE_DATABASE_ECHO=false

# AI API Keys (PLEASE UPDATE THESE!)
SYNAPSE_GEMINI_API_KEY=your_gemini_api_key_here

# CORS Settings
SYNAPSE_ALLOWED_ORIGINS=["http://localhost:5173","http://$LOCAL_IP:5173","http://localhost:3000","http://$LOCAL_IP:3000"]

# Logging
SYNAPSE_LOG_LEVEL=INFO
SYNAPSE_LOG_FORMAT=json

# Performance Settings for RPi
SYNAPSE_DATABASE_POOL_SIZE=3
SYNAPSE_DATABASE_MAX_OVERFLOW=5
SYNAPSE_MAX_CONCURRENT_TASKS=5
SYNAPSE_WEBSOCKET_MAX_CONNECTIONS=50

# Security
SYNAPSE_SECRET_KEY=$(openssl rand -base64 32)
EOF
    
    # Secure the environment file
    chmod 600 .env
    
    log_success "Environment configuration created"
    log_warning "Please update the SYNAPSE_GEMINI_API_KEY in the .env file!"
}

initialize_database() {
    log_info "Initializing database..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Initialize database
    python -c "
import asyncio
from app.core.database import init_database

async def setup_db():
    try:
        await init_database()
        print('Database initialized successfully!')
    except Exception as e:
        print(f'Database initialization failed: {e}')
        raise

asyncio.run(setup_db())
"
    
    log_success "Database initialization completed"
}

test_installation() {
    log_info "Testing installation..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Start server in background for testing
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -s http://127.0.0.1:8000/health | jq '.status' | grep -q "healthy"; then
        log_success "Health endpoint test passed"
    else
        log_error "Health endpoint test failed"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Test API endpoint
    if curl -s http://127.0.0.1:8000/ | jq '.name' | grep -q "Synapse-Hub"; then
        log_success "API endpoint test passed"
    else
        log_error "API endpoint test failed"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
    
    log_success "Installation tests completed successfully"
}

setup_systemd_service() {
    if [[ "$SETUP_SERVICE" != "true" ]]; then
        log_info "Skipping systemd service setup"
        return
    fi
    
    log_info "Setting up systemd service..."
    
    # Create service file
    sudo tee /etc/systemd/system/synapse-hub.service > /dev/null << EOF
[Unit]
Description=Synapse-Hub Backend API
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/python -m app.main
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=synapse-hub

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$BACKEND_DIR

# Resource limits for RPi
MemoryMax=1G
MemoryHigh=800M

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable synapse-hub
    
    log_success "Systemd service setup completed"
}

setup_nginx() {
    if [[ "$INSTALL_NGINX" != "true" ]]; then
        log_info "Skipping Nginx setup"
        return
    fi
    
    log_info "Setting up Nginx reverse proxy..."
    
    # Install Nginx
    sudo apt install -y nginx
    
    # Get hostname
    HOSTNAME=$(hostname)
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/synapse-hub << EOF
server {
    listen 80;
    server_name $HOSTNAME.local $HOSTNAME $(hostname -I | awk '{print $1}');

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
    }

    # Root endpoint
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/synapse-hub /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Start and enable Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "Nginx setup completed"
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Install UFW if not present
    sudo apt install -y ufw
    
    # Reset UFW rules
    sudo ufw --force reset
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Allow API port if not using Nginx
    if [[ "$INSTALL_NGINX" != "true" ]]; then
        sudo ufw allow 8000
    fi
    
    # Enable firewall
    sudo ufw --force enable
    
    log_success "Firewall configuration completed"
}

start_services() {
    log_info "Starting services..."
    
    if [[ "$SETUP_SERVICE" == "true" ]]; then
        sudo systemctl start synapse-hub
        
        # Check service status
        if sudo systemctl is-active --quiet synapse-hub; then
            log_success "Synapse-Hub service started successfully"
        else
            log_error "Failed to start Synapse-Hub service"
            log_info "Check logs with: sudo journalctl -u synapse-hub -n 20"
            exit 1
        fi
    fi
    
    if [[ "$INSTALL_NGINX" == "true" ]]; then
        if sudo systemctl is-active --quiet nginx; then
            log_success "Nginx is running"
        else
            log_error "Nginx failed to start"
            exit 1
        fi
    fi
}

create_test_script() {
    log_info "Creating test script..."
    
    cat > "$BACKEND_DIR/test_deployment.sh" << 'EOF'
#!/bin/bash
set -e

echo "🧪 Testing Synapse-Hub Backend Deployment..."

# Test health endpoint
echo "Testing health endpoint..."
health_response=$(curl -s http://localhost:8000/health)
echo "Health: $health_response"

# Test API endpoints
echo "Testing API endpoints..."
curl -s http://localhost:8000/ | jq '.'

# Test task creation
echo "Testing task creation..."
task_response=$(curl -s -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Deployment test"}')
echo "Task created: $task_response"

echo "✅ All tests completed!"
EOF
    
    chmod +x "$BACKEND_DIR/test_deployment.sh"
    
    log_success "Test script created at $BACKEND_DIR/test_deployment.sh"
}

print_final_info() {
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    HOSTNAME=$(hostname)
    
    echo
    echo "🎉 Synapse-Hub Backend Deployment Completed Successfully!"
    echo
    echo "📋 Deployment Summary:"
    echo "   • Backend Directory: $BACKEND_DIR"
    echo "   • Database: $BACKEND_DIR/synapse_hub.db"
    echo "   • Logs: sudo journalctl -u synapse-hub -f"
    echo
    echo "🌐 Access URLs:"
    if [[ "$INSTALL_NGINX" == "true" ]]; then
        echo "   • API (via Nginx): http://$LOCAL_IP/ or http://$HOSTNAME.local/"
        echo "   • Health Check: http://$LOCAL_IP/health"
    else
        echo "   • API (direct): http://$LOCAL_IP:8000/"
        echo "   • Health Check: http://$LOCAL_IP:8000/health"
    fi
    echo
    echo "⚙️ Service Management:"
    echo "   • Start: sudo systemctl start synapse-hub"
    echo "   • Stop: sudo systemctl stop synapse-hub"
    echo "   • Restart: sudo systemctl restart synapse-hub"
    echo "   • Status: sudo systemctl status synapse-hub"
    echo "   • Logs: sudo journalctl -u synapse-hub -f"
    echo
    echo "🧪 Testing:"
    echo "   • Run: $BACKEND_DIR/test_deployment.sh"
    echo
    echo "⚠️  Important Next Steps:"
    echo "   1. Update SYNAPSE_GEMINI_API_KEY in $BACKEND_DIR/.env"
    echo "   2. Test the deployment with the test script"
    echo "   3. Setup the frontend UI to connect to this backend"
    echo "   4. Install cursor-connector on your development machine"
    echo
    echo "📚 Documentation:"
    echo "   • Full Guide: docs/deployment/RPI_SETUP_GUIDE.md"
    echo "   • Troubleshooting: Check the guide for common issues"
    echo
}

# Main execution
main() {
    echo "🚀 Starting Synapse-Hub Raspberry Pi Setup..."
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --repo-url)
                REPO_URL="$2"
                shift 2
                ;;
            --install-nginx)
                INSTALL_NGINX=true
                shift
                ;;
            --no-service)
                SETUP_SERVICE=false
                shift
                ;;
            --python-version)
                PYTHON_VERSION="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --repo-url URL      Repository URL to clone"
                echo "  --install-nginx     Install and configure Nginx"
                echo "  --no-service        Skip systemd service setup"
                echo "  --python-version V  Python version to install (default: 3.11)"
                echo "  -h, --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute setup steps
    check_requirements
    update_system
    install_python
    setup_project_structure
    setup_python_environment
    create_environment_config
    initialize_database
    test_installation
    setup_systemd_service
    setup_nginx
    setup_firewall
    start_services
    create_test_script
    print_final_info
    
    log_success "Setup completed successfully! 🎉"
}

# Run main function
main "$@" 