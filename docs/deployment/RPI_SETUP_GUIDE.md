# Raspberry Pi Deployment Guide - Synapse-Hub Backend

## 🎯 Overview

This guide will help you deploy the Synapse-Hub backend on your Raspberry Pi 3B. The backend provides AI orchestration capabilities with FastAPI, SQLite database, and real-time WebSocket communication.

## 📋 Prerequisites

### Hardware Requirements

- **Raspberry Pi 3B or newer** (4GB+ RAM recommended)
- **SD Card**: 32GB+ (Class 10 recommended)
- **Network**: Ethernet or WiFi connection
- **Power Supply**: Official RPi power adapter

### Software Requirements

- **Raspberry Pi OS** (64-bit recommended)
- **Python 3.9+** (3.11+ preferred)
- **Git** for repository management
- **SSH access** enabled (optional but recommended)

---

## 🚀 Step-by-Step Setup

### 1. Prepare Your Raspberry Pi

#### Flash Raspberry Pi OS

```bash
# Download Raspberry Pi Imager
# Flash Raspberry Pi OS (64-bit) to your SD card
# Enable SSH in the imager if you want remote access
```

#### First Boot Configuration

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl wget vim htop

# Install Python development tools
sudo apt install -y python3-pip python3-venv python3-dev

# Install build tools (needed for some Python packages)
sudo apt install -y build-essential libssl-dev libffi-dev
```

### 2. Setup Python Environment

#### Install Python 3.11 (Recommended)

```bash
# Add deadsnakes PPA for newer Python versions
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Verify installation
python3.11 --version
```

#### Create Project User (Optional but Recommended)

```bash
# Create dedicated user for the service
sudo adduser synapse
sudo usermod -aG sudo synapse

# Switch to the new user
sudo su - synapse
```

### 3. Clone and Setup the Project

#### Clone Repository

```bash
# Clone the repository
cd ~
git clone <your-repo-url> synapse-hub
cd synapse-hub

# Navigate to backend directory
cd rpi-backend
```

#### Create Virtual Environment

```bash
# Create virtual environment with Python 3.11
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

#### Install Dependencies

```bash
# Install backend dependencies
pip install -r requirements.txt

# If you encounter errors, try installing problematic packages individually:
# pip install --no-cache-dir sqlalchemy[asyncio]==2.0.25
# pip install --no-cache-dir aiosqlite==0.19.0
```

### 4. Configure the Application

#### Create Environment Configuration

```bash
# Create .env file for configuration
cat > .env << 'EOF'
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
SYNAPSE_DATABASE_URL=sqlite+aiosqlite:///./synapse_hub.db
SYNAPSE_DATABASE_ECHO=false

# AI API Keys (add your keys here)
SYNAPSE_GEMINI_API_KEY=your_gemini_api_key_here

# CORS Settings (adjust based on your UI deployment)
SYNAPSE_ALLOWED_ORIGINS=["http://localhost:5173","http://192.168.1.100:5173"]

# Logging
SYNAPSE_LOG_LEVEL=INFO
SYNAPSE_LOG_FORMAT=json

# Performance Settings for RPi
SYNAPSE_DATABASE_POOL_SIZE=3
SYNAPSE_DATABASE_MAX_OVERFLOW=5
SYNAPSE_MAX_CONCURRENT_TASKS=5
SYNAPSE_WEBSOCKET_MAX_CONNECTIONS=50
EOF
```

#### Set Proper Permissions

```bash
# Make sure the environment file is secure
chmod 600 .env

# Create data directories
mkdir -p data logs storage
chmod 755 data logs storage
```

### 5. Initialize Database

#### Run Database Setup

```bash
# Activate virtual environment if not already active
source venv/bin/activate

# Initialize database (this will create tables)
python -c "
import asyncio
from app.core.database import init_database
asyncio.run(init_database())
print('Database initialized successfully!')
"
```

#### Verify Database Creation

```bash
# Check if database file was created
ls -la synapse_hub.db

# You should see the database file with proper permissions
```

### 6. Test the Installation

#### Run Development Server

```bash
# Activate virtual environment
source venv/bin/activate

# Start the server in development mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Test Health System

```bash
# Run the comprehensive health verification script
python scripts/verify_health.py

# Or test individual health endpoints
curl http://localhost:8000/health

# Test individual service health
curl http://localhost:8000/health/services/database
curl http://localhost:8000/health/services/system

# Check health history
curl http://localhost:8000/health/history?limit=5

# Expected response for healthy system:
# {"status":"healthy","version":"0.1.0","environment":"production","services":{"database":"healthy","system":"healthy",...}}
```

#### Test API Endpoints

```bash
# Test root endpoint
curl http://localhost:8000/

# Test creating a task
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Testing RPi deployment"}'

# Test listing tasks
curl http://localhost:8000/api/tasks/
```

### 7. Production Deployment

#### Create Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/synapse-hub.service > /dev/null << 'EOF'
[Unit]
Description=Synapse-Hub Backend API
After=network.target

[Service]
Type=simple
User=synapse
Group=synapse
WorkingDirectory=/home/synapse/synapse-hub/rpi-backend
Environment=PATH=/home/synapse/synapse-hub/rpi-backend/venv/bin
EnvironmentFile=/home/synapse/synapse-hub/rpi-backend/.env
ExecStart=/home/synapse/synapse-hub/rpi-backend/venv/bin/python -m app.main
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
ReadWritePaths=/home/synapse/synapse-hub/rpi-backend

[Install]
WantedBy=multi-user.target
EOF
```

#### Enable and Start Service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable synapse-hub

# Start the service
sudo systemctl start synapse-hub

# Check service status
sudo systemctl status synapse-hub

# View logs
sudo journalctl -u synapse-hub -f
```

### 8. Setup Nginx Reverse Proxy (Optional)

#### Install Nginx

```bash
sudo apt install -y nginx
```

#### Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/synapse-hub << 'EOF'
server {
    listen 80;
    server_name your-rpi-hostname.local;  # Adjust as needed

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Serve static files if needed
    location /static/ {
        alias /home/synapse/synapse-hub/rpi-backend/static/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

#### Enable Nginx Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/synapse-hub /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔧 Configuration & Optimization

### Raspberry Pi Optimizations

#### Memory Management

```bash
# Add to /etc/systemd/system/synapse-hub.service under [Service]
MemoryMax=1G
MemoryHigh=800M
```

#### CPU Governor

```bash
# Set performance governor for better response times
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

#### Swap Configuration

```bash
# Increase swap for better memory management
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Database Optimizations

#### SQLite Configuration

```python
# Add to your .env file
SYNAPSE_DATABASE_URL=sqlite+aiosqlite:///./synapse_hub.db?cache=shared&journal_mode=WAL
```

### Monitoring Setup

#### Log Rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/synapse-hub << 'EOF'
/home/synapse/synapse-hub/rpi-backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 synapse synapse
    postrotate
        systemctl reload synapse-hub
    endscript
}
EOF
```

---

## 🧪 Testing & Verification

### Automated Testing Script

```bash
# Create test script
cat > test_deployment.sh << 'EOF'
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

# Test WebSocket (requires wscat: npm install -g wscat)
if command -v wscat &> /dev/null; then
    echo "Testing WebSocket connection..."
    timeout 5 wscat -c ws://localhost:8000/ws/test-connection || echo "WebSocket test completed"
fi

echo "✅ All tests completed!"
EOF

chmod +x test_deployment.sh
./test_deployment.sh
```

### Health Monitoring System ✅

The backend includes a comprehensive health monitoring system that tracks all services in real-time.

#### Verify Health After Deployment

```bash
# Run comprehensive health verification
cd /home/synapse/synapse-hub/rpi-backend
python scripts/verify_health.py

# Expected output:
# 🔍 Synapse-Hub Backend Health Check Verification
# ✅ SYSTEM: healthy (CPU: X%, Memory: Y%, Disk: Z%)
# ✅ DATABASE: healthy (Connection active)
# ⚙️ GEMINI: not_configured (Set GEMINI_API_KEY)
# ⚙️ CURSOR: not_configured (Expected for initial setup)
```

#### Health Endpoints

```bash
# Comprehensive health report with all services
curl http://localhost:8000/health

# Individual service health checks
curl http://localhost:8000/health/services/database
curl http://localhost:8000/health/services/system
curl http://localhost:8000/health/services/gemini
curl http://localhost:8000/health/services/cursor
curl http://localhost:8000/health/services/websocket

# Health check history (last 10 checks)
curl http://localhost:8000/health/history?limit=10
```

#### Health Status Levels

- **✅ Healthy**: Service operating optimally
- **⚠️ Degraded**: Service functional but with performance issues
- **❌ Unhealthy**: Service has critical issues requiring attention
- **⚙️ Not Configured**: Service not configured (expected during setup)
- **❓ Unknown**: Service status cannot be determined

#### Automated Health Monitoring

```bash
# Set up automated health checks (run every hour)
crontab -e

# Add this line:
0 * * * * cd /home/synapse/synapse-hub/rpi-backend && python scripts/verify_health.py >> /var/log/synapse-hub-health.log 2>&1

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/synapse-hub-health.log
sudo chown synapse:synapse /var/log/synapse-hub-health.log
```

### Performance Monitoring

```bash
# Monitor resource usage with built-in health system
curl http://localhost:8000/health/services/system

# Traditional monitoring commands
htop                                    # Resource usage
sudo journalctl -u synapse-hub -f      # Service logs
du -h synapse_hub.db                   # Database size
sudo netstat -tlnp | grep :8000        # Network connections
```

---

## 🔒 Security Considerations

### Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow API port (if not using Nginx)
sudo ufw allow 8000

# Enable firewall
sudo ufw enable
```

### SSL/TLS Setup (Production)

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service status
sudo systemctl status synapse-hub

# Check logs for errors
sudo journalctl -u synapse-hub -n 50

# Check if port is already in use
sudo netstat -tlnp | grep :8000

# Test manual startup
cd /home/synapse/synapse-hub/rpi-backend
source venv/bin/activate
python -m app.main
```

#### Database Issues

```bash
# Check database permissions
ls -la synapse_hub.db

# Reset database if needed
rm synapse_hub.db
python -c "import asyncio; from app.core.database import init_database; asyncio.run(init_database())"
```

#### Memory Issues

```bash
# Check memory usage
free -h

# Check for memory leaks
ps aux | grep python

# Restart service
sudo systemctl restart synapse-hub
```

#### Network Issues

```bash
# Check if service is listening
sudo netstat -tlnp | grep :8000

# Test local connectivity
curl http://127.0.0.1:8000/health

# Check firewall rules
sudo ufw status
```

### Performance Tuning

#### For Limited Memory (1GB RPi)

```bash
# Reduce workers and connections in .env
SYNAPSE_WORKERS=1
SYNAPSE_DATABASE_POOL_SIZE=2
SYNAPSE_DATABASE_MAX_OVERFLOW=3
SYNAPSE_MAX_CONCURRENT_TASKS=3
SYNAPSE_WEBSOCKET_MAX_CONNECTIONS=25
```

#### For Better Performance (4GB+ RPi)

```bash
# Increase resources in .env
SYNAPSE_WORKERS=4
SYNAPSE_DATABASE_POOL_SIZE=5
SYNAPSE_DATABASE_MAX_OVERFLOW=10
SYNAPSE_MAX_CONCURRENT_TASKS=10
SYNAPSE_WEBSOCKET_MAX_CONNECTIONS=100
```

---

## 📋 Next Steps

After successful deployment:

1. **🔑 Configure API Keys**: Add your Gemini API key to the `.env` file
2. **🌐 Setup Frontend**: Deploy the SvelteKit UI to connect to your backend
3. **🔗 Install Cursor Connector**: Set up the cursor-connector on your development machine
4. **📊 Monitor Performance**: Set up monitoring and logging
5. **🔄 Setup Backups**: Implement regular database backups

### Quick Commands Reference

```bash
# Service management
sudo systemctl start synapse-hub
sudo systemctl stop synapse-hub
sudo systemctl restart synapse-hub
sudo systemctl status synapse-hub

# View logs
sudo journalctl -u synapse-hub -f

# Health monitoring
python scripts/verify_health.py           # Comprehensive health check
curl http://localhost:8000/health         # Health API endpoint
curl http://localhost:8000/health/services/system  # System resources

# Test endpoints
curl http://localhost:8000/               # Root endpoint
curl http://localhost:8000/api/tasks/     # Tasks API

# Update deployment
cd ~/synapse-hub && git pull
sudo systemctl restart synapse-hub
python scripts/verify_health.py          # Verify after update
```

---

🎉 **Congratulations!** Your Synapse-Hub backend is now running on your Raspberry Pi!

For additional support, check the main project documentation or create an issue in the repository.
