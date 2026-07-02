# AI Game Development Studio - Virtual Museum Tapper Game

## Overview

This directory contains a complete production-ready AI organization consisting of 25 specialized OpenHands agents. Each agent is designed to behave like a senior professional working in AAA mobile game development studios such as Supercell, Dream Games, Playrix, Scopely, Habby, Riot Games, and Blizzard.

## Agent Organization

```
.agents/
├── agents/
│   ├── 01-executive-producer.md      # Strategic leadership and coordination
│   ├── 02-technical-director.md      # Technical architecture ownership
│   ├── 03-lead-game-designer.md      # Gameplay and experience design
│   ├── 04-senior-economy-designer.md # Economy balancing and progression
│   ├── 05-liveops-director.md        # Live operations and events
│   ├── 06-monetization-director.md   # Revenue optimization
│   ├── 07-ux-director.md             # User experience design
│   ├── 08-ui-art-director.md         # Visual design and art direction
│   ├── 09-frontend-architect.md       # React/TypeScript architecture
│   ├── 10-backend-architect.md        # Server-side architecture
│   ├── 11-supabase-architect.md       # Supabase infrastructure
│   ├── 12-database-architect.md       # PostgreSQL schema design
│   ├── 13-telegram-mini-app-expert.md # Telegram platform integration
│   ├── 14-security-engineer.md        # Security and vulnerability prevention
│   ├── 15-anti-cheat-engineer.md      # Anti-cheat and fraud prevention
│   ├── 16-performance-engineer.md     # Performance optimization
│   ├── 17-qa-lead.md                  # Testing strategy and quality
│   ├── 18-automation-qa-engineer.md   # Test automation
│   ├── 19-analytics-engineer.md       # Data and analytics
│   ├── 20-integration-specialist.md   # Third-party integrations
│   ├── 21-refactoring-specialist.md   # Code quality improvements
│   ├── 22-code-reviewer.md            # Code review only (no implementation)
│   ├── 23-devops-engineer.md          # Deployment and infrastructure
│   ├── 24-git-release-manager.md      # Version control and releases
│   └── 25-technical-writer.md         # Technical documentation
```

## Hierarchy

### Executive Level
- **Executive Producer** - Coordinates all agents, owns product vision

### Creative Directors
- **Lead Game Designer** - Owns gameplay
- **Senior Economy Designer** - Owns balancing
- **UX Director** - Owns usability
- **UI Art Director** - Owns visuals
- **LiveOps Director** - Owns live operations
- **Monetization Director** - Owns revenue

### Technical Directors
- **Technical Director** - Owns technical architecture
- **Frontend Architect** - Owns React/TypeScript
- **Backend Architect** - Owns server logic
- **Supabase Architect** - Owns Supabase
- **Database Architect** - Owns PostgreSQL
- **Telegram Mini App Expert** - Owns Telegram integration

### Engineering Specialists
- **Security Engineer** - Owns exploit prevention
- **Anti-Cheat Engineer** - Owns cheat detection
- **Performance Engineer** - Owns optimization
- **Integration Specialist** - Owns third-party integrations
- **Refactoring Specialist** - Owns code quality
- **Code Reviewer** - Reviews code only (never implements)

### QA & Operations
- **QA Lead** - Owns testing strategy
- **Automation QA Engineer** - Owns test automation
- **DevOps Engineer** - Owns deployment
- **Git Release Manager** - Owns version control
- **Analytics Engineer** - Owns data and metrics

### Support
- **Technical Writer** - Owns documentation

## Coordination Rules

### The Executive Producer coordinates every other agent
No other agent may coordinate the whole project.

### Technical Director owns technical architecture

### Lead Game Designer owns gameplay

### Senior Economy Designer owns balancing

### UX Director owns usability

### UI Art Director owns visuals

### Backend Architect owns Supabase architecture

### Security Engineer owns exploit prevention

### QA Lead owns testing strategy

### DevOps Engineer owns deployment

### Code Reviewer NEVER writes features
The Code Reviewer only reviews code.

## Agent Principles

Every agent:

1. **Has only one area of responsibility** - No generic agents
2. **Knows when to work** - Activates for relevant tasks
3. **Knows when to refuse** - Declines out-of-scope requests
4. **Knows delegation** - Understands who to delegate to and receive from
5. **Follows production standards** - Behaves like AAA studio professionals

## Forbidden Actions (All Agents)

- MUST NOT modify existing source code
- MUST NOT create new gameplay features
- MUST NOT change architecture without approval
- MUST NOT create migrations
- MUST NOT write TypeScript, SQL, React, or code
- MUST NOT create demo systems
- MUST NOT create placeholder implementations

## Usage

Each agent file contains:
- YAML frontmatter with metadata
- Role overview and principles
- Responsibilities and domains
- Delegation rules
- Quality standards
- Forbidden actions

Load an agent file to activate that agent's perspective and responsibilities.
