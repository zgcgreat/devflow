# DevFlow Kit

[English](./README.en.md) | [中文](./README.md)

DevFlow Kit is an AI-powered software development workflow system that provides **structured processes**, **engineering discipline**, and **cross-session memory** for AI-driven development projects.

## What is DevFlow Kit?

DevFlow Kit (formerly DevFlow / SuperFlow) is a comprehensive workflow framework designed to structure AI-assisted software development. It guides AI agents and developers through a complete software development lifecycle with:

- **Structured Stages**: From requirements to deployment (0→1→2→3→4→5→6→7)
- **Gate Validation**: Each stage has checkpoints to ensure quality
- **Cross-Session Memory**: Maintains project state and context across sessions
- **Engineering Discipline**: Enforces best practices throughout the development process

## Project Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                 DevFlow Workflow                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─→ 0-Confirm ─→ 1-Analysis ─→ 2-Design ─┐  │
│  │                      ↓                   │  │
│  │                 2a-UI-Design            │  │
│  │                      ↓                   │  │
│  │              3-Task ─→ 3a-Plan         │  │
│  │                 ↓                       │  │
│  │               4-Dev                     │  │
│  │                 ↓                       │  │
│  │               5-Test                   │  │
│  │                 ↓                       │  │
│  │              6-Review                 │  │
│  │                 ↓                       │  │
│  │           7-Integration ──→✓          │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

| Stage | Name | Description |
|---|---|---|
| 0 | Confirm | Requirement clarification and confirmation |
| 1 | Analysis | Requirements analysis and spec creation |
| 2 | Design | Technical architecture and design |
| 2a | UI Design | User interface design (optional) |
| 3 | Task | Task breakdown and planning |
| 3a | Implementation Plan | Detailed implementation plan |
| 4 | Development | Code implementation |
| 5 | Testing | Test writing and validation |
| 6 | Review | Code review and quality checks |
| 7 | Integration | Integration and release |

## Features

### 🧠 Cross-Session Memory
- Remembers project context, decisions, and failures across sessions
- Automatic state tracking with `.devflow-kit/STATE.md`
- Session journals for auditing

### 🚪 Stage Gates
- Validation at each stage transition
- Prerequisites check before entering new stage
- Quality gates to prevent shortcuts

### 🔄 Mode System
- **Fast Mode**: Quick iterations for prototyping
- **Standard Mode**: Full workflow with all checks
- **Strict Mode**: Enterprise-level rigor

### 🛠️ Built-in Skills

- **brainstorming** - Idea refinement and requirements gathering
- **planning-and-context** - Project planning and context management
- **writing-plans** - Document and plan writing
- **verification-before-completion** - Pre-release verification
- **systematic-debugging** - Systematic debugging methodology
- **test-driven-development** - TDD practices
- **using-git-worktrees** - Git worktree management

## Quick Start

### Prerequisites
- Claude Code / Cursor / OpenCode / Gemini CLI
- Node.js 18+ (for some skills)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/zgcgreat/devflow-kit.git

# Navigate to the kit
cd devflow-kit

# Copy to your project
# (or use as a reference for your AI coding tool)
```

### Basic Usage

1. **Start a new project**:
   ```
   User: I want to build a new web app
   ```

2. **DevFlow** automatically:
   - Reads project state
   - Detects entry point (new vs existing)
   - Routes to appropriate stage
   - Guides through the workflow

3. **Resume interrupted work**:
   ```
   User: Continue where we left off
   ```
   DevFlow detects interrupted state and continues from the right place.

## Project Structure

```
devflow-kit/
├── SKILL.md                    # Main DevFlow skill
├── references/                 # Reference documents
│   ├── GO.md                  # Complete workflow details
│   ├── RULES.md              # Global rules
│   ├── gate-rules.md         # Stage gate validation
│   ├── mode-rules.md         # Mode determination
│   ├── token-budget.md       # Token budget management
│   ├── prompts/             # Stage execution prompts
│   │   ├── 0-confirm.md
│   │   ├── 1-analysis.md
│   │   ├── 2-design.md
│   │   ├── ...
│   │   └── 7-integration.md
│   └── reference/            # Additional references
├── skills/                   # Reusable skills
│   ├── brainstorming/
│   ├── stage-skills/       # Stage-specific skills
│   │   ├── stage-0-confirm/
│   │   ├── stage-1-analysis/
│   │   ├── ...
│   │   └── stage-7-integration/
│   └── ...
└── templates/                # Output templates
    ├── 00-requirements.md
    ├── 01-analysis.md
    ├── 02-design.md
    └── ...
```

## Documentation

- [Complete Workflow (GO.md)](./references/GO.md) - Full workflow details
- [Global Rules](./references/RULES.md) - Core rules and principles
- [Stage Gate Rules](./references/gate-rules.md) - Stage validation rules
- [Mode Rules](./references/mode-rules.md) - Fast/Standard/Strict mode

## Examples

See the `skills/` directory for example implementations and best practices.

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - feel free to use for your own projects.

---

**Note**: This project was formerly known as DevFlow / SuperFlow. The name changed to DevFlow Kit to better reflect its purpose as a "kit" of tools for AI-driven development.