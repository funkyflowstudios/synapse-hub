"""
Input Injection Module.

This module provides functionality to inject keyboard input, shortcuts, and text
into the Cursor application across different platforms.
"""

import asyncio
import time
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from dataclasses import dataclass

from ..config.settings import get_settings, Platform
from ..utils.logging import get_logger


class KeyModifier(Enum):
    """Keyboard modifiers."""
    CTRL = "ctrl"
    CMD = "cmd"
    ALT = "alt"
    SHIFT = "shift"
    META = "meta"


class SpecialKey(Enum):
    """Special keyboard keys."""
    ENTER = "enter"
    TAB = "tab"
    ESCAPE = "escape"
    BACKSPACE = "backspace"
    DELETE = "delete"
    SPACE = "space"
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"
    HOME = "home"
    END = "end"
    PAGE_UP = "page_up"
    PAGE_DOWN = "page_down"


@dataclass
class KeyCombination:
    """Represents a key combination (shortcut)."""
    key: Union[str, SpecialKey]
    modifiers: List[KeyModifier] = None
    
    def __post_init__(self):
        if self.modifiers is None:
            self.modifiers = []


@dataclass
class InputSequence:
    """Represents a sequence of input actions."""
    actions: List[Union[str, KeyCombination]]
    delays: List[float] = None  # Delays between actions
    
    def __post_init__(self):
        if self.delays is None:
            self.delays = [0.1] * len(self.actions)


class InputInjector:
    """
    Platform-specific input injection for Cursor automation.
    
    Responsibilities:
    - Send keyboard shortcuts to Cursor
    - Type text and prompts
    - Handle special key combinations
    - Manage input timing and delays
    """
    
    def __init__(self):
        """Initialize the input injector."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.platform = self.settings.platform
        
        # Platform-specific key mappings
        self.modifier_mappings = {
            Platform.MACOS: {
                KeyModifier.CTRL: "control",
                KeyModifier.CMD: "command",
                KeyModifier.ALT: "option",
                KeyModifier.SHIFT: "shift",
                KeyModifier.META: "command",
            },
            Platform.WINDOWS: {
                KeyModifier.CTRL: "ctrl",
                KeyModifier.CMD: "win",
                KeyModifier.ALT: "alt",
                KeyModifier.SHIFT: "shift",
                KeyModifier.META: "win",
            },
            Platform.LINUX: {
                KeyModifier.CTRL: "ctrl",
                KeyModifier.CMD: "super",
                KeyModifier.ALT: "alt",
                KeyModifier.SHIFT: "shift",
                KeyModifier.META: "super",
            },
        }
        
        self.special_key_mappings = {
            Platform.MACOS: {
                SpecialKey.ENTER: "return",
                SpecialKey.TAB: "tab",
                SpecialKey.ESCAPE: "escape",
                SpecialKey.BACKSPACE: "delete",
                SpecialKey.DELETE: "forward delete",
                SpecialKey.SPACE: "space",
                SpecialKey.UP: "up arrow",
                SpecialKey.DOWN: "down arrow",
                SpecialKey.LEFT: "left arrow",
                SpecialKey.RIGHT: "right arrow",
                SpecialKey.HOME: "home",
                SpecialKey.END: "end",
                SpecialKey.PAGE_UP: "page up",
                SpecialKey.PAGE_DOWN: "page down",
            },
            Platform.WINDOWS: {
                SpecialKey.ENTER: "enter",
                SpecialKey.TAB: "tab",
                SpecialKey.ESCAPE: "esc",
                SpecialKey.BACKSPACE: "backspace",
                SpecialKey.DELETE: "delete",
                SpecialKey.SPACE: "space",
                SpecialKey.UP: "up",
                SpecialKey.DOWN: "down",
                SpecialKey.LEFT: "left",
                SpecialKey.RIGHT: "right",
                SpecialKey.HOME: "home",
                SpecialKey.END: "end",
                SpecialKey.PAGE_UP: "page_up",
                SpecialKey.PAGE_DOWN: "page_down",
            },
            Platform.LINUX: {
                SpecialKey.ENTER: "Return",
                SpecialKey.TAB: "Tab",
                SpecialKey.ESCAPE: "Escape",
                SpecialKey.BACKSPACE: "BackSpace",
                SpecialKey.DELETE: "Delete",
                SpecialKey.SPACE: "space",
                SpecialKey.UP: "Up",
                SpecialKey.DOWN: "Down",
                SpecialKey.LEFT: "Left",
                SpecialKey.RIGHT: "Right",
                SpecialKey.HOME: "Home",
                SpecialKey.END: "End",
                SpecialKey.PAGE_UP: "Page_Up",
                SpecialKey.PAGE_DOWN: "Page_Down",
            },
        }
        
        # Common Cursor shortcuts
        self.cursor_shortcuts = {
            "open_chat": KeyCombination("l", [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL]),
            "new_chat": KeyCombination("l", [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL, KeyModifier.SHIFT]),
            "submit_prompt": KeyCombination(SpecialKey.ENTER, [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL]),
            "cancel_request": KeyCombination("c", [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL]),
            "copy_response": KeyCombination("c", [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL]),
            "select_all": KeyCombination("a", [KeyModifier.CMD if self.platform == Platform.MACOS else KeyModifier.CTRL]),
        }
        
        self.logger.info(
            "Input injector initialized",
            platform=self.platform.value,
            shortcuts_available=len(self.cursor_shortcuts),
        )
    
    async def send_cursor_shortcut(self, shortcut_name: str) -> bool:
        """
        Send a predefined Cursor shortcut.
        
        Args:
            shortcut_name: Name of the shortcut (e.g., "open_chat", "submit_prompt")
            
        Returns:
            bool: True if shortcut was sent successfully, False otherwise
        """
        try:
            if shortcut_name not in self.cursor_shortcuts:
                self.logger.error("Unknown Cursor shortcut", shortcut=shortcut_name)
                return False
            
            shortcut = self.cursor_shortcuts[shortcut_name]
            success = await self.send_key_combination(shortcut)
            
            if success:
                self.logger.info("Sent Cursor shortcut", shortcut=shortcut_name)
            else:
                self.logger.error("Failed to send Cursor shortcut", shortcut=shortcut_name)
            
            return success
            
        except Exception as e:
            self.logger.error("Error sending Cursor shortcut", shortcut=shortcut_name, error=str(e))
            return False
    
    async def send_key_combination(self, combination: KeyCombination) -> bool:
        """
        Send a key combination (shortcut).
        
        Args:
            combination: KeyCombination to send
            
        Returns:
            bool: True if combination was sent successfully, False otherwise
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._send_macos_key_combination(combination)
            elif self.platform == Platform.WINDOWS:
                return await self._send_windows_key_combination(combination)
            elif self.platform == Platform.LINUX:
                return await self._send_linux_key_combination(combination)
            else:
                self.logger.error("Unsupported platform for key combinations")
                return False
                
        except Exception as e:
            self.logger.error("Error sending key combination", error=str(e))
            return False
    
    async def type_text(self, text: str, delay_between_chars: float = 0.01) -> bool:
        """
        Type text into the active application.
        
        Args:
            text: Text to type
            delay_between_chars: Delay between each character (seconds)
            
        Returns:
            bool: True if text was typed successfully, False otherwise
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._type_macos_text(text, delay_between_chars)
            elif self.platform == Platform.WINDOWS:
                return await self._type_windows_text(text, delay_between_chars)
            elif self.platform == Platform.LINUX:
                return await self._type_linux_text(text, delay_between_chars)
            else:
                self.logger.error("Unsupported platform for text typing")
                return False
                
        except Exception as e:
            self.logger.error("Error typing text", error=str(e))
            return False
    
    async def send_input_sequence(self, sequence: InputSequence) -> bool:
        """
        Send a sequence of input actions.
        
        Args:
            sequence: InputSequence to execute
            
        Returns:
            bool: True if sequence was executed successfully, False otherwise
        """
        try:
            for i, action in enumerate(sequence.actions):
                if isinstance(action, str):
                    success = await self.type_text(action)
                elif isinstance(action, KeyCombination):
                    success = await self.send_key_combination(action)
                else:
                    self.logger.error("Unknown action type in sequence", action_type=type(action))
                    return False
                
                if not success:
                    self.logger.error("Failed to execute action in sequence", action_index=i)
                    return False
                
                # Apply delay if specified
                if i < len(sequence.delays):
                    await asyncio.sleep(sequence.delays[i])
            
            self.logger.info("Input sequence executed successfully", actions=len(sequence.actions))
            return True
            
        except Exception as e:
            self.logger.error("Error executing input sequence", error=str(e))
            return False
    
    async def send_cursor_prompt(self, prompt: str, submit: bool = True) -> bool:
        """
        Send a prompt to Cursor AI.
        
        Args:
            prompt: The prompt text to send
            submit: Whether to submit the prompt (send Enter)
            
        Returns:
            bool: True if prompt was sent successfully, False otherwise
        """
        try:
            # Open chat if not already open
            await self.send_cursor_shortcut("open_chat")
            await asyncio.sleep(0.5)  # Wait for chat to open
            
            # Clear any existing text
            await self.send_cursor_shortcut("select_all")
            await asyncio.sleep(0.1)
            
            # Type the prompt
            success = await self.type_text(prompt)
            if not success:
                return False
            
            # Submit if requested
            if submit:
                await asyncio.sleep(0.2)  # Brief pause before submitting
                success = await self.send_cursor_shortcut("submit_prompt")
                if success:
                    self.logger.info("Cursor prompt sent and submitted", prompt_length=len(prompt))
                else:
                    self.logger.error("Failed to submit Cursor prompt")
                return success
            else:
                self.logger.info("Cursor prompt typed (not submitted)", prompt_length=len(prompt))
                return True
                
        except Exception as e:
            self.logger.error("Error sending Cursor prompt", error=str(e))
            return False
    
    # macOS-specific implementations
    async def _send_macos_key_combination(self, combination: KeyCombination) -> bool:
        """Send key combination on macOS using AppleScript."""
        try:
            # Build the keystroke command
            modifiers = []
            modifier_map = self.modifier_mappings[Platform.MACOS]
            
            for modifier in combination.modifiers:
                if modifier in modifier_map:
                    modifiers.append(modifier_map[modifier])
            
            # Handle the key
            if isinstance(combination.key, SpecialKey):
                key_map = self.special_key_mappings[Platform.MACOS]
                key = key_map.get(combination.key, str(combination.key.value))
            else:
                key = str(combination.key)
            
            # Build AppleScript
            if modifiers:
                modifier_str = " using {" + ", ".join(modifiers) + " down}"
            else:
                modifier_str = ""
            
            script = f'''
            tell application "System Events"
                keystroke "{key}"{modifier_str}
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error("Error sending macOS key combination", error=str(e))
            return False
    
    async def _type_macos_text(self, text: str, delay: float) -> bool:
        """Type text on macOS using AppleScript."""
        try:
            # Escape special characters for AppleScript
            escaped_text = text.replace('"', '\\"').replace('\\', '\\\\')
            
            script = f'''
            tell application "System Events"
                keystroke "{escaped_text}"
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error("Error typing text on macOS", error=str(e))
            return False
    
    # Windows-specific implementations (stubs for future implementation)
    async def _send_windows_key_combination(self, combination: KeyCombination) -> bool:
        """Send key combination on Windows."""
        # TODO: Implement Windows-specific key combination sending
        self.logger.debug("Windows key combination sending not implemented")
        return False
    
    async def _type_windows_text(self, text: str, delay: float) -> bool:
        """Type text on Windows."""
        # TODO: Implement Windows-specific text typing
        self.logger.debug("Windows text typing not implemented")
        return False
    
    # Linux-specific implementations (stubs for future implementation)
    async def _send_linux_key_combination(self, combination: KeyCombination) -> bool:
        """Send key combination on Linux."""
        # TODO: Implement Linux-specific key combination sending
        self.logger.debug("Linux key combination sending not implemented")
        return False
    
    async def _type_linux_text(self, text: str, delay: float) -> bool:
        """Type text on Linux."""
        # TODO: Implement Linux-specific text typing
        self.logger.debug("Linux text typing not implemented")
        return False
    
    # Utility methods
    def get_available_shortcuts(self) -> Dict[str, KeyCombination]:
        """Get all available Cursor shortcuts."""
        return self.cursor_shortcuts.copy()
    
    def create_custom_shortcut(self, key: Union[str, SpecialKey], modifiers: List[KeyModifier]) -> KeyCombination:
        """Create a custom key combination."""
        return KeyCombination(key=key, modifiers=modifiers)
    
    def create_input_sequence(self, actions: List[Union[str, KeyCombination]], delays: Optional[List[float]] = None) -> InputSequence:
        """Create an input sequence."""
        return InputSequence(actions=actions, delays=delays) 