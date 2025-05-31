# Synapse-Hub Development Plan

## Project Overview
Transform the existing Synapse-Hub SvelteKit UI into a complete AI orchestration system with:
- Raspberry Pi 3B backend server
- Cursor Connector for local machine integration
- Real-time task management and AI agent coordination
- Support for both local and remote SSH-based Cursor workflows

---

## Phase 1: Backend Foundation (RPi Server)

### 1.1 Core Backend Setup
- **Technology Stack**: Python with FastAPI (chosen for automatic OpenAPI docs and async support)
- **Database**: SQLite with SQLAlchemy ORM for easier model management
- **Project Structure**: 
  ```
  rpi-backend/
  ├── app/
  │   ├── models/
  │   ├── api/
  │   ├── services/
  │   ├── core/
  │   └── connectors/
  ├── tests/
  ├── requirements.txt
  └── main.py
  ```

### 1.2 Database Schema Implementation
- **Task Model**: 
  - task_id (UUID, PK)
  - title, description
  - status (enum: Pending, Processing-Cursor, AwaitingUser-Gemini, etc.)
  - current_turn (enum: User, Cursor, Gemini, System)
  - timestamps, ai_contexts (JSON)
- **Message Model**:
  - message_id (UUID, PK)
  - task_id (FK), sender, content, timestamp
  - related_file_name (optional)
- **SQLAlchemy models with proper relationships and indexes**

### 1.3 Core Services Development
- **Task Service**: CRUD operations, state management, status transitions
- **Message Service**: Message storage, retrieval, chronological ordering
- **WebSocket Manager**: Real-time communication with UI clients
- **Configuration Service**: Environment variables, API keys management

### 1.4 RESTful API Endpoints
- **Task Management**:
  - `POST /api/tasks` - Create task
  - `GET /api/tasks` - List tasks with pagination
  - `GET /api/tasks/{task_id}` - Get task details
  - `PUT /api/tasks/{task_id}` - Update task
  - `DELETE /api/tasks/{task_id}` - Delete task
- **Message Management**:
  - `POST /api/tasks/{task_id}/messages` - Send message
  - `GET /api/tasks/{task_id}/messages` - Get message history
  - `POST /api/tasks/{task_id}/relay` - Relay to other AI
- **System Status**:
  - `GET /api/health` - System health check
  - `GET /api/agents/status` - AI agent connection status

### 1.5 WebSocket Implementation
- **Connection Management**: Handle multiple UI clients
- **Real-time Updates**: Push new messages, status changes, agent updates
- **Error Handling**: Graceful connection recovery and error broadcasting

---

## Phase 2: AI Integration Services

### 2.1 Gemini API Handler
- **Direct API Integration**: Using Google's official Gemini SDK
- **Service Architecture**:
  - Gemini client wrapper with retry logic
  - Context management for conversation history
  - Error handling and rate limiting
  - Response formatting and validation
- **Configuration**: Secure API key storage and rotation support
- **Features**: 
  - Multi-turn conversation support
  - File attachment handling (when supported)
  - Response streaming for real-time updates

### 2.2 Cursor Connector Communication
- **Connector Protocol**: Design communication protocol between RPi and Cursor Connector
- **Message Queue System**: Implement task queue for Cursor operations
- **Status Tracking**: Monitor Cursor Connector health and availability
- **Command Interface**: 
  - Send prompts to Cursor Connector
  - Receive responses and status updates
  - Handle remote SSH context information
  - Error recovery and timeout handling

### 2.3 Task State Engine
- **State Machine Implementation**: Define all possible task states and transitions
- **Business Logic**: 
  - Turn management (User → AI → Relay → User cycle)
  - Status validation and enforcement
  - Automatic state transitions based on events
- **Event System**: Emit events for state changes to trigger UI updates
- **Persistence**: Ensure state consistency across server restarts

---

## Phase 3: Cursor Connector Development

### 3.1 Local Machine Agent
- **Technology**: Python with cross-platform UI automation
- **Libraries**: 
  - `pyautogui` for basic automation
  - `pynput` for keyboard/mouse control
  - Platform-specific tools (AppleScript for macOS, PowerShell for Windows)
  - `requests` for RPi communication
- **Architecture**:
  ```
  cursor-connector/
  ├── src/
  │   ├── automation/
  │   ├── communication/
  │   ├── config/
  │   └── utils/
  ├── tests/
  └── requirements.txt
  ```

### 3.2 UI Automation Engine
- **Cursor Window Management**: Detect and activate Cursor application
- **Input Injection**: 
  - Simulate keyboard shortcuts (Cmd/Ctrl+L for AI chat)
  - Type prompts into Cursor's AI interface
  - Handle different Cursor UI layouts and versions
- **Response Extraction**:
  - Monitor clipboard for AI responses
  - Screen reading techniques for response panels
  - Text extraction from Cursor's AI chat interface
- **Error Detection**: Identify when Cursor AI is unavailable or errors occur

### 3.3 Remote SSH Support
- **Context Awareness**: Detect when Cursor is connected via Remote-SSH
- **Project Path Tracking**: Monitor current remote project context
- **SSH Connection Validation**: Verify SSH connection is active before operations
- **User Guidance**: Provide clear feedback about remote connection requirements

### 3.4 Communication with RPi
- **Polling Mechanism**: Regular check for new tasks from RPi backend
- **HTTP Client**: Robust communication with retry and error handling
- **Status Reporting**: Send health status and capability updates to RPi
- **Configuration Sync**: Receive configuration updates from RPi

---

## Phase 4: Frontend Integration

### 4.1 Existing UI Adaptation
- **API Integration**: Replace mock data with real RPi backend calls
- **HTTP Client Service**: Create centralized API communication service
- **Error Handling**: Implement comprehensive error states and user feedback
- **Loading States**: Add proper loading indicators for all async operations

### 4.2 Real-time Communication
- **WebSocket Integration**: Connect to RPi WebSocket server
- **Real-time Updates**: 
  - Live message streaming in CoCreationCanvas
  - Task status updates in OrchestrationForesightDeck
  - Agent status indicators throughout UI
- **Connection Management**: Handle connection drops and reconnection
- **Optimistic Updates**: Immediate UI feedback with server confirmation

### 4.3 Enhanced Task Management
- **Task Creation Flow**: 
  - Enhanced form with remote SSH context fields
  - Project selection and validation
  - AI agent preference settings
- **Task List Management**: Browse, filter, and search existing tasks
- **Task Details View**: Comprehensive view with full message history

### 4.4 Message System Enhancement
- **Rich Message Display**: 
  - Code syntax highlighting
  - File attachments preview
  - Timestamp and sender indicators
  - Message status (sent, delivered, error)
- **Message Input Enhancement**:
  - AI agent selection (Gemini/Cursor)
  - File attachment support
  - Message drafts and auto-save
- **Relay Functionality**: One-click relay between AI agents

### 4.5 Agent Status Dashboard
- **Connection Indicators**: Real-time status of Gemini API and Cursor Connector
- **Performance Metrics**: Response times, success rates, error tracking
- **Remote Context Display**: Show current SSH connection and project context
- **Agent Configuration**: Settings for each AI agent

---

## Phase 5: Advanced Features

### 5.1 Authentication & Security
- **User Authentication**: Simple token-based auth for UI access
- **API Security**: Rate limiting, input validation, CORS configuration
- **Secure Storage**: Encrypted storage for API keys and sensitive data
- **Network Security**: HTTPS/WSS configuration for production

### 5.2 Configuration Management
- **RPi Configuration**: Web-based admin panel for server settings
- **Connector Configuration**: Local settings file with UI for editing
- **Environment Profiles**: Development, staging, production configurations
- **Auto-discovery**: Automatic RPi discovery on local network

### 5.3 Monitoring & Logging
- **Comprehensive Logging**: Structured logging across all components
- **Health Monitoring**: System metrics and performance tracking
- **Error Tracking**: Centralized error collection and alerting
- **Usage Analytics**: Task completion rates, AI performance metrics

### 5.4 Backup & Recovery
- **Database Backup**: Automated SQLite backup with rotation
- **Configuration Backup**: Export/import system configurations
- **Message Export**: Export conversation history in various formats
- **System Recovery**: Automated recovery procedures for common failures

---

## Phase 6: Testing & Quality Assurance

### 6.1 Backend Testing
- **Unit Tests**: Comprehensive test coverage for all services and models
- **Integration Tests**: Test API endpoints and database interactions
- **WebSocket Testing**: Real-time communication testing
- **Load Testing**: Performance testing with multiple concurrent users

### 6.2 Connector Testing
- **UI Automation Testing**: Test Cursor interaction on different platforms
- **SSH Scenario Testing**: Validate remote SSH workflows
- **Error Recovery Testing**: Test handling of various failure scenarios
- **Performance Testing**: Response time and reliability metrics

### 6.3 Frontend Testing
- **Component Testing**: Test UI components with real backend integration
- **E2E Testing**: Complete user workflow testing with Playwright
- **Real-time Testing**: WebSocket connection and update testing
- **Cross-browser Testing**: Ensure compatibility across browsers

### 6.4 System Integration Testing
- **End-to-End Workflows**: Test complete user scenarios across all components
- **Network Resilience**: Test behavior with network interruptions
- **Multi-user Scenarios**: Test concurrent usage patterns
- **Performance Under Load**: System behavior with multiple active tasks

---

## Phase 7: Deployment & Documentation

### 7.1 Deployment Strategy
- **RPi Setup Scripts**: Automated installation and configuration scripts
- **Connector Distribution**: Cross-platform installer packages
- **Docker Containers**: Optional containerized deployment
- **Update Mechanism**: Automated update system for all components

### 7.2 Documentation
- **User Documentation**: Complete setup and usage guides
- **API Documentation**: Comprehensive API reference with examples
- **Developer Documentation**: Architecture and contribution guides
- **Troubleshooting Guide**: Common issues and solutions

### 7.3 Production Readiness
- **Performance Optimization**: Final performance tuning and optimization
- **Security Audit**: Security review and penetration testing
- **Monitoring Setup**: Production monitoring and alerting configuration
- **Backup Procedures**: Automated backup and recovery procedures

---

## Implementation Notes

### Technical Decisions
- **FastAPI over Flask**: Better async support, automatic documentation, modern Python features
- **SQLAlchemy**: More robust ORM with better relationship handling
- **WebSockets**: Real-time communication essential for responsive UI
- **Cross-platform Automation**: Support Windows, macOS, and Linux for Cursor Connector

### Architecture Principles
- **Separation of Concerns**: Clear boundaries between UI, backend, and connector
- **Event-Driven Design**: Use events for loose coupling between components
- **Resilient Communication**: Handle network issues and component failures gracefully
- **Extensible Design**: Support for adding new AI agents in the future

### Development Approach
- **Incremental Development**: Each phase builds on previous phases
- **Test-Driven Development**: Write tests before implementation where feasible
- **API-First Design**: Define APIs before implementation
- **User-Centric Design**: Focus on user experience and workflow efficiency

This plan provides a comprehensive roadmap for transforming Synapse-Hub into a complete AI orchestration system while maintaining the existing UI design principles and accessibility standards. 