#!/usr/bin/env python3
"""
Quick integration test for SSH support in automation engine
"""

import asyncio
import sys
sys.path.insert(0, 'src')

async def test_integration():
    from src.automation.automation_engine import AutomationEngine
    
    try:
        # Test basic engine initialization with SSH support
        engine = AutomationEngine()
        print('✅ AutomationEngine initialized with SSH support')
        
        # Test SSH context methods
        ssh_context = await engine.get_ssh_context()
        print(f'✅ SSH context retrieved: {ssh_context["ssh_context"]["type"]}')
        
        # Test validation methods
        validation = await engine.validate_remote_setup()
        print(f'✅ Remote setup validation: {validation["validation"]["overall_status"]}')
        
        # Test guidance methods  
        guidance = await engine.get_ssh_setup_guidance()
        print(f'✅ SSH setup guidance: {len(guidance)} messages')
        
        print('✅ All SSH integration tests passed!')
        return True
        
    except Exception as e:
        print(f'❌ Integration test failed: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_integration())
    sys.exit(0 if success else 1) 