"""
Test configuration and fixtures for Synapse-Hub backend testing.
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db_session, Base
from app.core.config import get_settings


# Test database URL - use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    """Create a test database engine."""
    # Import here to avoid circular imports
    from app.core.database import create_database_engine, create_session_maker
    import app.core.database as db_module
    
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    
    # Set the global engine and session maker for the database module
    db_module.engine = engine
    db_module.async_session_maker = create_session_maker(engine)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    
    # Reset global variables
    db_module.engine = None
    db_module.async_session_maker = None


@pytest_asyncio.fixture(scope="function")
async def test_db_session(test_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with AsyncSession(
        test_db_engine, 
        expire_on_commit=False,
        autoflush=False,
        autocommit=False
    ) as session:
        yield session


@pytest.fixture(scope="function")
def override_get_db(test_db_session: AsyncSession):
    """Override the get_db dependency to use test database."""
    async def _override_get_db():
        yield test_db_session
    return _override_get_db


@pytest.fixture(scope="function")
def test_client(override_get_db) -> TestClient:
    """Create a test client with test database dependency override."""
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def async_test_client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for async testing."""
    app.dependency_overrides[get_db_session] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_settings():
    """Get test settings configuration."""
    settings = get_settings()
    settings.database_url = TEST_DATABASE_URL
    settings.testing = True
    return settings


# Sample test data fixtures
@pytest.fixture
def sample_task_data():
    """Sample task data for testing."""
    return {
        "title": "Test Task",
        "description": "This is a test task for unit testing",
        "ai_provider": "gemini",
        "ssh_remote_host": None,
        "ssh_project_path": None
    }


@pytest.fixture
def sample_message_data():
    """Sample message data for testing."""
    return {
        "content": "This is a test message",
        "sender": "user",
        "related_file_name": None
    }


@pytest.fixture
def sample_task_update_data():
    """Sample task update data for testing."""
    return {
        "title": "Updated Test Task",
        "description": "This task has been updated",
        "priority": "high"
    } 