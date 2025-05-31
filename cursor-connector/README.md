# Cursor Connector Agent

The Cursor Connector Agent is a local machine automation tool that enables remote control of the Cursor IDE through the Synapse-Hub AI orchestration system. It provides seamless integration between your local development environment and the RPi backend for AI-assisted coding workflows.

## Features

- 🔗 **RPi Backend Integration** - Connect to Synapse-Hub RPi backend
- 🖱️ **Cursor Automation** - Control Cursor IDE programmatically
- 🌐 **SSH Context Support** - Handle remote development scenarios
- 📡 **Real-time Communication** - WebSocket-based real-time updates
- 🔄 **Health Monitoring** - Automatic status reporting and recovery
- 🏗️ **Cross-platform** - Support for Windows, macOS, and Linux
- ⚙️ **Configurable** - Extensive configuration options

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Cursor IDE installed and accessible
- Access to Synapse-Hub RPi backend

### Installation

1. **Clone or download the cursor-connector**

   ```bash
   cd cursor-connector
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure the agent**

   ```bash
   cp env.example .env
   # Edit .env with your RPi backend details
   ```

4. **Run the agent**
   ```bash
   python main.py
   ```

### Basic Configuration

Edit the `.env` file with your RPi backend connection details:

```bash
# RPi Backend Connection
RPI_HOST=192.168.1.100  # Your RPi IP address
RPI_PORT=8000
RPI_PROTOCOL=http

# Enable mock mode for testing
MOCK_CURSOR=true
DEBUG=true
```

## Usage

### Running the Agent

**Basic usage:**

```bash
python main.py
```

**With command line options:**

```bash
python main.py --debug --mock-cursor --rpi-host 192.168.1.100
```

**As a background service:**

```bash
nohup python main.py > agent.log 2>&1 &
```

### Command Line Options

```
Options:
  --rpi-host HOST         RPi backend hostname
  --rpi-port PORT         RPi backend port
  --debug                 Enable debug mode
  --mock-cursor           Enable mock Cursor mode for testing
  --log-level LEVEL       Set logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  --log-file FILE         Log file path
  --version               Show version information
  -h, --help              Show help message
```

### Environment Variables

| Variable       | Description                | Default     |
| -------------- | -------------------------- | ----------- |
| `RPI_HOST`     | RPi backend hostname       | `localhost` |
| `RPI_PORT`     | RPi backend port           | `8000`      |
| `RPI_PROTOCOL` | Protocol (http/https)      | `http`      |
| `RPI_API_KEY`  | API key for authentication | None        |
| `LOG_LEVEL`    | Logging level              | `INFO`      |
| `DEBUG`        | Enable debug mode          | `false`     |
| `MOCK_CURSOR`  | Enable mock mode           | `false`     |

## Architecture

### Components

1. **Agent Core** (`src/agent.py`)

   - Main orchestration and lifecycle management
   - Background task coordination
   - Signal handling and graceful shutdown

2. **RPi Client** (`src/communication/rpi_client.py`)

   - HTTP API communication with retry logic
   - WebSocket real-time messaging
   - Health monitoring and status reporting

3. **Configuration** (`src/config/settings.py`)

   - Environment-based configuration
   - Platform-specific settings
   - Validation and defaults

4. **Logging** (`src/utils/logging.py`)
   - Structured logging with context
   - File rotation and platform-specific paths
   - Development and production modes

### Data Flow

```
RPi Backend ←→ Agent ←→ Cursor IDE
     ↑              ↑
   Task Queue    Automation
   WebSocket     UI Control
   API Calls     SSH Context
```

## Development

### Project Structure

```
cursor-connector/
├── src/
│   ├── config/
│   │   └── settings.py          # Configuration management
│   ├── communication/
│   │   └── rpi_client.py        # RPi backend client
│   ├── automation/              # UI automation (Phase 3.2)
│   ├── utils/
│   │   └── logging.py           # Logging utilities
│   └── agent.py                 # Main agent class
├── tests/                       # Test files
├── requirements.txt             # Python dependencies
├── main.py                      # Entry point
├── env.example                  # Example configuration
└── README.md                    # This file
```

### Testing

**Run with mock mode for testing:**

```bash
MOCK_CURSOR=true DEBUG=true python main.py
```

**Test RPi connection:**

```bash
python -c "
import asyncio
from src.communication.rpi_client import RPiClient

async def test():
    async with RPiClient() as client:
        health = await client.health_check()
        print('RPi Health:', health)

asyncio.run(test())
"
```

### Adding New Features

1. **Phase 3.2 - UI Automation Engine**

   - Implement `src/automation/cursor_controller.py`
   - Add platform-specific automation modules
   - Integrate with main agent execution flow

2. **Phase 3.3 - SSH Context Support**
   - Add SSH context detection
   - Implement remote project awareness
   - Enhance security and credential management

## Configuration Reference

### Agent Behavior

```bash
# Polling and timeouts
POLL_INTERVAL=2.0              # Task polling interval (seconds)
COMMAND_TIMEOUT=300            # Command execution timeout (seconds)
CONNECTION_TIMEOUT=30          # Connection timeout (seconds)
RETRY_ATTEMPTS=3               # Number of retry attempts
HEARTBEAT_INTERVAL=30          # Status heartbeat interval (seconds)
```

### Cursor Settings

```bash
# Cursor executable path (auto-detected if not specified)
CURSOR_PATH=/Applications/Cursor.app/Contents/MacOS/Cursor  # macOS
CURSOR_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\cursor\Cursor.exe  # Windows
CURSOR_PATH=/usr/bin/cursor    # Linux

# Detection and response timeouts
CURSOR_DETECTION_TIMEOUT=10    # Cursor detection timeout (seconds)
CURSOR_RESPONSE_TIMEOUT=120    # AI response timeout (seconds)
```

### SSH Context

```bash
SSH_CONTEXT_ENABLED=true       # Enable SSH context detection
SSH_CONFIG_PATH=~/.ssh/config  # SSH configuration file path
```

### Logging

```bash
LOG_LEVEL=INFO                 # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE=cursor-connector.log  # Log file name (optional)
LOG_ROTATION=true              # Enable log rotation
LOG_MAX_SIZE=10MB              # Maximum log file size
LOG_BACKUP_COUNT=5             # Number of backup log files
```

## Troubleshooting

### Common Issues

**Connection refused to RPi backend:**

```bash
# Check RPi backend is running
curl http://your-rpi-ip:8000/api/health

# Verify network connectivity
ping your-rpi-ip
```

**Cursor not detected:**

```bash
# Test with mock mode first
MOCK_CURSOR=true python main.py

# Check Cursor path
CURSOR_PATH=/path/to/cursor python main.py
```

**Permission errors:**

```bash
# Ensure proper permissions for automation
# macOS: Grant accessibility permissions in System Preferences
# Linux: Install xdotool and ensure X11 access
# Windows: Run as administrator if needed
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
DEBUG=true LOG_LEVEL=DEBUG python main.py
```

This provides detailed information about:

- RPi communication attempts
- Cursor detection and interaction
- WebSocket connection status
- Command execution flow

### Log Files

Logs are stored in platform-specific locations:

- **macOS:** `~/Library/Logs/CursorConnector/`
- **Windows:** `%LOCALAPPDATA%\CursorConnector\logs\`
- **Linux:** `~/.local/share/cursor-connector/logs/`

## Security Considerations

- API keys are never logged in plain text
- All communications can be encrypted via HTTPS/WSS
- SSH context information is handled securely
- Local automation requires appropriate system permissions

## Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new functionality
3. Update documentation for any configuration changes
4. Use structured logging for debugging information

## License

This project is part of the Synapse-Hub AI orchestration system.

---

For more information about the complete Synapse-Hub system, see the main project documentation.
