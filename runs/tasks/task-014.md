---
task_id: task-014
title: Frontend scaffolding
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-003
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-003.md
allowed_paths:
  - frontend/**
  - docker-compose.yml
check_command: cd frontend && npm run build 2>&1 | head -20 || (npm install && npm run build)
handoff: runs/handoffs/task-014.md
---

# Task 014: Frontend Scaffolding

## Goal

Set up the React frontend project with Vite, TypeScript, and TailwindCSS. Create the basic project structure and development environment.

## Requirements

### Project Initialization

Create React project with Vite:
- React 18 with TypeScript
- Vite as build tool
- TailwindCSS for styling
- React Router for navigation

### Project Structure

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── Dockerfile
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   └── .gitkeep
│   ├── pages/
│   │   └── .gitkeep
│   ├── hooks/
│   │   └── .gitkeep
│   ├── api/
│   │   └── .gitkeep
│   └── types/
│       └── .gitkeep
└── public/
    └── favicon.ico
```

### Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true
      }
    }
  }
})
```

### TailwindCSS Setup

Configure with default theme plus plant-themed colors:
- Primary: Green shades for healthy plants
- Warning: Yellow/orange for alerts
- Danger: Red for critical issues

### Docker Configuration

**frontend/Dockerfile:**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

Update docker-compose.yml frontend service (if not already).

### Basic App

Create minimal App.tsx with:
- React Router setup
- Placeholder routes (/, /plants, /devices, /settings)
- Basic layout wrapper

## Definition of Done

- [ ] `npm install` completes without errors
- [ ] `npm run build` produces dist/ folder
- [ ] `npm run dev` starts development server
- [ ] TailwindCSS classes work in components
- [ ] React Router is configured
- [ ] Vite proxy configured for /api routes
- [ ] Docker build succeeds

## Constraints

- Use Vite (not Create React App)
- Use TailwindCSS (not CSS modules or styled-components)
- TypeScript strict mode enabled
- Do NOT implement actual components yet
