"""
Database configuration and session management for Synapse-Hub backend.

Provides SQLAlchemy async engine setup, session management,
and database initialization utilities.
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy import event, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.core.exceptions import DatabaseError, ConfigurationError

# Configure logging
logger = logging.getLogger(__name__)

# Create the declarative base
Base = declarative_base()

# Global variables for engine and session maker
engine = None
async_session_maker = None


def create_database_engine():
    """
    Create and configure the SQLAlchemy async engine.
    
    Returns:
        AsyncEngine: Configured SQLAlchemy async engine
    """
    settings = get_settings()
    
    try:
        # SQLite-specific configuration
        if "sqlite" in settings.database_url:
            engine_kwargs = {
                "echo": settings.database_echo,
                "poolclass": StaticPool,
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 20,
                    "isolation_level": None,
                },
                "pool_pre_ping": True,
                "pool_recycle": 300,
            }
        else:
            # PostgreSQL/MySQL configuration
            engine_kwargs = {
                "echo": settings.database_echo,
                "pool_size": settings.database_pool_size,
                "max_overflow": settings.database_max_overflow,
                "pool_pre_ping": True,
                "pool_recycle": 3600,
            }
        
        engine = create_async_engine(
            settings.database_url,
            **engine_kwargs
        )
        
        # Set up event listener for SQLite pragma settings
        event.listens_for(engine.sync_engine, "connect")(set_sqlite_pragma)
        
        logger.info(f"Database engine created for: {settings.database_name}")
        return engine
        
    except Exception as e:
        logger.error(f"Failed to create database engine: {str(e)}")
        raise ConfigurationError(
            f"Database engine creation failed: {str(e)}",
            config_key="database_url"
        )


def create_session_maker(engine):
    """
    Create the async session maker.
    
    Args:
        engine: SQLAlchemy async engine
        
    Returns:
        async_sessionmaker: Configured session maker
    """
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=True,
        autocommit=False,
    )


async def init_database():
    """
    Initialize the database by creating all tables.
    
    Should be called during application startup.
    """
    global engine, async_session_maker
    
    try:
        # Create engine and session maker
        engine = create_database_engine()
        async_session_maker = create_session_maker(engine)
        
        # Create all tables
        async with engine.begin() as conn:
            # Enable foreign key constraints for SQLite
            if "sqlite" in get_settings().database_url:
                await conn.execute(text("PRAGMA foreign_keys=ON"))
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise DatabaseError(
            f"Database initialization failed: {str(e)}",
            operation="init_database"
        )


async def close_database():
    """
    Close the database engine.
    
    Should be called during application shutdown.
    """
    global engine
    
    if engine:
        try:
            await engine.dispose()
            logger.info("Database engine closed")
        except Exception as e:
            logger.error(f"Error closing database engine: {str(e)}")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to provide database session for FastAPI endpoints.
    
    Yields:
        AsyncSession: Database session
    """
    if not async_session_maker:
        raise DatabaseError(
            "Database not initialized. Call init_database() first.",
            operation="get_db_session"
        )
    
    session = async_session_maker()
    try:
        yield session
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(f"Database error in session: {str(e)}")
        raise DatabaseError(
            f"Database operation failed: {str(e)}",
            operation="session_operation"
        )
    except Exception as e:
        await session.rollback()
        logger.error(f"Unexpected error in database session: {str(e)}")
        raise
    finally:
        await session.close()


@asynccontextmanager
async def get_db_session_context():
    """
    Context manager for database sessions outside of FastAPI dependency injection.
    
    Yields:
        AsyncSession: Database session
    """
    if not async_session_maker:
        raise DatabaseError(
            "Database not initialized. Call init_database() first.",
            operation="get_db_session_context"
        )
        
    session = async_session_maker()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Database error in context session: {str(e)}")
        raise
    finally:
        await session.close()


async def health_check() -> bool:
    """
    Perform a database health check.
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    if not async_session_maker:
        logger.error("Database health check failed: async_session_maker is None")
        return False
        
    try:
        async with get_db_session_context() as session:
            # Simple query to test connectivity
            result = await session.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False


async def reset_database():
    """
    Reset the database by dropping and recreating all tables.
    
    WARNING: This will delete ALL data!
    Use only in development/testing environments.
    """
    global engine
    
    if not engine:
        raise DatabaseError(
            "Database not initialized",
            operation="reset_database"
        )
    
    settings = get_settings()
    if settings.is_production:
        raise DatabaseError(
            "Database reset not allowed in production",
            operation="reset_database"
        )
    
    try:
        async with engine.begin() as conn:
            # Drop all tables
            await conn.run_sync(Base.metadata.drop_all)
            # Recreate all tables
            await conn.run_sync(Base.metadata.create_all)
            
            # Enable foreign key constraints for SQLite
            if "sqlite" in settings.database_url:
                await conn.execute(text("PRAGMA foreign_keys=ON"))
        
        logger.warning("Database reset completed - ALL DATA DELETED")
        
    except Exception as e:
        logger.error(f"Database reset failed: {str(e)}")
        raise DatabaseError(
            f"Database reset failed: {str(e)}",
            operation="reset_database"
        )


# Database event listeners will be set up after engine creation
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite connections."""
    if "sqlite" in get_settings().database_url:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA temp_store=memory")
        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB
        cursor.close()


class DatabaseManager:
    """
    Database manager class for handling database operations.
    
    Provides centralized database management with connection pooling,
    health monitoring, and transaction management.
    """
    
    def __init__(self):
        self.engine = None
        self.session_maker = None
        self._health_check_interval = 30  # seconds
        self._health_check_task = None
    
    async def initialize(self):
        """Initialize the database manager."""
        try:
            self.engine = create_database_engine()
            self.session_maker = create_session_maker(self.engine)
            
            # Create tables
            async with self.engine.begin() as conn:
                if "sqlite" in get_settings().database_url:
                    await conn.execute(text("PRAGMA foreign_keys=ON"))
                await conn.run_sync(Base.metadata.create_all)
            
            # Start health check task
            self._health_check_task = asyncio.create_task(
                self._periodic_health_check()
            )
            
            logger.info("Database manager initialized")
            
        except Exception as e:
            logger.error(f"Database manager initialization failed: {str(e)}")
            raise
    
    async def close(self):
        """Close the database manager."""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        
        if self.engine:
            await self.engine.dispose()
            logger.info("Database manager closed")
    
    async def get_session(self) -> AsyncSession:
        """Get a database session."""
        if not self.session_maker:
            raise DatabaseError("Database manager not initialized")
        return self.session_maker()
    
    async def health_check(self) -> bool:
        """Perform a health check."""
        try:
            session = await self.get_session()
            try:
                result = await session.execute(text("SELECT 1"))
                return result.scalar() == 1
            finally:
                await session.close()
        except Exception:
            return False
    
    async def _periodic_health_check(self):
        """Periodic health check task."""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)
                is_healthy = await self.health_check()
                if not is_healthy:
                    logger.warning("Database health check failed")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic health check: {str(e)}")


# Global database manager instance
db_manager = DatabaseManager()


# Convenience functions for backward compatibility
async def init_db():
    """Initialize database (alias for init_database)."""
    await init_database()


async def close_db():
    """Close database (alias for close_database)."""
    await close_database()


# Export main functions and objects
__all__ = [
    "Base",
    "engine",
    "async_session_maker", 
    "init_database",
    "close_database",
    "get_db_session",
    "get_db_session_context",
    "health_check",
    "reset_database",
    "DatabaseManager",
    "db_manager",
] 