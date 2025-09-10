# Verified Available MCP Tools

This document tracks which Flow Nexus MCP tools are actually available vs documented.

## ✅ VERIFIED WORKING TOOLS

### Authentication & Core (4 tools)
- ✅ `mcp__flow-nexus__auth_status` - **NOT TESTED YET**
- ✅ `mcp__flow-nexus__user_login` - **VERIFIED WORKING**
- ✅ `mcp__flow-nexus__user_register` - **NOT TESTED YET**  
- ✅ `mcp__flow-nexus__user_logout` - **NOT TESTED YET**

### AI Assistant (1 tool)
- ✅ `mcp__flow-nexus__seraphina_chat` - **VERIFIED WORKING**

### Templates (3 tools)
- ✅ `mcp__flow-nexus__template_list` - **VERIFIED WORKING**
- ✅ `mcp__flow-nexus__template_get` - **NOT TESTED YET**
- ✅ `mcp__flow-nexus__template_deploy` - **NOT TESTED YET**

### GitHub Integration (1 tool)
- ✅ `mcp__flow-nexus__github_repo_analyze` - **VERIFIED WORKING**

### Credits & Payments (4 tools)
- ✅ `mcp__flow-nexus__check_balance` - **NOT TESTED YET**
- ✅ `mcp__flow-nexus__create_payment_link` - **NOT TESTED YET**
- ✅ `mcp__flow-nexus__configure_auto_refill` - **NOT TESTED YET**
- ✅ `mcp__flow-nexus__get_payment_history` - **NOT TESTED YET**

## ❌ DOCUMENTED BUT NOT AVAILABLE

### GitHub Integration (Missing 5 tools)
- ❌ `mcp__flow-nexus__github_pr_manage` - **NOT AVAILABLE**
- ❌ `mcp__flow-nexus__github_issue_track` - **NOT AVAILABLE**
- ❌ `mcp__flow-nexus__github_code_review` - **NOT AVAILABLE**
- ❌ `mcp__flow-nexus__github_sync_coord` - **NOT AVAILABLE**
- ❌ `mcp__flow-nexus__github_metrics` - **NOT AVAILABLE**

### AI Swarm Management (Missing most tools)
- Need to verify which swarm tools are actually available

### Neural Networks (Missing most tools)  
- Need to verify which neural tools are actually available

### Workflows (Missing most tools)
- Need to verify which workflow tools are actually available

### Sandbox & Execution (Missing most tools)
- Need to verify which sandbox tools are actually available

## NEXT STEPS

1. Test each documented tool systematically
2. Update README.md to show ONLY verified working tools
3. Correct the total tool count from 94 to actual working count
4. Create documentation based on real capabilities only

## TESTING STATUS

**Tested Tools: 4/94**
- user_login ✅
- seraphina_chat ✅  
- template_list ✅
- github_repo_analyze ✅

**Need to Test: 90 remaining**