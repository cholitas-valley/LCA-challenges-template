# LCA Challenge Template

> **This is a template repository for [Liga Cholita Autonoma](../liga-cholita-autonoma) challenges.**
>
> Copy this folder to start a new challenge submission. The structure follows the competition's required deliverables.

## Competition

- **Rules:** [Cholitas Valley Autonomous AI Loops Coding Competition](../liga-cholita-autonoma/README.md)
- **Challenges:** [See challenges folder](../liga-cholita-autonoma/challenges/)

## Quick Start

```bash
cp .env.example .env
# Configure your environment variables

docker compose up
```

## Commands

```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Unit tests
pnpm test

# End-to-end tests
pnpm e2e
```

## Environment Variables

See [.env.example](.env.example) for required configuration.

## Documentation

- [Architecture](docs/architecture.md) - System components and how they connect
- [Score](docs/score.md) - Competition scoring metrics
- [Evidence](docs/evidence/) - Proof of passing tests

## Template Structure

```
LCA-challenges-template/
├── README.md              # This file
├── .env.example           # Environment variables template
├── docs/
│   ├── architecture.md    # System design documentation
│   ├── score.md           # Competition scoring record
│   └── evidence/          # Screenshots/logs proving tests pass
└── (your implementation)
```
