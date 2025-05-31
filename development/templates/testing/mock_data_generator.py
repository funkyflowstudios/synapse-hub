# Mock Data Generator for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: Mock data generator with realistic test data patterns (Current)
# Future: Advanced data generation (relationships, constraints, edge cases)
# Future: Performance testing data generation
# Future: Localized and internationalized test data
#
# TEMPLATE USAGE:
# 1. Copy this file and customize for your models
# 2. Replace PLACEHOLDER comments with actual model fields
# 3. Add domain-specific data generation patterns

import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union, Callable
from enum import Enum
from faker import Faker
import json

# PLACEHOLDER: Import your models and enums
# from app.models.task import TaskStatus, TaskPriority
# from app.models.user import UserRole
# from app.models.project import ProjectStatus

# Configure Faker
fake = Faker()
Faker.seed(42)  # For reproducible test data

# PLACEHOLDER: Define your enums for consistent data generation
class MockTaskStatus(str, Enum):
    """Mock task status enum."""
    DRAFT = "draft"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    CANCELLED = "cancelled"

class MockTaskPriority(str, Enum):
    """Mock task priority enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class MockUserRole(str, Enum):
    """Mock user role enum."""
    ADMIN = "admin"
    MANAGER = "manager"
    DEVELOPER = "developer"
    VIEWER = "viewer"

class MockProjectStatus(str, Enum):
    """Mock project status enum."""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MockDataGenerator:
    """
    Comprehensive mock data generator for testing.
    
    Features:
    - Realistic data generation with Faker
    - Relationship-aware data creation
    - Configurable data patterns
    - Edge case generation
    - Bulk data creation
    - Consistent data across related entities
    """
    
    def __init__(self, seed: Optional[int] = None):
        if seed:
            Faker.seed(seed)
            random.seed(seed)
        
        self.fake = Faker()
        
        # Cache for consistent relationships
        self._user_cache: List[Dict[str, Any]] = []
        self._project_cache: List[Dict[str, Any]] = []
        self._organization_cache: List[Dict[str, Any]] = []
        
        # Data generation patterns
        self.patterns = {
            'realistic': self._realistic_pattern,
            'edge_cases': self._edge_cases_pattern,
            'performance': self._performance_pattern,
            'minimal': self._minimal_pattern,
        }
    
    # Core Data Generators
    
    def generate_user(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic user."""
        user_data = {
            'id': str(uuid.uuid4()),
            'username': self.fake.user_name(),
            'email': self.fake.email(),
            'first_name': self.fake.first_name(),
            'last_name': self.fake.last_name(),
            'role': random.choice(list(MockUserRole)),
            'is_active': random.choice([True, True, True, False]),  # 75% active
            'is_verified': random.choice([True, True, False]),  # 66% verified
            'avatar_url': self.fake.image_url(width=200, height=200),
            'bio': self.fake.text(max_nb_chars=200) if random.random() > 0.3 else None,
            'location': self.fake.city() if random.random() > 0.4 else None,
            'timezone': random.choice([
                'UTC', 'America/New_York', 'Europe/London', 
                'Asia/Tokyo', 'Australia/Sydney'
            ]),
            'preferences': {
                'theme': random.choice(['light', 'dark', 'auto']),
                'notifications': {
                    'email': random.choice([True, False]),
                    'push': random.choice([True, False]),
                    'mentions': True,
                },
                'language': random.choice(['en', 'es', 'fr', 'de', 'ja']),
            },
            'last_login_at': self._random_datetime(days_back=30),
            'created_at': self._random_datetime(days_back=365),
            'updated_at': self._random_datetime(days_back=7),
        }
        
        # Apply overrides
        user_data.update(overrides)
        return user_data
    
    def generate_project(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic project."""
        start_date = self._random_datetime(days_back=180)
        
        project_data = {
            'id': str(uuid.uuid4()),
            'name': self.fake.catch_phrase(),
            'description': self.fake.text(max_nb_chars=500),
            'status': random.choice(list(MockProjectStatus)),
            'priority': random.choice(list(MockTaskPriority)),
            'owner_id': self._get_random_user_id(),
            'organization_id': self._get_random_organization_id(),
            'start_date': start_date,
            'end_date': start_date + timedelta(days=random.randint(30, 365)),
            'budget': random.randint(10000, 1000000) if random.random() > 0.3 else None,
            'tags': random.sample([
                'web', 'mobile', 'api', 'frontend', 'backend', 
                'database', 'ai', 'ml', 'devops', 'security'
            ], k=random.randint(1, 4)),
            'metadata': {
                'methodology': random.choice(['agile', 'waterfall', 'kanban']),
                'team_size': random.randint(2, 20),
                'complexity': random.choice(['low', 'medium', 'high']),
            },
            'settings': {
                'public': random.choice([True, False]),
                'allow_external_collaborators': random.choice([True, False]),
                'auto_archive': random.choice([True, False]),
            },
            'created_at': self._random_datetime(days_back=365),
            'updated_at': self._random_datetime(days_back=7),
        }
        
        # Apply overrides
        project_data.update(overrides)
        return project_data
    
    def generate_task(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic task."""
        created_at = self._random_datetime(days_back=90)
        
        task_data = {
            'id': str(uuid.uuid4()),
            'title': self.fake.sentence(nb_words=6).rstrip('.'),
            'description': self.fake.text(max_nb_chars=1000) if random.random() > 0.2 else None,
            'status': random.choice(list(MockTaskStatus)),
            'priority': random.choice(list(MockTaskPriority)),
            'project_id': self._get_random_project_id(),
            'assignee_id': self._get_random_user_id() if random.random() > 0.2 else None,
            'reporter_id': self._get_random_user_id(),
            'parent_task_id': None,  # Can be set for subtasks
            'estimated_hours': random.randint(1, 40) if random.random() > 0.4 else None,
            'actual_hours': random.randint(1, 50) if random.random() > 0.6 else None,
            'due_date': created_at + timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None,
            'completed_at': self._random_datetime(days_back=30) if random.random() > 0.7 else None,
            'tags': random.sample([
                'bug', 'feature', 'enhancement', 'documentation', 
                'testing', 'refactoring', 'performance', 'security'
            ], k=random.randint(0, 3)),
            'labels': {
                'difficulty': random.choice(['easy', 'medium', 'hard']),
                'type': random.choice(['feature', 'bug', 'task', 'epic']),
                'component': random.choice(['frontend', 'backend', 'database', 'api']),
            },
            'checklist': self._generate_checklist() if random.random() > 0.6 else [],
            'attachments': self._generate_attachments() if random.random() > 0.8 else [],
            'created_at': created_at,
            'updated_at': self._random_datetime(days_back=7),
        }
        
        # Apply overrides
        task_data.update(overrides)
        return task_data
    
    def generate_organization(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic organization."""
        org_data = {
            'id': str(uuid.uuid4()),
            'name': self.fake.company(),
            'slug': self.fake.slug(),
            'description': self.fake.text(max_nb_chars=300),
            'website': self.fake.url() if random.random() > 0.3 else None,
            'logo_url': self.fake.image_url(width=100, height=100),
            'industry': random.choice([
                'Technology', 'Healthcare', 'Finance', 'Education', 
                'Retail', 'Manufacturing', 'Consulting', 'Media'
            ]),
            'size': random.choice(['startup', 'small', 'medium', 'large', 'enterprise']),
            'location': {
                'country': self.fake.country(),
                'city': self.fake.city(),
                'address': self.fake.address(),
            },
            'settings': {
                'public_profile': random.choice([True, False]),
                'allow_public_projects': random.choice([True, False]),
                'require_2fa': random.choice([True, False]),
            },
            'subscription': {
                'plan': random.choice(['free', 'pro', 'enterprise']),
                'status': random.choice(['active', 'trial', 'expired']),
                'expires_at': self._random_datetime(days_forward=365),
            },
            'created_at': self._random_datetime(days_back=730),
            'updated_at': self._random_datetime(days_back=30),
        }
        
        # Apply overrides
        org_data.update(overrides)
        return org_data
    
    # PLACEHOLDER: Add your domain-specific generators
    
    def generate_comment(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic comment."""
        comment_data = {
            'id': str(uuid.uuid4()),
            'content': self.fake.text(max_nb_chars=500),
            'author_id': self._get_random_user_id(),
            'task_id': None,  # Should be provided in overrides
            'parent_comment_id': None,  # For threaded comments
            'is_edited': random.choice([True, False]),
            'edited_at': self._random_datetime(days_back=7) if random.random() > 0.8 else None,
            'reactions': self._generate_reactions() if random.random() > 0.7 else {},
            'created_at': self._random_datetime(days_back=30),
            'updated_at': self._random_datetime(days_back=7),
        }
        
        comment_data.update(overrides)
        return comment_data
    
    def generate_notification(self, **overrides) -> Dict[str, Any]:
        """Generate a realistic notification."""
        notification_data = {
            'id': str(uuid.uuid4()),
            'user_id': self._get_random_user_id(),
            'type': random.choice([
                'task_assigned', 'task_completed', 'comment_added',
                'project_updated', 'mention', 'deadline_approaching'
            ]),
            'title': self.fake.sentence(nb_words=4),
            'message': self.fake.text(max_nb_chars=200),
            'data': {
                'entity_type': random.choice(['task', 'project', 'comment']),
                'entity_id': str(uuid.uuid4()),
                'action': random.choice(['created', 'updated', 'deleted', 'assigned']),
            },
            'is_read': random.choice([True, False]),
            'read_at': self._random_datetime(days_back=7) if random.random() > 0.5 else None,
            'created_at': self._random_datetime(days_back=14),
        }
        
        notification_data.update(overrides)
        return notification_data
    
    # Bulk Generation Methods
    
    def generate_users(self, count: int, pattern: str = 'realistic') -> List[Dict[str, Any]]:
        """Generate multiple users."""
        users = []
        pattern_func = self.patterns.get(pattern, self._realistic_pattern)
        
        for i in range(count):
            user = self.generate_user(**pattern_func('user', i, count))
            users.append(user)
            self._user_cache.append(user)
        
        return users
    
    def generate_projects(self, count: int, pattern: str = 'realistic') -> List[Dict[str, Any]]:
        """Generate multiple projects."""
        projects = []
        pattern_func = self.patterns.get(pattern, self._realistic_pattern)
        
        for i in range(count):
            project = self.generate_project(**pattern_func('project', i, count))
            projects.append(project)
            self._project_cache.append(project)
        
        return projects
    
    def generate_tasks(self, count: int, pattern: str = 'realistic') -> List[Dict[str, Any]]:
        """Generate multiple tasks."""
        tasks = []
        pattern_func = self.patterns.get(pattern, self._realistic_pattern)
        
        for i in range(count):
            task = self.generate_task(**pattern_func('task', i, count))
            tasks.append(task)
        
        return tasks
    
    def generate_organizations(self, count: int, pattern: str = 'realistic') -> List[Dict[str, Any]]:
        """Generate multiple organizations."""
        organizations = []
        pattern_func = self.patterns.get(pattern, self._realistic_pattern)
        
        for i in range(count):
            org = self.generate_organization(**pattern_func('organization', i, count))
            organizations.append(org)
            self._organization_cache.append(org)
        
        return organizations
    
    # Complete Dataset Generation
    
    def generate_complete_dataset(
        self,
        users: int = 50,
        organizations: int = 5,
        projects: int = 20,
        tasks: int = 200,
        comments: int = 500,
        notifications: int = 100,
        pattern: str = 'realistic'
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Generate a complete dataset with relationships."""
        
        # Generate base entities first
        dataset = {
            'organizations': self.generate_organizations(organizations, pattern),
            'users': self.generate_users(users, pattern),
            'projects': self.generate_projects(projects, pattern),
            'tasks': self.generate_tasks(tasks, pattern),
            'comments': [],
            'notifications': [],
        }
        
        # Generate comments for tasks
        for _ in range(comments):
            task_id = random.choice(dataset['tasks'])['id']
            comment = self.generate_comment(task_id=task_id)
            dataset['comments'].append(comment)
        
        # Generate notifications for users
        for _ in range(notifications):
            notification = self.generate_notification()
            dataset['notifications'].append(notification)
        
        return dataset
    
    # Helper Methods
    
    def _random_datetime(self, days_back: int = 0, days_forward: int = 0) -> datetime:
        """Generate a random datetime within the specified range."""
        if days_back > 0:
            start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            end_date = datetime.now(timezone.utc)
        elif days_forward > 0:
            start_date = datetime.now(timezone.utc)
            end_date = datetime.now(timezone.utc) + timedelta(days=days_forward)
        else:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            end_date = datetime.now(timezone.utc)
        
        time_between = end_date - start_date
        random_seconds = random.randint(0, int(time_between.total_seconds()))
        return start_date + timedelta(seconds=random_seconds)
    
    def _get_random_user_id(self) -> str:
        """Get a random user ID from cache or generate one."""
        if self._user_cache:
            return random.choice(self._user_cache)['id']
        return str(uuid.uuid4())
    
    def _get_random_project_id(self) -> str:
        """Get a random project ID from cache or generate one."""
        if self._project_cache:
            return random.choice(self._project_cache)['id']
        return str(uuid.uuid4())
    
    def _get_random_organization_id(self) -> str:
        """Get a random organization ID from cache or generate one."""
        if self._organization_cache:
            return random.choice(self._organization_cache)['id']
        return str(uuid.uuid4())
    
    def _generate_checklist(self) -> List[Dict[str, Any]]:
        """Generate a task checklist."""
        items = []
        for _ in range(random.randint(2, 8)):
            items.append({
                'id': str(uuid.uuid4()),
                'text': self.fake.sentence(nb_words=4),
                'completed': random.choice([True, False]),
                'completed_at': self._random_datetime(days_back=7) if random.random() > 0.5 else None,
            })
        return items
    
    def _generate_attachments(self) -> List[Dict[str, Any]]:
        """Generate task attachments."""
        attachments = []
        for _ in range(random.randint(1, 3)):
            attachments.append({
                'id': str(uuid.uuid4()),
                'filename': self.fake.file_name(),
                'size': random.randint(1024, 10485760),  # 1KB to 10MB
                'mime_type': random.choice([
                    'image/jpeg', 'image/png', 'application/pdf',
                    'text/plain', 'application/zip'
                ]),
                'url': self.fake.url(),
                'uploaded_by': self._get_random_user_id(),
                'uploaded_at': self._random_datetime(days_back=30),
            })
        return attachments
    
    def _generate_reactions(self) -> Dict[str, List[str]]:
        """Generate comment reactions."""
        reactions = {}
        reaction_types = ['👍', '👎', '❤️', '😄', '😮', '😢', '😡']
        
        for reaction in random.sample(reaction_types, k=random.randint(1, 3)):
            user_count = random.randint(1, 5)
            reactions[reaction] = [self._get_random_user_id() for _ in range(user_count)]
        
        return reactions
    
    # Data Patterns
    
    def _realistic_pattern(self, entity_type: str, index: int, total: int) -> Dict[str, Any]:
        """Realistic data pattern with normal distributions."""
        patterns = {
            'user': {
                'is_active': True if index < total * 0.9 else False,
                'role': MockUserRole.DEVELOPER if index < total * 0.6 else random.choice(list(MockUserRole)),
            },
            'project': {
                'status': MockProjectStatus.ACTIVE if index < total * 0.7 else random.choice(list(MockProjectStatus)),
            },
            'task': {
                'status': MockTaskStatus.TODO if index < total * 0.4 else random.choice(list(MockTaskStatus)),
                'priority': MockTaskPriority.MEDIUM if index < total * 0.5 else random.choice(list(MockTaskPriority)),
            },
        }
        return patterns.get(entity_type, {})
    
    def _edge_cases_pattern(self, entity_type: str, index: int, total: int) -> Dict[str, Any]:
        """Edge cases pattern for testing boundary conditions."""
        patterns = {
            'user': {
                'username': 'a' if index == 0 else 'a' * 255 if index == 1 else None,
                'email': 'test@example.com' if index == 0 else None,
                'first_name': '' if index == 0 else 'A' * 100 if index == 1 else None,
            },
            'task': {
                'title': 'A' if index == 0 else 'A' * 500 if index == 1 else None,
                'estimated_hours': 0 if index == 0 else 10000 if index == 1 else None,
            },
        }
        return patterns.get(entity_type, {})
    
    def _performance_pattern(self, entity_type: str, index: int, total: int) -> Dict[str, Any]:
        """Performance testing pattern with minimal data."""
        return {
            'description': None,
            'bio': None,
            'metadata': {},
            'preferences': {},
        }
    
    def _minimal_pattern(self, entity_type: str, index: int, total: int) -> Dict[str, Any]:
        """Minimal data pattern with only required fields."""
        return {}
    
    # Export Methods
    
    def export_to_json(self, data: Dict[str, Any], filename: str):
        """Export generated data to JSON file."""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def export_to_sql_inserts(self, data: Dict[str, Any], filename: str):
        """Export generated data as SQL INSERT statements."""
        # PLACEHOLDER: Implement SQL export based on your schema
        with open(filename, 'w') as f:
            f.write("-- Generated SQL INSERT statements\n")
            f.write("-- PLACEHOLDER: Implement based on your database schema\n")
    
    # Scenario Generators
    
    def generate_scenario_new_project(self) -> Dict[str, Any]:
        """Generate data for a new project scenario."""
        return {
            'organization': self.generate_organization(),
            'project_owner': self.generate_user(role=MockUserRole.MANAGER),
            'team_members': self.generate_users(5, pattern='realistic'),
            'project': self.generate_project(status=MockProjectStatus.PLANNING),
            'initial_tasks': self.generate_tasks(10, pattern='realistic'),
        }
    
    def generate_scenario_active_development(self) -> Dict[str, Any]:
        """Generate data for active development scenario."""
        return {
            'project': self.generate_project(status=MockProjectStatus.ACTIVE),
            'developers': self.generate_users(8, pattern='realistic'),
            'active_tasks': self.generate_tasks(25, pattern='realistic'),
            'completed_tasks': self.generate_tasks(15, pattern='realistic'),
            'comments': [self.generate_comment() for _ in range(50)],
        }
    
    def generate_scenario_project_completion(self) -> Dict[str, Any]:
        """Generate data for project completion scenario."""
        return {
            'project': self.generate_project(status=MockProjectStatus.COMPLETED),
            'all_tasks_completed': self.generate_tasks(30, pattern='realistic'),
            'final_comments': [self.generate_comment() for _ in range(20)],
            'completion_notifications': [self.generate_notification() for _ in range(10)],
        }

# Convenience functions for quick data generation

def quick_user(count: int = 1, **overrides) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Quick user generation."""
    generator = MockDataGenerator()
    if count == 1:
        return generator.generate_user(**overrides)
    return generator.generate_users(count)

def quick_project(count: int = 1, **overrides) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Quick project generation."""
    generator = MockDataGenerator()
    if count == 1:
        return generator.generate_project(**overrides)
    return generator.generate_projects(count)

def quick_task(count: int = 1, **overrides) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Quick task generation."""
    generator = MockDataGenerator()
    if count == 1:
        return generator.generate_task(**overrides)
    return generator.generate_tasks(count)

def quick_dataset(size: str = 'small') -> Dict[str, List[Dict[str, Any]]]:
    """Quick dataset generation."""
    generator = MockDataGenerator()
    
    sizes = {
        'small': {'users': 10, 'projects': 3, 'tasks': 30, 'comments': 50},
        'medium': {'users': 50, 'projects': 10, 'tasks': 200, 'comments': 300},
        'large': {'users': 200, 'projects': 50, 'tasks': 1000, 'comments': 2000},
    }
    
    config = sizes.get(size, sizes['small'])
    return generator.generate_complete_dataset(**config)

# Template Implementation Guide:
"""
MOCK DATA GENERATOR IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this template and customize for your domain
   - Replace PLACEHOLDER comments with actual model references
   - Update enum definitions to match your models

2. CUSTOMIZE GENERATORS:
   - Update generate_* methods for your specific models
   - Add domain-specific fields and relationships
   - Implement realistic data patterns for your use case

3. ADD DOMAIN-SPECIFIC GENERATORS:
   - Create generators for all your models
   - Implement relationship-aware generation
   - Add specialized scenario generators

4. CONFIGURE PATTERNS:
   - Customize data patterns for different testing scenarios
   - Add edge case patterns for boundary testing
   - Implement performance patterns for load testing

5. IMPLEMENT RELATIONSHIPS:
   - Ensure foreign key consistency
   - Add relationship caching for performance
   - Implement cascade generation for related entities

6. ADD EXPORT METHODS:
   - Implement SQL export for your database schema
   - Add CSV export for data analysis
   - Create fixture export for your testing framework

7. CREATE SCENARIOS:
   - Add scenario generators for common use cases
   - Implement workflow-specific data generation
   - Create test case specific datasets

FEATURES INCLUDED:
- Realistic data generation with Faker
- Relationship-aware data creation
- Multiple data patterns (realistic, edge cases, performance)
- Bulk data generation with consistent relationships
- Complete dataset generation
- Scenario-based data generation
- Export capabilities (JSON, SQL)
- Caching for performance and consistency
- Configurable seed for reproducible data
- Quick generation convenience functions

EXAMPLE USAGE:
```python
# Quick single entity generation
user = quick_user(role='admin', is_active=True)
project = quick_project(status='active')

# Bulk generation
users = quick_user(count=50)
tasks = quick_task(count=100, priority='high')

# Complete dataset
dataset = quick_dataset(size='medium')

# Scenario generation
generator = MockDataGenerator()
scenario = generator.generate_scenario_new_project()

# Export data
generator.export_to_json(dataset, 'test_data.json')
```

BEST PRACTICES:
- Use realistic data that matches your domain
- Implement proper relationships between entities
- Add edge cases for thorough testing
- Use consistent patterns across related data
- Cache entities for relationship consistency
- Provide multiple data patterns for different test scenarios
- Include metadata and configuration options
- Add proper documentation for generated fields
- Implement reproducible data generation with seeds
- Create scenario-specific generators for common workflows
""" 