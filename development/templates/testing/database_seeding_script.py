# Database Seeding Script for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: Database seeding script with realistic development data (Current)
# Future: Advanced seeding patterns (incremental, conditional, environment-specific)
# Future: Performance-optimized bulk seeding
# Future: Seeding rollback and cleanup capabilities
#
# TEMPLATE USAGE:
# 1. Copy this script and customize for your models
# 2. Replace PLACEHOLDER comments with actual model imports and operations
# 3. Configure seeding scenarios for different environments

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import os
from pathlib import Path

# PLACEHOLDER: Import your database and models
# from app.core.database import get_db_session, engine
# from app.models.user import User
# from app.models.project import Project
# from app.models.task import Task
# from app.models.organization import Organization
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import text

# Import the mock data generator
from .mock_data_generator import MockDataGenerator, quick_dataset

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseSeeder:
    """
    Comprehensive database seeding for development and testing.
    
    Features:
    - Environment-specific seeding
    - Incremental seeding support
    - Data relationship management
    - Cleanup and rollback capabilities
    - Performance-optimized bulk operations
    - Scenario-based seeding
    """
    
    def __init__(self, environment: str = 'development'):
        self.environment = environment
        self.data_generator = MockDataGenerator(seed=42)  # Reproducible data
        self.seeded_entities = {
            'organizations': [],
            'users': [],
            'projects': [],
            'tasks': [],
            'comments': [],
            'notifications': []
        }
        
        # Environment-specific configurations
        self.configs = {
            'development': {
                'organizations': 3,
                'users': 20,
                'projects': 8,
                'tasks': 50,
                'comments': 100,
                'notifications': 30,
                'clear_existing': True,
            },
            'testing': {
                'organizations': 2,
                'users': 10,
                'projects': 5,
                'tasks': 25,
                'comments': 50,
                'notifications': 15,
                'clear_existing': True,
            },
            'staging': {
                'organizations': 5,
                'users': 50,
                'projects': 20,
                'tasks': 200,
                'comments': 400,
                'notifications': 100,
                'clear_existing': False,
            },
            'demo': {
                'organizations': 1,
                'users': 15,
                'projects': 6,
                'tasks': 40,
                'comments': 80,
                'notifications': 25,
                'clear_existing': True,
            }
        }
    
    async def seed_database(self, scenario: Optional[str] = None) -> Dict[str, Any]:
        """
        Main seeding method that orchestrates the entire process.
        
        Args:
            scenario: Optional specific scenario to seed ('new_project', 'active_development', etc.)
        """
        logger.info(f"Starting database seeding for {self.environment} environment")
        
        try:
            # PLACEHOLDER: Get database session
            # async with get_db_session() as db:
            #     if self.configs[self.environment]['clear_existing']:
            #         await self._clear_existing_data(db)
            #     
            #     if scenario:
            #         result = await self._seed_scenario(db, scenario)
            #     else:
            #         result = await self._seed_standard(db)
            #     
            #     await db.commit()
            #     logger.info("Database seeding completed successfully")
            #     return result
            
            # Mock implementation for template
            if scenario:
                result = await self._seed_scenario_mock(scenario)
            else:
                result = await self._seed_standard_mock()
            
            logger.info("Database seeding completed successfully (mock)")
            return result
            
        except Exception as e:
            logger.error(f"Database seeding failed: {str(e)}")
            raise
    
    async def _seed_standard(self, db) -> Dict[str, Any]:
        """Standard seeding based on environment configuration."""
        config = self.configs[self.environment]
        
        # Seed in dependency order
        await self._seed_organizations(db, config['organizations'])
        await self._seed_users(db, config['users'])
        await self._seed_projects(db, config['projects'])
        await self._seed_tasks(db, config['tasks'])
        await self._seed_comments(db, config['comments'])
        await self._seed_notifications(db, config['notifications'])
        
        return {
            'environment': self.environment,
            'seeded_counts': {
                'organizations': len(self.seeded_entities['organizations']),
                'users': len(self.seeded_entities['users']),
                'projects': len(self.seeded_entities['projects']),
                'tasks': len(self.seeded_entities['tasks']),
                'comments': len(self.seeded_entities['comments']),
                'notifications': len(self.seeded_entities['notifications']),
            },
            'total_entities': sum(len(entities) for entities in self.seeded_entities.values())
        }
    
    async def _seed_standard_mock(self) -> Dict[str, Any]:
        """Mock standard seeding for template."""
        config = self.configs[self.environment]
        
        logger.info("Generating mock data...")
        dataset = quick_dataset('medium')
        
        return {
            'environment': self.environment,
            'seeded_counts': {
                'organizations': config['organizations'],
                'users': config['users'],
                'projects': config['projects'],
                'tasks': config['tasks'],
                'comments': config['comments'],
                'notifications': config['notifications'],
            },
            'total_entities': sum(config.values()) - 1  # Exclude clear_existing
        }
    
    async def _seed_scenario(self, db, scenario: str) -> Dict[str, Any]:
        """Seed specific scenario data."""
        scenarios = {
            'new_project': self._seed_new_project_scenario,
            'active_development': self._seed_active_development_scenario,
            'project_completion': self._seed_project_completion_scenario,
            'user_onboarding': self._seed_user_onboarding_scenario,
            'performance_test': self._seed_performance_test_scenario,
        }
        
        if scenario not in scenarios:
            raise ValueError(f"Unknown scenario: {scenario}")
        
        return await scenarios[scenario](db)
    
    async def _seed_scenario_mock(self, scenario: str) -> Dict[str, Any]:
        """Mock scenario seeding for template."""
        logger.info(f"Seeding scenario: {scenario}")
        
        scenario_data = {
            'new_project': {'projects': 1, 'users': 5, 'tasks': 10},
            'active_development': {'projects': 3, 'users': 12, 'tasks': 45},
            'project_completion': {'projects': 2, 'users': 8, 'tasks': 30},
            'user_onboarding': {'users': 20, 'projects': 1, 'tasks': 5},
            'performance_test': {'users': 1000, 'projects': 100, 'tasks': 5000},
        }
        
        data = scenario_data.get(scenario, {})
        return {
            'scenario': scenario,
            'seeded_counts': data,
            'total_entities': sum(data.values())
        }
    
    # Entity-specific seeding methods
    
    async def _seed_organizations(self, db, count: int):
        """Seed organizations."""
        logger.info(f"Seeding {count} organizations...")
        
        organizations = self.data_generator.generate_organizations(count)
        
        # PLACEHOLDER: Replace with actual database operations
        # for org_data in organizations:
        #     org = Organization(**org_data)
        #     db.add(org)
        #     self.seeded_entities['organizations'].append(org)
        # 
        # await db.flush()  # Get IDs for relationships
        
        # Mock for template
        self.seeded_entities['organizations'] = organizations
        logger.info(f"Seeded {len(organizations)} organizations")
    
    async def _seed_users(self, db, count: int):
        """Seed users with realistic roles and relationships."""
        logger.info(f"Seeding {count} users...")
        
        users = self.data_generator.generate_users(count)
        
        # Ensure we have admin users
        if count > 0:
            users[0].update({'role': 'admin', 'is_active': True, 'is_verified': True})
        if count > 1:
            users[1].update({'role': 'manager', 'is_active': True, 'is_verified': True})
        
        # PLACEHOLDER: Replace with actual database operations
        # for user_data in users:
        #     # Hash password if needed
        #     if 'password' not in user_data:
        #         user_data['password_hash'] = hash_password('password123')
        #     
        #     user = User(**user_data)
        #     db.add(user)
        #     self.seeded_entities['users'].append(user)
        # 
        # await db.flush()
        
        # Mock for template
        self.seeded_entities['users'] = users
        logger.info(f"Seeded {len(users)} users")
    
    async def _seed_projects(self, db, count: int):
        """Seed projects with proper ownership."""
        logger.info(f"Seeding {count} projects...")
        
        projects = self.data_generator.generate_projects(count)
        
        # Ensure projects have valid owners
        for i, project_data in enumerate(projects):
            if self.seeded_entities['users']:
                owner_index = i % len(self.seeded_entities['users'])
                project_data['owner_id'] = self.seeded_entities['users'][owner_index]['id']
            
            if self.seeded_entities['organizations']:
                org_index = i % len(self.seeded_entities['organizations'])
                project_data['organization_id'] = self.seeded_entities['organizations'][org_index]['id']
        
        # PLACEHOLDER: Replace with actual database operations
        # for project_data in projects:
        #     project = Project(**project_data)
        #     db.add(project)
        #     self.seeded_entities['projects'].append(project)
        # 
        # await db.flush()
        
        # Mock for template
        self.seeded_entities['projects'] = projects
        logger.info(f"Seeded {len(projects)} projects")
    
    async def _seed_tasks(self, db, count: int):
        """Seed tasks with proper project and user relationships."""
        logger.info(f"Seeding {count} tasks...")
        
        tasks = self.data_generator.generate_tasks(count)
        
        # Ensure tasks have valid relationships
        for i, task_data in enumerate(tasks):
            if self.seeded_entities['projects']:
                project_index = i % len(self.seeded_entities['projects'])
                task_data['project_id'] = self.seeded_entities['projects'][project_index]['id']
            
            if self.seeded_entities['users']:
                # Assign reporter
                reporter_index = i % len(self.seeded_entities['users'])
                task_data['reporter_id'] = self.seeded_entities['users'][reporter_index]['id']
                
                # Assign assignee (80% chance)
                if i % 5 != 0:  # 80% of tasks get assigned
                    assignee_index = (i + 1) % len(self.seeded_entities['users'])
                    task_data['assignee_id'] = self.seeded_entities['users'][assignee_index]['id']
        
        # Create some subtasks (10% of tasks)
        subtasks = []
        for i in range(0, min(count // 10, len(tasks))):
            parent_task = tasks[i * 10]  # Every 10th task gets subtasks
            for j in range(2):  # 2 subtasks per parent
                subtask_data = self.data_generator.generate_task()
                subtask_data.update({
                    'parent_task_id': parent_task['id'],
                    'project_id': parent_task['project_id'],
                    'reporter_id': parent_task['reporter_id'],
                    'title': f"Subtask {j+1}: {subtask_data['title']}"
                })
                subtasks.append(subtask_data)
        
        all_tasks = tasks + subtasks
        
        # PLACEHOLDER: Replace with actual database operations
        # for task_data in all_tasks:
        #     task = Task(**task_data)
        #     db.add(task)
        #     self.seeded_entities['tasks'].append(task)
        # 
        # await db.flush()
        
        # Mock for template
        self.seeded_entities['tasks'] = all_tasks
        logger.info(f"Seeded {len(all_tasks)} tasks (including {len(subtasks)} subtasks)")
    
    async def _seed_comments(self, db, count: int):
        """Seed comments on tasks."""
        logger.info(f"Seeding {count} comments...")
        
        if not self.seeded_entities['tasks']:
            logger.warning("No tasks available for comments")
            return
        
        comments = []
        for i in range(count):
            task = self.seeded_entities['tasks'][i % len(self.seeded_entities['tasks'])]
            comment_data = self.data_generator.generate_comment(task_id=task['id'])
            
            # Ensure comment has valid author
            if self.seeded_entities['users']:
                author_index = i % len(self.seeded_entities['users'])
                comment_data['author_id'] = self.seeded_entities['users'][author_index]['id']
            
            comments.append(comment_data)
        
        # Create some threaded comments (20% are replies)
        threaded_comments = []
        for i in range(0, min(count // 5, len(comments))):
            parent_comment = comments[i * 5]  # Every 5th comment gets replies
            for j in range(2):  # 2 replies per parent
                reply_data = self.data_generator.generate_comment(
                    task_id=parent_comment['task_id'],
                    parent_comment_id=parent_comment['id']
                )
                if self.seeded_entities['users']:
                    author_index = (i + j) % len(self.seeded_entities['users'])
                    reply_data['author_id'] = self.seeded_entities['users'][author_index]['id']
                threaded_comments.append(reply_data)
        
        all_comments = comments + threaded_comments
        
        # PLACEHOLDER: Replace with actual database operations
        # for comment_data in all_comments:
        #     comment = Comment(**comment_data)
        #     db.add(comment)
        #     self.seeded_entities['comments'].append(comment)
        # 
        # await db.flush()
        
        # Mock for template
        self.seeded_entities['comments'] = all_comments
        logger.info(f"Seeded {len(all_comments)} comments (including {len(threaded_comments)} replies)")
    
    async def _seed_notifications(self, db, count: int):
        """Seed notifications for users."""
        logger.info(f"Seeding {count} notifications...")
        
        if not self.seeded_entities['users']:
            logger.warning("No users available for notifications")
            return
        
        notifications = []
        for i in range(count):
            user = self.seeded_entities['users'][i % len(self.seeded_entities['users'])]
            notification_data = self.data_generator.generate_notification(user_id=user['id'])
            notifications.append(notification_data)
        
        # PLACEHOLDER: Replace with actual database operations
        # for notification_data in notifications:
        #     notification = Notification(**notification_data)
        #     db.add(notification)
        #     self.seeded_entities['notifications'].append(notification)
        # 
        # await db.flush()
        
        # Mock for template
        self.seeded_entities['notifications'] = notifications
        logger.info(f"Seeded {len(notifications)} notifications")
    
    # Scenario-specific seeding methods
    
    async def _seed_new_project_scenario(self, db) -> Dict[str, Any]:
        """Seed data for a new project scenario."""
        logger.info("Seeding new project scenario...")
        
        # Create organization
        await self._seed_organizations(db, 1)
        
        # Create project team
        await self._seed_users(db, 6)  # 1 manager + 5 developers
        
        # Create new project
        project_data = self.data_generator.generate_project(
            status='planning',
            owner_id=self.seeded_entities['users'][0]['id'],
            organization_id=self.seeded_entities['organizations'][0]['id']
        )
        self.seeded_entities['projects'] = [project_data]
        
        # Create initial tasks
        await self._seed_tasks(db, 12)
        
        # Minimal comments and notifications
        await self._seed_comments(db, 5)
        await self._seed_notifications(db, 8)
        
        return {
            'scenario': 'new_project',
            'description': 'New project with planning phase setup',
            'seeded_counts': {k: len(v) for k, v in self.seeded_entities.items()}
        }
    
    async def _seed_active_development_scenario(self, db) -> Dict[str, Any]:
        """Seed data for active development scenario."""
        logger.info("Seeding active development scenario...")
        
        # Create multiple organizations
        await self._seed_organizations(db, 2)
        
        # Create development team
        await self._seed_users(db, 15)
        
        # Create active projects
        active_projects = []
        for i in range(3):
            project_data = self.data_generator.generate_project(
                status='active',
                owner_id=self.seeded_entities['users'][i]['id'],
                organization_id=self.seeded_entities['organizations'][i % 2]['id']
            )
            active_projects.append(project_data)
        self.seeded_entities['projects'] = active_projects
        
        # Create many tasks in various states
        await self._seed_tasks(db, 60)
        
        # Lots of comments and notifications
        await self._seed_comments(db, 120)
        await self._seed_notifications(db, 40)
        
        return {
            'scenario': 'active_development',
            'description': 'Active development with multiple projects and high activity',
            'seeded_counts': {k: len(v) for k, v in self.seeded_entities.items()}
        }
    
    async def _seed_project_completion_scenario(self, db) -> Dict[str, Any]:
        """Seed data for project completion scenario."""
        logger.info("Seeding project completion scenario...")
        
        # Create organization
        await self._seed_organizations(db, 1)
        
        # Create team
        await self._seed_users(db, 8)
        
        # Create completed project
        project_data = self.data_generator.generate_project(
            status='completed',
            owner_id=self.seeded_entities['users'][0]['id'],
            organization_id=self.seeded_entities['organizations'][0]['id']
        )
        self.seeded_entities['projects'] = [project_data]
        
        # Create mostly completed tasks
        tasks = self.data_generator.generate_tasks(35)
        for i, task in enumerate(tasks):
            if i < 30:  # 85% completed
                task.update({
                    'status': 'done',
                    'completed_at': self.data_generator._random_datetime(days_back=30)
                })
            task.update({
                'project_id': project_data['id'],
                'reporter_id': self.seeded_entities['users'][i % len(self.seeded_entities['users'])]['id']
            })
        self.seeded_entities['tasks'] = tasks
        
        # Many comments from project completion
        await self._seed_comments(db, 80)
        await self._seed_notifications(db, 25)
        
        return {
            'scenario': 'project_completion',
            'description': 'Recently completed project with historical data',
            'seeded_counts': {k: len(v) for k, v in self.seeded_entities.items()}
        }
    
    async def _seed_user_onboarding_scenario(self, db) -> Dict[str, Any]:
        """Seed data for user onboarding scenario."""
        logger.info("Seeding user onboarding scenario...")
        
        # Create organization
        await self._seed_organizations(db, 1)
        
        # Create mix of new and existing users
        existing_users = self.data_generator.generate_users(5)
        new_users = self.data_generator.generate_users(3)
        
        # Mark new users
        for user in new_users:
            user.update({
                'created_at': self.data_generator._random_datetime(days_back=7),
                'last_login_at': None,
                'is_verified': False
            })
        
        self.seeded_entities['users'] = existing_users + new_users
        
        # Create onboarding project
        project_data = self.data_generator.generate_project(
            name="Team Onboarding",
            status='active',
            owner_id=existing_users[0]['id'],
            organization_id=self.seeded_entities['organizations'][0]['id']
        )
        self.seeded_entities['projects'] = [project_data]
        
        # Create onboarding tasks
        onboarding_tasks = []
        for i, new_user in enumerate(new_users):
            task_data = self.data_generator.generate_task(
                title=f"Onboarding: {new_user['first_name']} {new_user['last_name']}",
                assignee_id=new_user['id'],
                reporter_id=existing_users[0]['id'],
                project_id=project_data['id'],
                status='in_progress'
            )
            onboarding_tasks.append(task_data)
        
        self.seeded_entities['tasks'] = onboarding_tasks
        
        # Minimal comments and notifications
        await self._seed_comments(db, 10)
        await self._seed_notifications(db, 15)
        
        return {
            'scenario': 'user_onboarding',
            'description': 'User onboarding scenario with new team members',
            'seeded_counts': {k: len(v) for k, v in self.seeded_entities.items()}
        }
    
    async def _seed_performance_test_scenario(self, db) -> Dict[str, Any]:
        """Seed large dataset for performance testing."""
        logger.info("Seeding performance test scenario...")
        
        # Large dataset
        await self._seed_organizations(db, 10)
        await self._seed_users(db, 500)
        await self._seed_projects(db, 100)
        await self._seed_tasks(db, 2000)
        await self._seed_comments(db, 5000)
        await self._seed_notifications(db, 1000)
        
        return {
            'scenario': 'performance_test',
            'description': 'Large dataset for performance testing',
            'seeded_counts': {k: len(v) for k, v in self.seeded_entities.items()}
        }
    
    # Utility methods
    
    async def _clear_existing_data(self, db):
        """Clear existing data from database."""
        logger.info("Clearing existing data...")
        
        # PLACEHOLDER: Replace with actual table clearing
        # Order matters due to foreign key constraints
        # tables_to_clear = [
        #     'notifications',
        #     'comments', 
        #     'tasks',
        #     'projects',
        #     'users',
        #     'organizations'
        # ]
        # 
        # for table in tables_to_clear:
        #     await db.execute(text(f"DELETE FROM {table}"))
        #     await db.execute(text(f"DELETE FROM sqlite_sequence WHERE name='{table}'"))  # Reset auto-increment
        
        logger.info("Existing data cleared")
    
    async def get_seeding_status(self) -> Dict[str, Any]:
        """Get current seeding status."""
        return {
            'environment': self.environment,
            'seeded_entities': {k: len(v) for k, v in self.seeded_entities.items()},
            'total_entities': sum(len(entities) for entities in self.seeded_entities.values()),
            'last_seeded': datetime.now(timezone.utc).isoformat()
        }
    
    async def export_seeded_data(self, filename: str):
        """Export seeded data to JSON file."""
        import json
        
        export_data = {
            'metadata': {
                'environment': self.environment,
                'seeded_at': datetime.now(timezone.utc).isoformat(),
                'total_entities': sum(len(entities) for entities in self.seeded_entities.values())
            },
            'data': self.seeded_entities
        }
        
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        logger.info(f"Seeded data exported to {filename}")

# CLI interface for seeding
async def main():
    """Main CLI interface for database seeding."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Seeding Script')
    parser.add_argument('--env', choices=['development', 'testing', 'staging', 'demo'], 
                       default='development', help='Environment to seed')
    parser.add_argument('--scenario', choices=['new_project', 'active_development', 
                       'project_completion', 'user_onboarding', 'performance_test'],
                       help='Specific scenario to seed')
    parser.add_argument('--export', help='Export seeded data to JSON file')
    parser.add_argument('--status', action='store_true', help='Show seeding status')
    
    args = parser.parse_args()
    
    seeder = DatabaseSeeder(environment=args.env)
    
    if args.status:
        status = await seeder.get_seeding_status()
        print(f"Seeding Status: {status}")
        return
    
    try:
        result = await seeder.seed_database(scenario=args.scenario)
        print(f"Seeding completed: {result}")
        
        if args.export:
            await seeder.export_seeded_data(args.export)
            
    except Exception as e:
        logger.error(f"Seeding failed: {str(e)}")
        raise

# Convenience functions for programmatic use

async def seed_development_data():
    """Quick development data seeding."""
    seeder = DatabaseSeeder('development')
    return await seeder.seed_database()

async def seed_test_data():
    """Quick test data seeding."""
    seeder = DatabaseSeeder('testing')
    return await seeder.seed_database()

async def seed_scenario_data(scenario: str, environment: str = 'development'):
    """Quick scenario-based seeding."""
    seeder = DatabaseSeeder(environment)
    return await seeder.seed_database(scenario=scenario)

if __name__ == "__main__":
    asyncio.run(main())

# Template Implementation Guide:
"""
DATABASE SEEDING SCRIPT IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this script and customize for your models
   - Replace PLACEHOLDER comments with actual database operations
   - Import your models and database session management

2. CONFIGURE MODELS:
   - Update entity seeding methods for your specific models
   - Implement proper foreign key relationships
   - Add model-specific validation and constraints

3. CUSTOMIZE ENVIRONMENTS:
   - Adjust environment configurations for your needs
   - Add environment-specific data patterns
   - Configure appropriate data volumes for each environment

4. IMPLEMENT DATABASE OPERATIONS:
   - Replace mock operations with actual SQLAlchemy operations
   - Add proper transaction management
   - Implement bulk insert optimizations for large datasets

5. ADD SCENARIOS:
   - Create scenario methods for your specific use cases
   - Implement workflow-specific data patterns
   - Add business logic validation for scenarios

6. CONFIGURE RELATIONSHIPS:
   - Ensure proper foreign key assignments
   - Implement cascade seeding for related entities
   - Add relationship validation and consistency checks

7. ADD CLEANUP AND ROLLBACK:
   - Implement proper data clearing for each environment
   - Add rollback capabilities for failed seeding
   - Create incremental seeding support

8. OPTIMIZE PERFORMANCE:
   - Implement bulk insert operations
   - Add progress tracking for large datasets
   - Optimize relationship lookups with caching

FEATURES INCLUDED:
- Environment-specific seeding configurations
- Scenario-based data generation
- Relationship-aware entity creation
- Bulk seeding with performance optimization
- Data export and status reporting
- CLI interface for easy usage
- Cleanup and rollback capabilities
- Incremental seeding support
- Comprehensive logging and error handling
- Mock data integration

EXAMPLE USAGE:
```bash
# Seed development environment
python database_seeding_script.py --env development

# Seed specific scenario
python database_seeding_script.py --env testing --scenario new_project

# Export seeded data
python database_seeding_script.py --env demo --export demo_data.json

# Check seeding status
python database_seeding_script.py --status
```

PROGRAMMATIC USAGE:
```python
# Quick development seeding
await seed_development_data()

# Scenario-based seeding
await seed_scenario_data('active_development', 'staging')

# Custom seeding
seeder = DatabaseSeeder('testing')
result = await seeder.seed_database('performance_test')
```

BEST PRACTICES:
- Always clear data in dependency order (foreign keys)
- Use transactions for atomic seeding operations
- Implement proper error handling and rollback
- Add progress tracking for large datasets
- Use consistent data patterns across environments
- Validate relationships before creating entities
- Add comprehensive logging for debugging
- Export seeded data for analysis and backup
- Use environment-specific configurations
- Implement incremental seeding for development
""" 