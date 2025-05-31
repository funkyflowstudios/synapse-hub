# 🍓 Raspberry Pi Setup - Quick Start

This guide helps you deploy the Synapse-Hub backend on your Raspberry Pi in minutes!

## 🚀 Quick Setup (Automated)

### Option 1: One-Line Install (Recommended)

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/your-username/synapse-hub/main/scripts/rpi_setup.sh | bash
```

### Option 2: Manual Download and Run

```bash
# Clone the repository
git clone https://github.com/your-username/synapse-hub.git
cd synapse-hub

# Run the setup script
./scripts/rpi_setup.sh
```

### Option 3: With Custom Options

```bash
# Install with Nginx reverse proxy
./scripts/rpi_setup.sh --install-nginx

# Use a different repository URL
./scripts/rpi_setup.sh --repo-url https://github.com/your-fork/synapse-hub.git

# Skip systemd service setup (manual mode)
./scripts/rpi_setup.sh --no-service

# View all options
./scripts/rpi_setup.sh --help
```

## 📋 What the Script Does

The automated setup script will:

1. ✅ **Update your Raspberry Pi** with latest packages
2. ✅ **Install Python 3.11** and development tools
3. ✅ **Clone the project** and set up the directory structure
4. ✅ **Create virtual environment** and install dependencies
5. ✅ **Initialize the database** with proper schema
6. ✅ **Configure the application** with optimized settings for RPi
7. ✅ **Set up systemd service** for automatic startup
8. ✅ **Configure firewall** with secure defaults
9. ✅ **Test the installation** to ensure everything works
10. ✅ **Provide access information** and next steps

## ⏱️ Estimated Time

- **Fresh Raspberry Pi**: 15-20 minutes
- **Existing setup**: 5-10 minutes

## 📋 Prerequisites

### Hardware

- Raspberry Pi 3B or newer (4GB+ RAM recommended)
- SD card with 32GB+ free space
- Internet connection

### Software

- Raspberry Pi OS (64-bit recommended)
- SSH access (optional but recommended)

## 🎯 After Installation

Once the script completes, you'll have:

### 🌐 Working API Server

```bash
# Test the health endpoint
curl http://your-rpi-ip:8000/health

# Expected response:
{"status":"healthy","version":"0.1.0",...}
```

### ⚙️ System Service

```bash
# Service management commands
sudo systemctl status synapse-hub    # Check status
sudo systemctl restart synapse-hub   # Restart service
sudo journalctl -u synapse-hub -f    # View logs
```

### 🧪 Testing Tools

```bash
# Run the built-in test suite
~/synapse-hub/rpi-backend/test_deployment.sh
```

## 🔑 Important Next Steps

1. **Add your Gemini API key**:

   ```bash
   nano ~/synapse-hub/rpi-backend/.env
   # Update: SYNAPSE_GEMINI_API_KEY=your_actual_api_key_here
   sudo systemctl restart synapse-hub
   ```

2. **Test the API**:

   ```bash
   curl -X POST http://your-rpi-ip:8000/api/tasks/ \
     -H "Content-Type: application/json" \
     -d '{"title": "First Task", "description": "Testing the API"}'
   ```

3. **Set up the frontend** (SvelteKit UI) on your development machine

4. **Install cursor-connector** on your development machine to complete the setup

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check service status and logs
sudo systemctl status synapse-hub
sudo journalctl -u synapse-hub -n 20

# Test manual startup
cd ~/synapse-hub/rpi-backend
source venv/bin/activate
python -m app.main
```

### Can't Access from Other Devices

```bash
# Check firewall
sudo ufw status

# Check if service is listening
sudo netstat -tlnp | grep :8000

# Get your RPi IP address
hostname -I
```

### Database Issues

```bash
# Check database file
ls -la ~/synapse-hub/rpi-backend/synapse_hub.db

# Reinitialize if needed
cd ~/synapse-hub/rpi-backend
source venv/bin/activate
rm synapse_hub.db
python -c "import asyncio; from app.core.database import init_database; asyncio.run(init_database())"
```

## 📚 Full Documentation

For detailed documentation, troubleshooting, and manual setup instructions, see:

- [Complete RPi Setup Guide](docs/deployment/RPI_SETUP_GUIDE.md)
- [Backend README](rpi-backend/README.md)
- [Project Architecture](docs/architecture/DEVELOPMENT_PLAN.md)

## 💡 Tips for Raspberry Pi

### Performance Optimization

- Use a **fast SD card** (Class 10 or better)
- Consider **USB 3.0 storage** for better I/O performance
- Enable **SSH** for easier remote management
- Set up **log rotation** to prevent disk space issues

### Monitoring

```bash
# Check system resources
htop

# Monitor service logs
sudo journalctl -u synapse-hub -f

# Check disk space
df -h
```

## 🎉 Success!

If everything is working, you should see:

```bash
# Healthy API response
curl http://your-rpi-ip:8000/health
{"status":"healthy","version":"0.1.0","environment":"production","services":{"database":"healthy"}}

# Service running
sudo systemctl is-active synapse-hub
active
```

**Next**: Set up the [cursor-connector](cursor-connector/README.md) on your development machine to complete the AI orchestration system!

---

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting) above
2. Review the [full setup guide](docs/deployment/RPI_SETUP_GUIDE.md)
3. Check the service logs: `sudo journalctl -u synapse-hub -f`
4. Create an issue in the repository with the error details

Happy building! 🚀
