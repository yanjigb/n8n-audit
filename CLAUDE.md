# PARALLEL ORCHESTRATION (Always-On MCP)

## Workflow for complex tasks (>= 3 files or >= 2 independent parts):
1. orchestrate_init → ask user for agent count
2. orchestrate_create_agent × N
3. Spawn N Agent tools IN PARALLEL
4. orchestrate_report × N
5. orchestrate_collect → SUMMARY.md