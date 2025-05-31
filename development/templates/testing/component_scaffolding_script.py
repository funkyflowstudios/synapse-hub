# Component Scaffolding Script for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: Component scaffolding script for rapid Svelte component generation (Current)
# Future: Advanced scaffolding (complex components, state management, animations)
# Future: Interactive scaffolding with prompts and customization
# Future: Integration with design system and component library
#
# TEMPLATE USAGE:
# 1. Copy this script and customize for your component patterns
# 2. Replace PLACEHOLDER comments with actual project paths and patterns
# 3. Configure component templates and scaffolding options

import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComponentScaffolder:
    """
    Generates complete Svelte component scaffolding with proper structure.
    
    Features:
    - Component file generation with TypeScript support
    - Story file generation for Storybook
    - Test file generation with Vitest
    - Style file generation with project patterns
    - Type definition generation
    - Documentation generation
    - Proper file organization
    - Template customization
    """
    
    def __init__(self, base_dir: str = "src/components"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Component templates
        self.templates = {
            'basic': self._get_basic_component_template,
            'form': self._get_form_component_template,
            'layout': self._get_layout_component_template,
            'ui': self._get_ui_component_template,
            'panel': self._get_panel_component_template,
            'modal': self._get_modal_component_template,
            'card': self._get_card_component_template,
            'list': self._get_list_component_template,
        }
        
        # Project-specific patterns
        self.project_patterns = {
            'glass_morphism': True,
            'unified_button_system': True,
            'accessibility_compliance': True,
            'performance_optimization': True,
            'theme_support': True,
        }
        
        # File extensions and patterns
        self.file_patterns = {
            'component': '.svelte',
            'story': '.stories.ts',
            'test': '.test.ts',
            'types': '.types.ts',
            'styles': '.module.css',
        }
    
    def scaffold_component(
        self,
        name: str,
        component_type: str = 'basic',
        category: str = 'ui',
        props: Optional[List[Dict[str, Any]]] = None,
        events: Optional[List[str]] = None,
        slots: Optional[List[str]] = None,
        with_stories: bool = True,
        with_tests: bool = True,
        with_types: bool = True,
        with_styles: bool = True
    ) -> Dict[str, str]:
        """
        Scaffold a complete component with all associated files.
        
        Args:
            name: Component name (PascalCase)
            component_type: Type of component template to use
            category: Component category for organization
            props: List of component props with types
            events: List of component events
            slots: List of component slots
            with_stories: Generate Storybook stories
            with_tests: Generate test files
            with_types: Generate type definitions
            with_styles: Generate style files
        """
        logger.info(f"Scaffolding component: {name}")
        
        # Validate component name
        if not self._is_valid_component_name(name):
            raise ValueError(f"Invalid component name: {name}")
        
        # Create component directory
        component_dir = self.base_dir / category / name
        component_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate component configuration
        config = self._generate_component_config(
            name, component_type, category, props, events, slots
        )
        
        # Generate files
        generated_files = {}
        
        # Main component file
        component_content = self._generate_component_file(config)
        component_path = component_dir / f"{name}{self.file_patterns['component']}"
        generated_files[str(component_path)] = component_content
        
        # Type definitions
        if with_types:
            types_content = self._generate_types_file(config)
            types_path = component_dir / f"{name}{self.file_patterns['types']}"
            generated_files[str(types_path)] = types_content
        
        # Stories file
        if with_stories:
            stories_content = self._generate_stories_file(config)
            stories_path = component_dir / f"{name}{self.file_patterns['story']}"
            generated_files[str(stories_path)] = stories_content
        
        # Test file
        if with_tests:
            test_content = self._generate_test_file(config)
            test_path = component_dir / f"{name}{self.file_patterns['test']}"
            generated_files[str(test_path)] = test_content
        
        # Style file
        if with_styles:
            styles_content = self._generate_styles_file(config)
            styles_path = component_dir / f"{name}{self.file_patterns['styles']}"
            generated_files[str(styles_path)] = styles_content
        
        # Index file for easy imports
        index_content = self._generate_index_file(config)
        index_path = component_dir / "index.ts"
        generated_files[str(index_path)] = index_content
        
        # README file
        readme_content = self._generate_readme_file(config)
        readme_path = component_dir / "README.md"
        generated_files[str(readme_path)] = readme_content
        
        # Write all files
        for file_path, content in generated_files.items():
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Generated: {file_path}")
        
        return generated_files
    
    def _generate_component_config(
        self,
        name: str,
        component_type: str,
        category: str,
        props: Optional[List[Dict[str, Any]]],
        events: Optional[List[str]],
        slots: Optional[List[str]]
    ) -> Dict[str, Any]:
        """Generate component configuration."""
        return {
            'name': name,
            'type': component_type,
            'category': category,
            'props': props or [],
            'events': events or [],
            'slots': slots or [],
            'kebab_name': self._to_kebab_case(name),
            'snake_name': self._to_snake_case(name),
            'generated_at': datetime.now(timezone.utc).isoformat(),
        }
    
    def _generate_component_file(self, config: Dict[str, Any]) -> str:
        """Generate the main Svelte component file."""
        template_func = self.templates.get(config['type'], self.templates['basic'])
        return template_func(config)
    
    def _get_basic_component_template(self, config: Dict[str, Any]) -> str:
        """Generate basic component template."""
        name = config['name']
        props = config['props']
        events = config['events']
        slots = config['slots']
        
        # Generate script section
        script_lines = [
            '<script lang="ts">',
            f'  // {name} Component',
            f'  // Generated at: {config["generated_at"]}',
            '  // 🤖 AI IMPLEMENTATION BREADCRUMBS:',
            f'  // Phase 2: {name} component scaffolding (Current)',
            f'  // Future: Enhanced {name} functionality and interactions',
            f'  // Future: Advanced {name} customization and theming',
            '',
            '  import { createEventDispatcher } from "svelte";',
            '  import { cn } from "$lib/utils";',
            '',
        ]
        
        # Add prop definitions
        if props:
            script_lines.append('  // Props')
            for prop in props:
                prop_name = prop['name']
                prop_type = prop.get('type', 'any')
                default_value = prop.get('default', 'undefined')
                required = prop.get('required', False)
                
                if required:
                    script_lines.append(f'  export let {prop_name}: {prop_type};')
                else:
                    script_lines.append(f'  export let {prop_name}: {prop_type} = {default_value};')
            script_lines.append('')
        
        # Add event dispatcher
        if events:
            script_lines.extend([
                '  // Events',
                '  const dispatch = createEventDispatcher<{',
            ])
            for event in events:
                script_lines.append(f'    {event}: any;')
            script_lines.extend([
                '  }>();',
                '',
            ])
        
        # Add component logic
        script_lines.extend([
            '  // Component state',
            '  let componentRef: HTMLElement;',
            '',
            '  // Reactive statements',
            '  $: componentClasses = cn(',
            f'    "{config["kebab_name"]}",',
            '    "glass-morphism",',
            '    "transition-all duration-200",',
            '    $$props.class',
            '  );',
            '',
            '  // Event handlers',
            '  function handleClick(event: MouseEvent) {',
            '    dispatch("click", { event, element: componentRef });',
            '  }',
            '',
            '</script>',
            '',
        ])
        
        # Generate template section
        template_lines = [
            '<!-- Component Template -->',
            '<div',
            '  bind:this={componentRef}',
            '  class={componentClasses}',
            '  on:click={handleClick}',
            '  role="button"',
            '  tabindex="0"',
            '  {...$$restProps}',
            '>',
        ]
        
        # Add slots
        if slots:
            for slot in slots:
                if slot == 'default':
                    template_lines.append('  <slot />')
                else:
                    template_lines.append(f'  <slot name="{slot}" />')
        else:
            template_lines.extend([
                '  <div class="content">',
                '    <slot />',
                '  </div>',
            ])
        
        template_lines.extend([
            '</div>',
            '',
        ])
        
        # Generate style section
        style_lines = [
            '<style>',
            f'  .{config["kebab_name"]} {{',
            '    /* Glass morphism base styles */',
            '    background: rgba(255, 255, 255, 0.1);',
            '    backdrop-filter: blur(10px);',
            '    border: 1px solid rgba(255, 255, 255, 0.2);',
            '    border-radius: var(--radius-md);',
            '    padding: var(--spacing-md);',
            '    ',
            '    /* Accessibility */',
            '    outline: none;',
            '    transition: all 0.2s ease;',
            '  }',
            '',
            f'  .{config["kebab_name"]}:hover {{',
            '    background: rgba(255, 255, 255, 0.15);',
            '    border-color: rgba(255, 255, 255, 0.3);',
            '  }',
            '',
            f'  .{config["kebab_name"]}:focus-visible {{',
            '    outline: 2px solid var(--color-primary);',
            '    outline-offset: 2px;',
            '  }',
            '',
            '  .content {',
            '    display: flex;',
            '    flex-direction: column;',
            '    gap: var(--spacing-sm);',
            '  }',
            '',
            '  /* Responsive design */',
            '  @media (max-width: 768px) {',
            f'    .{config["kebab_name"]} {{',
            '      padding: var(--spacing-sm);',
            '    }',
            '  }',
            '',
            '  /* High contrast mode */',
            '  @media (prefers-contrast: high) {',
            f'    .{config["kebab_name"]} {{',
            '      background: var(--color-background);',
            '      border: 2px solid var(--color-border);',
            '    }',
            '  }',
            '',
            '  /* Reduced motion */',
            '  @media (prefers-reduced-motion: reduce) {',
            f'    .{config["kebab_name"]} {{',
            '      transition: none;',
            '    }',
            '  }',
            '</style>',
        ]
        
        return '\n'.join(script_lines + template_lines + style_lines)
    
    def _get_form_component_template(self, config: Dict[str, Any]) -> str:
        """Generate form component template."""
        # PLACEHOLDER: Implement form-specific template
        return self._get_basic_component_template(config)
    
    def _get_layout_component_template(self, config: Dict[str, Any]) -> str:
        """Generate layout component template."""
        # PLACEHOLDER: Implement layout-specific template
        return self._get_basic_component_template(config)
    
    def _get_ui_component_template(self, config: Dict[str, Any]) -> str:
        """Generate UI component template."""
        # PLACEHOLDER: Implement UI-specific template
        return self._get_basic_component_template(config)
    
    def _get_panel_component_template(self, config: Dict[str, Any]) -> str:
        """Generate panel component template."""
        # PLACEHOLDER: Implement panel-specific template
        return self._get_basic_component_template(config)
    
    def _get_modal_component_template(self, config: Dict[str, Any]) -> str:
        """Generate modal component template."""
        # PLACEHOLDER: Implement modal-specific template
        return self._get_basic_component_template(config)
    
    def _get_card_component_template(self, config: Dict[str, Any]) -> str:
        """Generate card component template."""
        # PLACEHOLDER: Implement card-specific template
        return self._get_basic_component_template(config)
    
    def _get_list_component_template(self, config: Dict[str, Any]) -> str:
        """Generate list component template."""
        # PLACEHOLDER: Implement list-specific template
        return self._get_basic_component_template(config)
    
    def _generate_types_file(self, config: Dict[str, Any]) -> str:
        """Generate TypeScript type definitions."""
        name = config['name']
        props = config['props']
        events = config['events']
        
        lines = [
            f'// {name} Component Types',
            f'// Generated at: {config["generated_at"]}',
            '// DO NOT EDIT MANUALLY - Regenerate using scaffolding script',
            '',
            '// Props interface',
            f'export interface {name}Props {{',
        ]
        
        # Add prop types
        if props:
            for prop in props:
                prop_name = prop['name']
                prop_type = prop.get('type', 'any')
                required = prop.get('required', False)
                description = prop.get('description', '')
                
                if description:
                    lines.append(f'  /** {description} */')
                
                optional_marker = '' if required else '?'
                lines.append(f'  {prop_name}{optional_marker}: {prop_type};')
        else:
            lines.append('  // No props defined')
        
        lines.extend([
            '}',
            '',
            '// Events interface',
            f'export interface {name}Events {{',
        ])
        
        # Add event types
        if events:
            for event in events:
                lines.append(f'  {event}: CustomEvent<any>;')
        else:
            lines.append('  // No events defined')
        
        lines.extend([
            '}',
            '',
            '// Slots interface',
            f'export interface {name}Slots {{',
            '  default: {};',
        ])
        
        # Add slot types
        for slot in config['slots']:
            if slot != 'default':
                lines.append(f'  {slot}: {{}};')
        
        lines.extend([
            '}',
            '',
            '// Component type',
            f'export type {name}Component = import("svelte").SvelteComponent<',
            f'  {name}Props,',
            f'  {name}Events,',
            f'  {name}Slots',
            '>;',
        ])
        
        return '\n'.join(lines)
    
    def _generate_stories_file(self, config: Dict[str, Any]) -> str:
        """Generate Storybook stories file."""
        name = config['name']
        props = config['props']
        
        lines = [
            f'// {name} Component Stories',
            f'// Generated at: {config["generated_at"]}',
            '',
            'import type { Meta, StoryObj } from "@storybook/svelte";',
            f'import {name} from "./{name}.svelte";',
            '',
            f'const meta: Meta<{name}> = {{',
            f'  title: "Components/{config["category"]}/{name}",',
            f'  component: {name},',
            '  parameters: {',
            '    layout: "centered",',
            '    docs: {',
            f'      description: {{',
            f'        component: "{name} component with glass morphism design."',
            '      }',
            '    }',
            '  },',
            '  tags: ["autodocs"],',
            '  argTypes: {',
        ]
        
        # Add prop controls
        if props:
            for prop in props:
                prop_name = prop['name']
                prop_type = prop.get('type', 'any')
                description = prop.get('description', '')
                
                lines.extend([
                    f'    {prop_name}: {{',
                    f'      description: "{description}",',
                    f'      control: {{ type: "{self._get_storybook_control_type(prop_type)}" }}',
                    '    },',
                ])
        
        lines.extend([
            '  }',
            '};',
            '',
            'export default meta;',
            f'type Story = StoryObj<{name}>;',
            '',
            '// Default story',
            'export const Default: Story = {',
            '  args: {',
        ])
        
        # Add default prop values
        if props:
            for prop in props:
                default_value = prop.get('default', 'undefined')
                if default_value != 'undefined':
                    lines.append(f'    {prop["name"]}: {default_value},')
        
        lines.extend([
            '  }',
            '};',
            '',
            '// Interactive story',
            'export const Interactive: Story = {',
            '  args: {',
            '    ...Default.args',
            '  },',
            '  play: async ({ canvasElement }) => {',
            '    // Add interaction tests here',
            '  }',
            '};',
            '',
            '// Variants',
            'export const WithContent: Story = {',
            '  args: {',
            '    ...Default.args',
            '  },',
            '  render: (args) => ({',
            f'    Component: {name},',
            '    props: args,',
            '    slot: "Sample content for the component"',
            '  })',
            '};',
        ])
        
        return '\n'.join(lines)
    
    def _generate_test_file(self, config: Dict[str, Any]) -> str:
        """Generate Vitest test file."""
        name = config['name']
        
        lines = [
            f'// {name} Component Tests',
            f'// Generated at: {config["generated_at"]}',
            '',
            'import { describe, it, expect, vi } from "vitest";',
            'import { render, screen, fireEvent } from "@testing-library/svelte";',
            'import { tick } from "svelte";',
            f'import {name} from "./{name}.svelte";',
            '',
            f'describe("{name}", () => {{',
            '  it("renders correctly", () => {',
            f'    render({name});',
            f'    expect(screen.getByRole("button")).toBeInTheDocument();',
            '  });',
            '',
            '  it("applies correct CSS classes", () => {',
            f'    render({name}, {{ class: "custom-class" }});',
            '    const element = screen.getByRole("button");',
            f'    expect(element).toHaveClass("{config["kebab_name"]}");',
            '    expect(element).toHaveClass("glass-morphism");',
            '    expect(element).toHaveClass("custom-class");',
            '  });',
            '',
            '  it("handles click events", async () => {',
            '    const mockHandler = vi.fn();',
            f'    const {{ component }} = render({name});',
            '    component.$on("click", mockHandler);',
            '',
            '    const element = screen.getByRole("button");',
            '    await fireEvent.click(element);',
            '',
            '    expect(mockHandler).toHaveBeenCalledOnce();',
            '  });',
            '',
            '  it("supports keyboard navigation", async () => {',
            '    const mockHandler = vi.fn();',
            f'    const {{ component }} = render({name});',
            '    component.$on("click", mockHandler);',
            '',
            '    const element = screen.getByRole("button");',
            '    element.focus();',
            '    await fireEvent.keyDown(element, { key: "Enter" });',
            '',
            '    expect(mockHandler).toHaveBeenCalledOnce();',
            '  });',
            '',
        ]
        
        # Add prop-specific tests
        if config['props']:
            lines.extend([
                '  describe("props", () => {',
            ])
            
            for prop in config['props']:
                prop_name = prop['name']
                prop_type = prop.get('type', 'any')
                
                lines.extend([
                    f'    it("accepts {prop_name} prop", () => {{',
                    f'      const testValue = {self._get_test_value(prop_type)};',
                    f'      render({name}, {{ {prop_name}: testValue }});',
                    '      // Add specific assertions for this prop',
                    '    });',
                    '',
                ])
            
            lines.append('  });')
        
        lines.extend([
            '',
            '  it("meets accessibility requirements", () => {',
            f'    render({name});',
            '    const element = screen.getByRole("button");',
            '',
            '    // Check ARIA attributes',
            '    expect(element).toHaveAttribute("tabindex", "0");',
            '',
            '    // Check focus management',
            '    element.focus();',
            '    expect(element).toHaveFocus();',
            '  });',
            '',
            '  it("supports reduced motion preferences", () => {',
            '    // Mock reduced motion preference',
            '    Object.defineProperty(window, "matchMedia", {',
            '      writable: true,',
            '      value: vi.fn().mockImplementation(query => ({',
            '        matches: query === "(prefers-reduced-motion: reduce)",',
            '        media: query,',
            '        onchange: null,',
            '        addListener: vi.fn(),',
            '        removeListener: vi.fn(),',
            '        addEventListener: vi.fn(),',
            '        removeEventListener: vi.fn(),',
            '        dispatchEvent: vi.fn(),',
            '      })),',
            '    });',
            '',
            f'    render({name});',
            '    // Add assertions for reduced motion behavior',
            '  });',
            '});',
        ])
        
        return '\n'.join(lines)
    
    def _generate_styles_file(self, config: Dict[str, Any]) -> str:
        """Generate CSS module file."""
        name = config['name']
        kebab_name = config['kebab_name']
        
        lines = [
            f'/* {name} Component Styles */',
            f'/* Generated at: {config["generated_at"]} */',
            '',
            f'.{kebab_name} {{',
            '  /* Base styles */',
            '  position: relative;',
            '  display: flex;',
            '  flex-direction: column;',
            '',
            '  /* Glass morphism */',
            '  background: rgba(255, 255, 255, 0.1);',
            '  backdrop-filter: blur(10px);',
            '  border: 1px solid rgba(255, 255, 255, 0.2);',
            '  border-radius: var(--radius-md);',
            '',
            '  /* Spacing */',
            '  padding: var(--spacing-md);',
            '  gap: var(--spacing-sm);',
            '',
            '  /* Transitions */',
            '  transition: all 0.2s ease;',
            '}',
            '',
            f'.{kebab_name}:hover {{',
            '  background: rgba(255, 255, 255, 0.15);',
            '  border-color: rgba(255, 255, 255, 0.3);',
            '  transform: translateY(-1px);',
            '}',
            '',
            f'.{kebab_name}:focus-visible {{',
            '  outline: 2px solid var(--color-primary);',
            '  outline-offset: 2px;',
            '}',
            '',
            f'.{kebab_name}:active {{',
            '  transform: translateY(0);',
            '}',
            '',
            '/* Content area */',
            f'.{kebab_name} .content {{',
            '  flex: 1;',
            '  display: flex;',
            '  flex-direction: column;',
            '  gap: var(--spacing-xs);',
            '}',
            '',
            '/* Responsive design */',
            '@media (max-width: 768px) {',
            f'  .{kebab_name} {{',
            '    padding: var(--spacing-sm);',
            '  }',
            '}',
            '',
            '@media (max-width: 480px) {',
            f'  .{kebab_name} {{',
            '    padding: var(--spacing-xs);',
            '  }',
            '}',
            '',
            '/* Theme variants */',
            f'.{kebab_name}.theme-dark {{',
            '  background: rgba(0, 0, 0, 0.2);',
            '  border-color: rgba(255, 255, 255, 0.1);',
            '}',
            '',
            f'.{kebab_name}.theme-light {{',
            '  background: rgba(255, 255, 255, 0.8);',
            '  border-color: rgba(0, 0, 0, 0.1);',
            '}',
            '',
            '/* High contrast mode */',
            '@media (prefers-contrast: high) {',
            f'  .{kebab_name} {{',
            '    background: var(--color-background);',
            '    border: 2px solid var(--color-border);',
            '    backdrop-filter: none;',
            '  }',
            '}',
            '',
            '/* Reduced motion */',
            '@media (prefers-reduced-motion: reduce) {',
            f'  .{kebab_name} {{',
            '    transition: none;',
            '  }',
            '',
            f'  .{kebab_name}:hover {{',
            '    transform: none;',
            '  }',
            '}',
            '',
            '/* Print styles */',
            '@media print {',
            f'  .{kebab_name} {{',
            '    background: white;',
            '    border: 1px solid black;',
            '    backdrop-filter: none;',
            '  }',
            '}',
        ]
        
        return '\n'.join(lines)
    
    def _generate_index_file(self, config: Dict[str, Any]) -> str:
        """Generate index file for easy imports."""
        name = config['name']
        
        lines = [
            f'// {name} Component Index',
            f'// Generated at: {config["generated_at"]}',
            '',
            f'export {{ default as {name} }} from "./{name}.svelte";',
            f'export type {{ {name}Props, {name}Events, {name}Slots }} from "./{name}.types";',
        ]
        
        return '\n'.join(lines)
    
    def _generate_readme_file(self, config: Dict[str, Any]) -> str:
        """Generate README documentation."""
        name = config['name']
        props = config['props']
        events = config['events']
        slots = config['slots']
        
        lines = [
            f'# {name}',
            '',
            f'A {config["type"]} component built with Svelte and TypeScript.',
            '',
            '## Features',
            '',
            '- 🎨 Glass morphism design',
            '- ♿ WCAG 2.2+ AAA accessibility compliance',
            '- 📱 Responsive design',
            '- 🎭 Theme support',
            '- ⚡ Performance optimized',
            '- 🧪 Fully tested',
            '',
            '## Usage',
            '',
            '```svelte',
            '<script>',
            f'  import {name} from "$lib/components/{config["category"]}/{name}";',
            '</script>',
            '',
            f'<{name}',
        ]
        
        # Add prop examples
        if props:
            for prop in props:
                default_value = prop.get('default', 'undefined')
                if default_value != 'undefined':
                    lines.append(f'  {prop["name"]}={default_value}')
        
        lines.extend([
            '>',
            '  Content goes here',
            f'</{name}>',
            '```',
            '',
        ])
        
        # Add props documentation
        if props:
            lines.extend([
                '## Props',
                '',
                '| Name | Type | Default | Description |',
                '|------|------|---------|-------------|',
            ])
            
            for prop in props:
                prop_name = prop['name']
                prop_type = prop.get('type', 'any')
                default_value = prop.get('default', 'undefined')
                description = prop.get('description', '')
                
                lines.append(f'| `{prop_name}` | `{prop_type}` | `{default_value}` | {description} |')
            
            lines.append('')
        
        # Add events documentation
        if events:
            lines.extend([
                '## Events',
                '',
                '| Name | Description |',
                '|------|-------------|',
            ])
            
            for event in events:
                lines.append(f'| `{event}` | Fired when {event} occurs |')
            
            lines.append('')
        
        # Add slots documentation
        if slots:
            lines.extend([
                '## Slots',
                '',
                '| Name | Description |',
                '|------|-------------|',
            ])
            
            for slot in slots:
                lines.append(f'| `{slot}` | {slot.title()} content slot |')
            
            lines.append('')
        
        lines.extend([
            '## Accessibility',
            '',
            'This component follows WCAG 2.2+ AAA guidelines:',
            '',
            '- Proper semantic HTML structure',
            '- Keyboard navigation support',
            '- Screen reader compatibility',
            '- High contrast mode support',
            '- Reduced motion preferences',
            '',
            '## Testing',
            '',
            'Run the component tests:',
            '',
            '```bash',
            'npm run test -- ' + name,
            '```',
            '',
            '## Storybook',
            '',
            'View the component in Storybook:',
            '',
            '```bash',
            'npm run storybook',
            '```',
            '',
            f'Navigate to `Components/{config["category"]}/{name}`',
        ])
        
        return '\n'.join(lines)
    
    # Utility methods
    
    def _is_valid_component_name(self, name: str) -> bool:
        """Validate component name."""
        return bool(re.match(r'^[A-Z][a-zA-Z0-9]*$', name))
    
    def _to_kebab_case(self, name: str) -> str:
        """Convert PascalCase to kebab-case."""
        return re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()
    
    def _to_snake_case(self, name: str) -> str:
        """Convert PascalCase to snake_case."""
        return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()
    
    def _get_storybook_control_type(self, prop_type: str) -> str:
        """Get Storybook control type for prop type."""
        type_mapping = {
            'string': 'text',
            'number': 'number',
            'boolean': 'boolean',
            'array': 'object',
            'object': 'object',
        }
        return type_mapping.get(prop_type.lower(), 'text')
    
    def _get_test_value(self, prop_type: str) -> str:
        """Get test value for prop type."""
        value_mapping = {
            'string': '"test value"',
            'number': '42',
            'boolean': 'true',
            'array': '[]',
            'object': '{}',
        }
        return value_mapping.get(prop_type.lower(), 'null')

# CLI interface
def main():
    """Main CLI interface for component scaffolding."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Component Scaffolding Script')
    parser.add_argument('name', help='Component name (PascalCase)')
    parser.add_argument('--type', choices=['basic', 'form', 'layout', 'ui', 'panel', 'modal', 'card', 'list'],
                       default='basic', help='Component type')
    parser.add_argument('--category', default='ui', help='Component category')
    parser.add_argument('--base-dir', default='src/components', help='Base directory for components')
    parser.add_argument('--no-stories', action='store_true', help='Skip Storybook stories')
    parser.add_argument('--no-tests', action='store_true', help='Skip test files')
    parser.add_argument('--no-types', action='store_true', help='Skip type definitions')
    parser.add_argument('--no-styles', action='store_true', help='Skip style files')
    
    args = parser.parse_args()
    
    scaffolder = ComponentScaffolder(base_dir=args.base_dir)
    
    try:
        files = scaffolder.scaffold_component(
            name=args.name,
            component_type=args.type,
            category=args.category,
            with_stories=not args.no_stories,
            with_tests=not args.no_tests,
            with_types=not args.no_types,
            with_styles=not args.no_styles
        )
        
        logger.info(f"Successfully scaffolded {args.name} component")
        logger.info(f"Generated {len(files)} files:")
        
        for file_path in files:
            logger.info(f"  - {file_path}")
            
    except Exception as e:
        logger.error(f"Scaffolding failed: {str(e)}")
        raise

# Convenience functions
def scaffold_basic_component(name: str, category: str = 'ui') -> Dict[str, str]:
    """Quick basic component scaffolding."""
    scaffolder = ComponentScaffolder()
    return scaffolder.scaffold_component(name, 'basic', category)

def scaffold_form_component(name: str, props: List[Dict[str, Any]] = None) -> Dict[str, str]:
    """Quick form component scaffolding."""
    scaffolder = ComponentScaffolder()
    return scaffolder.scaffold_component(name, 'form', 'forms', props)

if __name__ == "__main__":
    main()

# Template Implementation Guide:
"""
COMPONENT SCAFFOLDING SCRIPT IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this script and customize for your project structure
   - Replace PLACEHOLDER comments with actual component patterns
   - Configure base directories and file patterns

2. CUSTOMIZE TEMPLATES:
   - Update component templates for your specific patterns
   - Add project-specific styling and structure
   - Configure accessibility and performance patterns

3. ADD COMPONENT TYPES:
   - Implement specific templates for different component types
   - Add domain-specific component patterns
   - Configure component-specific props and events

4. CONFIGURE STYLING:
   - Update CSS patterns for your design system
   - Add theme support and responsive patterns
   - Configure accessibility and performance styles

5. CUSTOMIZE TESTING:
   - Update test templates for your testing patterns
   - Add component-specific test scenarios
   - Configure accessibility and interaction tests

6. ADD STORYBOOK INTEGRATION:
   - Customize story templates for your Storybook setup
   - Add component-specific controls and interactions
   - Configure documentation patterns

7. IMPLEMENT VALIDATION:
   - Add component name validation
   - Implement prop and event validation
   - Add file structure validation

8. ADD INTERACTIVE FEATURES:
   - Implement interactive prompts for component configuration
   - Add component preview and validation
   - Create component update and migration tools

FEATURES INCLUDED:
- Complete component scaffolding with all associated files
- TypeScript support with proper type definitions
- Storybook integration with interactive stories
- Comprehensive testing with Vitest
- Accessibility compliance (WCAG 2.2+ AAA)
- Glass morphism design patterns
- Responsive design and theme support
- Performance optimization patterns
- CLI interface for easy usage
- Documentation generation

EXAMPLE USAGE:
```bash
# Basic component
python component_scaffolding_script.py MyComponent

# Form component with custom type
python component_scaffolding_script.py ContactForm --type form --category forms

# UI component without tests
python component_scaffolding_script.py Button --type ui --no-tests

# Custom category and location
python component_scaffolding_script.py DataPanel --type panel --category panels --base-dir src/lib/components
```

PROGRAMMATIC USAGE:
```python
# Basic component
files = scaffold_basic_component('MyComponent', 'ui')

# Form component with props
props = [
    {'name': 'value', 'type': 'string', 'required': True},
    {'name': 'disabled', 'type': 'boolean', 'default': 'false'}
]
files = scaffold_form_component('ContactForm', props)
```

INTEGRATION WITH DEVELOPMENT WORKFLOW:
- Add to package.json scripts for npm integration
- Include in development tools and IDE extensions
- Integrate with component library and design system
- Add to CI/CD for component validation

BEST PRACTICES:
- Use consistent naming conventions (PascalCase for components)
- Follow project-specific file organization patterns
- Include comprehensive documentation and examples
- Implement proper accessibility patterns
- Add performance optimization by default
- Use TypeScript for better type safety
- Include comprehensive testing patterns
- Follow design system guidelines
- Add proper error handling and validation
- Create reusable component patterns
""" 