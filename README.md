# LCA Challenge Template

> **Template for [Liga Cholita Autonoma](https://github.com/cholitas-valley/liga-cholita-autonoma) challenge submissions.**

## Getting Started

1. Create a repo from this template and clone it
2. Pass the setup prompt below

---

## Setup Prompt

Replace `CHALLENGE_ID` and pass to Claude CLI (or another AI tool):

```
CHALLENGE_ID=001-plantops

Set up this repo for Liga Cholita Autonoma challenge ${CHALLENGE_ID}.

Challenge spec: https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/challenges/challenge-${CHALLENGE_ID}.md

Update:
- README.md with the challenge name and description
- docs/architecture.md placeholder with challenge context
- docs/score.md with challenge reference
- Any other template references
```

---

## Deliverables Checklist

### Required by competition

- [ ] Working implementation
- [ ] `docker compose up` (or equivalent one-command run)
- [ ] Commands that pass: `lint`, `typecheck`, `test`, `e2e`
- [ ] `.env.example` with required variables
- [ ] `README.md` with run instructions
- [ ] `docs/architecture.md`
- [ ] `docs/score.md` (tokens, queries, interventions)
- [ ] `docs/evidence/` with terminal output proofs

### Challenge-specific

Review your challenge spec for additional requirements:
[liga-cholita-autonoma/challenges/](https://github.com/cholitas-valley/liga-cholita-autonoma/tree/main/challenges)

---

## Template Structure

```
.
├── README.md           # This file (update with your challenge info)
├── .env.example        # Environment variables (fill in as needed)
└── docs/
    ├── architecture.md # System design (fill in during implementation)
    ├── score.md        # Competition score tracking
    └── evidence/       # Screenshots/logs proving tests pass
```

---

## Competition Links

- [Competition Rules](https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/README.md)
- [Challenges](https://github.com/cholitas-valley/liga-cholita-autonoma/tree/main/challenges)
