# LCA Challenge: 001 — PlantOps

> **[Liga Cholita Autonoma](https://github.com/cholitas-valley/liga-cholita-autonoma) challenge submission.**
>
> **Challenge Spec:** [challenge-001-plantops.md](https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/challenges/challenge-001-plantops.md)

Build a self-hosted system that ingests plant sensor data via MQTT, stores it, displays it live in a dashboard, and sends alerts when a plant needs attention.

---

## Setup Prompt

Replace `CHALLENGE_ID` and pass to Claude CLI (or another AI tool):

```
CHALLENGE_ID=001-plantops

Set up this repo for Liga Cholita Autonoma challenge ${CHALLENGE_ID}.

Challenge spec: https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/challenges/challenge-${CHALLENGE_ID}.md

DO NOT rewrite this README. Only replace the placeholders:
- [CHALLENGE_NAME] → challenge name
- [CHALLENGE_LINK] → link to challenge spec
- [CHALLENGE_DESCRIPTION] → one-line description from spec

Then update:
- docs/architecture.md → fill placeholders with challenge context
- docs/score.md → add challenge name reference
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

## Recommended Architecture

```
.
├── Makefile              # Single entrypoints for AI agent
├── docker-compose.yml    # Challenge environment
├── scripts/
│   └── check.sh          # "Done" gate (lint, typecheck, test, e2e)
├── rules/
│   └── agent.md          # Instructions for AI agent
├── tasks/
│   └── task-001.md       # Task definitions
├── docs/
│   ├── architecture.md
│   ├── score.md
│   └── evidence/
├── .env.example
└── README.md
```

### Makefile

```make
up:
	docker compose up -d

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

check:
	./scripts/check.sh
```

### scripts/check.sh

Per-template "done" gate. AI loops against this until it passes.

### rules/agent.md

Agent instructions (work on new branch, run `make check` before done, update docs, commit after check passes).

### tasks/

Task files for the AI to work through sequentially.

---

## Competition Links

- [Competition Rules](https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/README.md)
- [Challenges](https://github.com/cholitas-valley/liga-cholita-autonoma/tree/main/challenges)
