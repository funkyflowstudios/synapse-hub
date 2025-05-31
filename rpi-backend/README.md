# Synapse-Hub Backend (Raspberry Pi)

## Overview
The Synapse-Hub backend is a FastAPI-based AI orchestration system designed for deployment on Raspberry Pi 3B. It provides the core infrastructure for coordinating AI agents (Cursor and Gemini) with real-time task management and WebSocket communication.

## 🎯 Status: Phase 1.2 COMPLETED ✅
- **Complete Backend Foundation** with FastAPI server
- **Full REST API** for task and message management  
- **Real-time WebSocket** communication system
- **Database Layer** with async SQLAlchemy and SQLite
- **Service Architecture** with proper dependency injection

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Required dependencies (install from requirements.txt)

### Installation
```bash
cd rpi-backend
pip install -r requirements.txt
```

### Running the Server
```bash
# Development mode
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Production mode  
python -m app.main
```

### Health Check
```bash
curl http://127.0.0.1:8000/health
```

## 📁 Project Structure

```
rpi-backend/
├── app/
│   ├── api/                    # FastAPI routers and endpoints
│   │   ├── deps.py            # Dependency injection
│   │   ├── tasks.py           # Task management API
│   │   ├── messages.py        # Message management API
│   │   ├── websockets.py      # Real-time WebSocket handler
│   │   └── connectors.py      # Cursor Connector API (Phase 3)
│   ├── core/                   # Core infrastructure
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connection and session management
│   │   └── exceptions.py      # Error handling and custom exceptions
│   ├── models/                 # SQLAlchemy data models
│   │   ├── base.py            # Base model with audit fields
│   │   ├── tasks.py           # Task model with AI workflow state
│   │   ├── messages.py        # Message model for conversations
│   │   └── connectors.py      # Connector model for Cursor agents
│   ├── services/               # Business logic layer
│   │   ├── task_service.py    # Task CRUD and workflow management
│   │   └── message_service.py # Message management and AI relay
│   └── main.py                # FastAPI application entry point
├── tests/                      # Test suite (Phase 2)
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🔗 API Endpoints

### Task Management
- `POST /api/tasks/` - Create a new task
- `GET /api/tasks/` - List tasks with filtering and pagination
- `GET /api/tasks/{task_id}` - Get task details
- `PUT /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete task (soft delete)

### Task Workflow Operations
- `POST /api/tasks/{task_id}/start` - Start a pending task
- `POST /api/tasks/{task_id}/complete` - Mark task as completed
- `POST /api/tasks/{task_id}/fail` - Mark task as failed
- `POST /api/tasks/{task_id}/retry` - Retry a failed task

### Message Management
- `POST /api/tasks/{task_id}/messages` - Create message in task
- `GET /api/tasks/{task_id}/messages` - Get task messages
- `GET /api/tasks/{task_id}/conversation` - Get full conversation history
- `POST /api/tasks/{task_id}/relay` - Relay message to AI agent
- `POST /api/tasks/{task_id}/system-message` - Add system message

### System Status
- `GET /health` - System health check
- `GET /` - API information

### WebSocket Communication
- `WS /ws/{connection_id}` - Real-time communication endpoint

## 📊 Database Schema

### Tasks Table
- Comprehensive task management with AI workflow states
- Status tracking: PENDING → PROCESSING_CURSOR ⟷ PROCESSING_GEMINI → COMPLETED
- Turn coordination: USER → CURSOR → GEMINI → USER
- SSH context support for remote development
- Progress tracking and error handling

### Messages Table  
- Message storage within task conversations
- Sender tracking (user, cursor, gemini, system)
- Chronological conversation history
- File attachment references

### Connectors Table (Phase 3)
- Cursor Connector instance management
- Status monitoring and health tracking
- Capability tracking (SSH support, concurrency)

## 🔄 Real-time Features

### WebSocket Protocol
```json
{
  "type": "task_update|new_message|agent_status|notification",
  "data": {
    "task_id": "uuid",
    "timestamp": "ISO datetime",
    // ... event-specific data
  }
}
```

### Client Operations
- `subscribe_task` - Subscribe to task updates
- `unsubscribe_task` - Unsubscribe from task updates  
- `ping` - Heartbeat for connection health
- `get_status` - Get connection and server status

## ⚙️ Configuration

### Environment Variables
```bash
# Application
SYNAPSE_DEBUG=true
SYNAPSE_ENVIRONMENT=development
SYNAPSE_HOST=127.0.0.1
SYNAPSE_PORT=8000

# Database
SYNAPSE_DATABASE_URL=sqlite+aiosqlite:///./synapse_hub.db
SYNAPSE_DATABASE_ECHO=false

# AI Integration (Phase 2)
SYNAPSE_GEMINI_API_KEY=your_api_key_here
SYNAPSE_DEFAULT_AI_PROVIDER=gemini

# CORS
SYNAPSE_ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

## 🧪 Testing

### API Testing Examples
```bash
# Create a task
curl -X POST http://127.0.0.1:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Testing the API"}'

# List tasks
curl http://127.0.0.1:8000/api/tasks/

# Health check
curl http://127.0.0.1:8000/health
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://127.0.0.1:8000/ws/test-connection');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe_task',
    data: { task_id: 'task-uuid' }
  }));
};
```

## 🔧 Development

### Code Quality
- Type hints throughout codebase
- Comprehensive error handling
- Async/await patterns for database operations
- Proper dependency injection
- Structured logging

### Architecture Patterns
- **Service Layer**: Business logic separated from API layer
- **Repository Pattern**: Database operations abstracted
- **Dependency Injection**: Proper IoC with FastAPI dependencies
- **Event-Driven**: WebSocket broadcasting for real-time updates

## 🚀 Next Steps (Phase 2)

1. **Gemini API Integration**
   - Direct API client with conversation context
   - Response streaming for real-time updates
   - Error handling and rate limiting

2. **Cursor Connector Protocol**
   - Message queue system for automation commands
   - Status tracking and health monitoring
   - Remote SSH context handling

3. **Enhanced Testing**
   - Unit tests for services and models
   - Integration tests for API endpoints
   - WebSocket communication testing

## 🐛 Known Issues

- **Task Creation**: Minor internal server error requires debugging
- **Documentation**: OpenAPI docs disabled in production mode
- **Authentication**: Placeholder auth system needs implementation

## 📝 Contributing

1. Follow conventional commit messages
2. Ensure all type hints are present
3. Add proper error handling
4. Update documentation for API changes
5. Test WebSocket functionality

## 📄 License

Part of the Synapse-Hub AI Orchestration System. 