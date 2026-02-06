# open-attendance Development Guidelines

> **Audience**: LLM-driven engineering agents and human developers

open-attendance is an attendance and leave management system designed for small to medium-sized companies. open-attendance provides features for managing employee attendance, annual leave, vacation, sick leave, and related reporting functionalities.

## Required Development Workflow

1. Fulfill the user's requirements.
2. Write tests for the implemented features (add them to the `./tests` directory).
3. Run the full test suite (`test.sh`).
4. Ensure formatting, linting, and type-checking are clean (`check-quality.sh --fix`).

## Development Rules

### General

- .env, .env.local files must never be edited.

### Git & CI

- **NEVER** push or force-push to remote
- **ALWAYS** use the -s option to create a signed commit
- **NEVER** add "Co-Authored-By" lines to commit messages

### Commit Messages

- Follow standard commit message conventions
- Commit messages should be in English
- Keep commit messages brief - ideally just headlines, not detailed messages
- Focus on what changed, not how or why

### Agents

- nextjs-project-lead: Start with this agent for all Next.js related tasks
- db-schema-architect: Use this agent for all database related tasks
- ui-theme-specialist: Use this agent for all UI/UX and design related tasks
- location-expert: Use this agent for all location-based features and optimizations

### Tools (MCP & Skills)

- Use vercel-react-best-practices skills for React, TypeScript, and Next.js development
- Use web-design-guidelines skills for UI/UX design & create new components
- Use Context7 MCP for up-to-date library and framework knowledge

### Documentation

- README.md: 처음봐도 프로젝트의 목적과 기능을 한번에 이해할 수 있고, 빠르게 시작할 수 있도록 작성.
- ./docs: 프로젝트의 구조, 아키텍처, 주요 결정 사항 등 상세한 설명에 대한 문서를 정리.
- **Core Principle**: A feature doesn't exist unless it is documented!

### Documentation Guidelines

- **Code Examples**: Explain before showing code, make blocks fully runnable (include imports)
- **Structure**: Headers form navigation guide, logical H2/H3 hierarchy
- **Content**: User-focused sections, motivate features (why) before mechanics (how)
- **Style**: Prose over code comments for important information
