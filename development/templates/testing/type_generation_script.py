# Type Generation Script for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: Type generation script for TypeScript from Pydantic models (Current)
# Future: Advanced type generation (unions, generics, conditional types)
# Future: Real-time type synchronization and validation
# Future: Multi-language type generation (Rust, Go, etc.)
#
# TEMPLATE USAGE:
# 1. Copy this script and customize for your models
# 2. Replace PLACEHOLDER comments with actual model imports
# 3. Configure output paths and type generation patterns

import ast
import inspect
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, get_type_hints, get_origin, get_args
from enum import Enum
import logging

# PLACEHOLDER: Import your Pydantic models
# from app.models.user import User, UserRole, UserPreferences
# from app.models.project import Project, ProjectStatus
# from app.models.task import Task, TaskStatus, TaskPriority
# from app.models.organization import Organization
# from app.schemas.api import *

try:
    from pydantic import BaseModel
    from pydantic.fields import FieldInfo
    PYDANTIC_AVAILABLE = True
except ImportError:
    PYDANTIC_AVAILABLE = False
    BaseModel = object
    FieldInfo = object

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TypeScriptGenerator:
    """
    Generates TypeScript type definitions from Python Pydantic models.
    
    Features:
    - Automatic type mapping from Python to TypeScript
    - Enum generation with proper typing
    - Interface generation from Pydantic models
    - Union type support
    - Optional field handling
    - Nested model support
    - Documentation preservation
    - Custom type mappings
    """
    
    def __init__(self, output_dir: str = "src/lib/types/generated"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Type mapping from Python to TypeScript
        self.type_mapping = {
            'str': 'string',
            'int': 'number',
            'float': 'number',
            'bool': 'boolean',
            'datetime': 'string',  # ISO string
            'date': 'string',
            'time': 'string',
            'UUID': 'string',
            'uuid': 'string',
            'bytes': 'string',  # base64 encoded
            'Any': 'any',
            'object': 'Record<string, any>',
            'dict': 'Record<string, any>',
            'Dict': 'Record<string, any>',
            'list': 'Array',
            'List': 'Array',
            'tuple': 'Array',
            'Tuple': 'Array',
            'set': 'Array',
            'Set': 'Array',
        }
        
        # Generated types registry
        self.generated_types: Dict[str, str] = {}
        self.generated_enums: Dict[str, str] = {}
        self.generated_interfaces: Dict[str, str] = {}
        
        # Import statements
        self.imports: List[str] = []
        
        # Custom type definitions
        self.custom_types: Dict[str, str] = {
            'UUID': 'string',
            'datetime': 'string',
            'EmailStr': 'string',
            'HttpUrl': 'string',
            'AnyUrl': 'string',
            'Json': 'any',
        }
    
    def generate_from_models(self, models: List[type]) -> Dict[str, str]:
        """Generate TypeScript types from a list of Pydantic models."""
        logger.info(f"Generating TypeScript types for {len(models)} models")
        
        # First pass: collect all enums
        for model in models:
            self._extract_enums_from_model(model)
        
        # Second pass: generate interfaces
        for model in models:
            self._generate_interface_from_model(model)
        
        # Generate output files
        return self._generate_output_files()
    
    def generate_from_directory(self, models_dir: str, pattern: str = "*.py") -> Dict[str, str]:
        """Generate types from all Python files in a directory."""
        models_path = Path(models_dir)
        python_files = list(models_path.glob(pattern))
        
        logger.info(f"Scanning {len(python_files)} Python files for Pydantic models")
        
        models = []
        for file_path in python_files:
            file_models = self._extract_models_from_file(file_path)
            models.extend(file_models)
        
        return self.generate_from_models(models)
    
    def _extract_models_from_file(self, file_path: Path) -> List[type]:
        """Extract Pydantic models from a Python file."""
        models = []
        
        try:
            # Read and parse the file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse AST to find class definitions
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    # Check if it's a Pydantic model
                    for base in node.bases:
                        if (isinstance(base, ast.Name) and base.id == 'BaseModel') or \
                           (isinstance(base, ast.Attribute) and base.attr == 'BaseModel'):
                            # This is likely a Pydantic model
                            model_info = self._extract_model_info_from_ast(node, content)
                            if model_info:
                                models.append(model_info)
                            break
        
        except Exception as e:
            logger.warning(f"Error parsing {file_path}: {str(e)}")
        
        return models
    
    def _extract_model_info_from_ast(self, node: ast.ClassDef, content: str) -> Optional[Dict[str, Any]]:
        """Extract model information from AST node."""
        try:
            model_info = {
                'name': node.name,
                'fields': {},
                'docstring': ast.get_docstring(node),
                'enums': [],
                'nested_models': []
            }
            
            # Extract field information
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    field_name = item.target.id
                    field_type = self._ast_to_type_string(item.annotation)
                    
                    # Check for default values
                    default_value = None
                    if item.value:
                        default_value = self._ast_to_value(item.value)
                    
                    model_info['fields'][field_name] = {
                        'type': field_type,
                        'default': default_value,
                        'optional': default_value is not None or 'Optional' in field_type
                    }
            
            return model_info
            
        except Exception as e:
            logger.warning(f"Error extracting model info for {node.name}: {str(e)}")
            return None
    
    def _ast_to_type_string(self, node: ast.AST) -> str:
        """Convert AST type annotation to string."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._ast_to_type_string(node.value)}.{node.attr}"
        elif isinstance(node, ast.Subscript):
            base = self._ast_to_type_string(node.value)
            if isinstance(node.slice, ast.Tuple):
                args = [self._ast_to_type_string(elt) for elt in node.slice.elts]
                return f"{base}[{', '.join(args)}]"
            else:
                arg = self._ast_to_type_string(node.slice)
                return f"{base}[{arg}]"
        elif isinstance(node, ast.Constant):
            return repr(node.value)
        else:
            return 'any'
    
    def _ast_to_value(self, node: ast.AST) -> Any:
        """Convert AST value to Python value."""
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.Name):
            return node.id
        else:
            return None
    
    def _extract_enums_from_model(self, model: Union[type, Dict[str, Any]]):
        """Extract enum definitions from a model."""
        if isinstance(model, dict):
            # Handle AST-extracted model info
            model_name = model['name']
            # Look for enum fields in the model
            for field_name, field_info in model['fields'].items():
                field_type = field_info['type']
                if 'Enum' in field_type or field_type.endswith('Status') or field_type.endswith('Role'):
                    # This might be an enum, generate a placeholder
                    enum_name = field_type.replace('Optional[', '').replace(']', '')
                    if enum_name not in self.generated_enums:
                        self.generated_enums[enum_name] = self._generate_placeholder_enum(enum_name)
        else:
            # Handle actual Pydantic model
            if not PYDANTIC_AVAILABLE or not issubclass(model, BaseModel):
                return
            
            # Get type hints
            try:
                hints = get_type_hints(model)
                for field_name, field_type in hints.items():
                    if self._is_enum_type(field_type):
                        enum_name = getattr(field_type, '__name__', str(field_type))
                        if enum_name not in self.generated_enums:
                            self.generated_enums[enum_name] = self._generate_enum_definition(field_type)
            except Exception as e:
                logger.warning(f"Error extracting enums from {model.__name__}: {str(e)}")
    
    def _generate_interface_from_model(self, model: Union[type, Dict[str, Any]]):
        """Generate TypeScript interface from a Pydantic model."""
        if isinstance(model, dict):
            # Handle AST-extracted model info
            interface_name = model['name']
            docstring = model.get('docstring', '')
            fields = model['fields']
            
            interface_def = self._generate_interface_definition(interface_name, fields, docstring)
            self.generated_interfaces[interface_name] = interface_def
        else:
            # Handle actual Pydantic model
            if not PYDANTIC_AVAILABLE or not issubclass(model, BaseModel):
                return
            
            interface_name = model.__name__
            docstring = model.__doc__ or ''
            
            try:
                # Get model fields
                fields = {}
                if hasattr(model, '__fields__'):
                    # Pydantic v1
                    for field_name, field_info in model.__fields__.items():
                        fields[field_name] = {
                            'type': str(field_info.type_),
                            'optional': not field_info.required,
                            'default': field_info.default if field_info.default is not ... else None
                        }
                elif hasattr(model, 'model_fields'):
                    # Pydantic v2
                    for field_name, field_info in model.model_fields.items():
                        fields[field_name] = {
                            'type': str(field_info.annotation),
                            'optional': not field_info.is_required(),
                            'default': field_info.default if hasattr(field_info, 'default') else None
                        }
                
                interface_def = self._generate_interface_definition(interface_name, fields, docstring)
                self.generated_interfaces[interface_name] = interface_def
                
            except Exception as e:
                logger.warning(f"Error generating interface for {interface_name}: {str(e)}")
    
    def _generate_interface_definition(self, name: str, fields: Dict[str, Any], docstring: str = '') -> str:
        """Generate TypeScript interface definition."""
        lines = []
        
        # Add docstring as comment
        if docstring:
            lines.append('/**')
            for line in docstring.strip().split('\n'):
                lines.append(f' * {line.strip()}')
            lines.append(' */')
        
        lines.append(f'export interface {name} {{')
        
        # Generate fields
        for field_name, field_info in fields.items():
            field_type = self._python_type_to_typescript(field_info['type'])
            optional_marker = '?' if field_info.get('optional', False) else ''
            
            # Add field comment if there's a default value
            default_value = field_info.get('default')
            if default_value is not None:
                lines.append(f'  /** Default: {default_value} */')
            
            lines.append(f'  {field_name}{optional_marker}: {field_type};')
        
        lines.append('}')
        return '\n'.join(lines)
    
    def _generate_enum_definition(self, enum_type: type) -> str:
        """Generate TypeScript enum definition from Python enum."""
        if not hasattr(enum_type, '__members__'):
            return self._generate_placeholder_enum(getattr(enum_type, '__name__', 'UnknownEnum'))
        
        enum_name = enum_type.__name__
        lines = []
        
        # Add docstring if available
        if enum_type.__doc__:
            lines.append('/**')
            lines.append(f' * {enum_type.__doc__.strip()}')
            lines.append(' */')
        
        lines.append(f'export enum {enum_name} {{')
        
        # Generate enum members
        for member_name, member_value in enum_type.__members__.items():
            if isinstance(member_value.value, str):
                lines.append(f'  {member_name} = "{member_value.value}",')
            else:
                lines.append(f'  {member_name} = {member_value.value},')
        
        lines.append('}')
        return '\n'.join(lines)
    
    def _generate_placeholder_enum(self, enum_name: str) -> str:
        """Generate placeholder enum for unknown enums."""
        lines = [
            '/**',
            f' * {enum_name} - Auto-generated placeholder enum',
            ' * TODO: Replace with actual enum values',
            ' */',
            f'export enum {enum_name} {{',
            '  // TODO: Add actual enum values',
            '  PLACEHOLDER = "placeholder"',
            '}'
        ]
        return '\n'.join(lines)
    
    def _python_type_to_typescript(self, python_type: str) -> str:
        """Convert Python type string to TypeScript type."""
        # Clean up the type string
        type_str = python_type.strip()
        
        # Handle Optional types
        if type_str.startswith('Optional[') and type_str.endswith(']'):
            inner_type = type_str[9:-1]
            return f'{self._python_type_to_typescript(inner_type)} | null'
        
        # Handle Union types
        if type_str.startswith('Union[') and type_str.endswith(']'):
            inner_types = type_str[6:-1].split(', ')
            ts_types = [self._python_type_to_typescript(t.strip()) for t in inner_types]
            return ' | '.join(ts_types)
        
        # Handle List types
        if type_str.startswith('List[') and type_str.endswith(']'):
            inner_type = type_str[5:-1]
            return f'{self._python_type_to_typescript(inner_type)}[]'
        
        # Handle Dict types
        if type_str.startswith('Dict[') and type_str.endswith(']'):
            inner_types = type_str[5:-1].split(', ', 1)
            if len(inner_types) == 2:
                key_type = self._python_type_to_typescript(inner_types[0].strip())
                value_type = self._python_type_to_typescript(inner_types[1].strip())
                if key_type == 'string':
                    return f'Record<string, {value_type}>'
                else:
                    return f'Map<{key_type}, {value_type}>'
            return 'Record<string, any>'
        
        # Handle generic types
        if '[' in type_str and ']' in type_str:
            base_type = type_str.split('[')[0]
            if base_type in self.type_mapping:
                return self.type_mapping[base_type]
        
        # Direct mapping
        if type_str in self.type_mapping:
            return self.type_mapping[type_str]
        
        # Custom types
        if type_str in self.custom_types:
            return self.custom_types[type_str]
        
        # Check if it's a known generated type
        if type_str in self.generated_interfaces or type_str in self.generated_enums:
            return type_str
        
        # Default to the type name (assuming it's a custom interface)
        return type_str
    
    def _is_enum_type(self, type_hint: type) -> bool:
        """Check if a type hint represents an enum."""
        try:
            return isinstance(type_hint, type) and issubclass(type_hint, Enum)
        except TypeError:
            return False
    
    def _generate_output_files(self) -> Dict[str, str]:
        """Generate output TypeScript files."""
        files = {}
        
        # Generate enums file
        if self.generated_enums:
            enums_content = self._generate_enums_file()
            enums_path = self.output_dir / 'enums.ts'
            files[str(enums_path)] = enums_content
            
            with open(enums_path, 'w', encoding='utf-8') as f:
                f.write(enums_content)
            logger.info(f"Generated enums file: {enums_path}")
        
        # Generate interfaces file
        if self.generated_interfaces:
            interfaces_content = self._generate_interfaces_file()
            interfaces_path = self.output_dir / 'interfaces.ts'
            files[str(interfaces_path)] = interfaces_content
            
            with open(interfaces_path, 'w', encoding='utf-8') as f:
                f.write(interfaces_content)
            logger.info(f"Generated interfaces file: {interfaces_path}")
        
        # Generate index file
        index_content = self._generate_index_file()
        index_path = self.output_dir / 'index.ts'
        files[str(index_path)] = index_content
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index_content)
        logger.info(f"Generated index file: {index_path}")
        
        return files
    
    def _generate_enums_file(self) -> str:
        """Generate the enums.ts file."""
        lines = [
            '// Auto-generated TypeScript enums from Python models',
            f'// Generated at: {datetime.now(timezone.utc).isoformat()}',
            '// DO NOT EDIT MANUALLY - This file is auto-generated',
            '',
        ]
        
        for enum_name, enum_def in self.generated_enums.items():
            lines.append(enum_def)
            lines.append('')
        
        return '\n'.join(lines)
    
    def _generate_interfaces_file(self) -> str:
        """Generate the interfaces.ts file."""
        lines = [
            '// Auto-generated TypeScript interfaces from Python models',
            f'// Generated at: {datetime.now(timezone.utc).isoformat()}',
            '// DO NOT EDIT MANUALLY - This file is auto-generated',
            '',
        ]
        
        # Add imports for enums if needed
        if self.generated_enums:
            enum_names = list(self.generated_enums.keys())
            lines.append(f'import {{ {", ".join(enum_names)} }} from "./enums";')
            lines.append('')
        
        for interface_name, interface_def in self.generated_interfaces.items():
            lines.append(interface_def)
            lines.append('')
        
        return '\n'.join(lines)
    
    def _generate_index_file(self) -> str:
        """Generate the index.ts file."""
        lines = [
            '// Auto-generated TypeScript types index',
            f'// Generated at: {datetime.now(timezone.utc).isoformat()}',
            '// DO NOT EDIT MANUALLY - This file is auto-generated',
            '',
        ]
        
        # Export enums
        if self.generated_enums:
            lines.append('// Enums')
            lines.append('export * from "./enums";')
            lines.append('')
        
        # Export interfaces
        if self.generated_interfaces:
            lines.append('// Interfaces')
            lines.append('export * from "./interfaces";')
            lines.append('')
        
        # Add type utilities
        lines.extend([
            '// Type utilities',
            'export type Nullable<T> = T | null;',
            'export type Optional<T> = T | undefined;',
            'export type ID = string;',
            'export type Timestamp = string;',
            'export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;',
            'export interface JSONObject { [key: string]: JSONValue; }',
            'export interface JSONArray extends Array<JSONValue> {}',
            '',
            '// API Response types',
            'export interface ApiResponse<T = any> {',
            '  data: T;',
            '  message?: string;',
            '  success: boolean;',
            '}',
            '',
            'export interface ApiError {',
            '  error: string;',
            '  details?: string;',
            '  code?: string;',
            '}',
            '',
            'export interface PaginatedResponse<T = any> {',
            '  items: T[];',
            '  total: number;',
            '  page: number;',
            '  limit: number;',
            '  has_next: boolean;',
            '  has_prev: boolean;',
            '}',
        ])
        
        return '\n'.join(lines)

# CLI interface
def main():
    """Main CLI interface for type generation."""
    import argparse
    
    parser = argparse.ArgumentParser(description='TypeScript Type Generation Script')
    parser.add_argument('--models-dir', default='app/models', 
                       help='Directory containing Python model files')
    parser.add_argument('--output-dir', default='src/lib/types/generated',
                       help='Output directory for TypeScript files')
    parser.add_argument('--pattern', default='*.py',
                       help='File pattern to match for model files')
    parser.add_argument('--watch', action='store_true',
                       help='Watch for file changes and regenerate')
    
    args = parser.parse_args()
    
    generator = TypeScriptGenerator(output_dir=args.output_dir)
    
    if args.watch:
        # PLACEHOLDER: Implement file watching
        logger.info("File watching not implemented yet")
        return
    
    try:
        files = generator.generate_from_directory(args.models_dir, args.pattern)
        logger.info(f"Generated {len(files)} TypeScript files")
        
        for file_path in files:
            logger.info(f"  - {file_path}")
            
    except Exception as e:
        logger.error(f"Type generation failed: {str(e)}")
        raise

# Convenience functions
def generate_types_from_models(models: List[type], output_dir: str = "src/lib/types/generated") -> Dict[str, str]:
    """Generate TypeScript types from a list of models."""
    generator = TypeScriptGenerator(output_dir)
    return generator.generate_from_models(models)

def generate_types_from_directory(models_dir: str, output_dir: str = "src/lib/types/generated") -> Dict[str, str]:
    """Generate TypeScript types from a directory of Python files."""
    generator = TypeScriptGenerator(output_dir)
    return generator.generate_from_directory(models_dir)

if __name__ == "__main__":
    main()

# Template Implementation Guide:
"""
TYPE GENERATION SCRIPT IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this script and customize for your project structure
   - Replace PLACEHOLDER comments with actual model imports
   - Configure input and output directories

2. CONFIGURE MODELS:
   - Import your Pydantic models at the top of the file
   - Add any custom type mappings to the type_mapping dictionary
   - Configure enum extraction patterns

3. CUSTOMIZE TYPE MAPPINGS:
   - Update type_mapping for project-specific types
   - Add custom_types for domain-specific type definitions
   - Configure complex type handling (generics, unions, etc.)

4. IMPLEMENT MODEL DISCOVERY:
   - Replace AST parsing with direct model imports if preferred
   - Add support for nested models and relationships
   - Implement proper enum detection and extraction

5. CONFIGURE OUTPUT:
   - Customize output file structure and naming
   - Add project-specific type utilities
   - Configure import/export patterns

6. ADD VALIDATION:
   - Implement type validation between Python and TypeScript
   - Add consistency checks for generated types
   - Create type compatibility tests

7. IMPLEMENT WATCHING:
   - Add file watching for automatic regeneration
   - Implement incremental updates for changed models
   - Add hot reload integration for development

8. OPTIMIZE PERFORMANCE:
   - Cache generated types for faster regeneration
   - Implement parallel processing for large codebases
   - Add progress tracking for long operations

FEATURES INCLUDED:
- Automatic type mapping from Python to TypeScript
- Enum generation with proper typing
- Interface generation from Pydantic models
- Union and Optional type support
- Nested model support
- Documentation preservation
- Custom type mappings
- CLI interface for easy usage
- File organization and index generation
- Type utilities and common patterns

EXAMPLE USAGE:
```bash
# Generate types from models directory
python type_generation_script.py --models-dir app/models --output-dir src/types

# Watch for changes and regenerate
python type_generation_script.py --watch

# Custom file pattern
python type_generation_script.py --pattern "schemas/*.py"
```

PROGRAMMATIC USAGE:
```python
# Generate from specific models
from app.models import User, Project, Task
models = [User, Project, Task]
files = generate_types_from_models(models)

# Generate from directory
files = generate_types_from_directory('app/models')
```

INTEGRATION WITH BUILD PROCESS:
- Add to package.json scripts for npm integration
- Include in pre-commit hooks for consistency
- Integrate with CI/CD for automated type checking
- Add to development server for hot reload

BEST PRACTICES:
- Keep generated files separate from manual types
- Use consistent naming conventions
- Add proper documentation to generated types
- Implement type validation tests
- Version control generated files for consistency
- Add clear regeneration instructions
- Use TypeScript strict mode for better type safety
- Implement proper error handling and logging
""" 