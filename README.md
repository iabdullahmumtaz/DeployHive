# DeployHive

DevOps deployment panel for Git-based deploys, environment variables, log streaming, and Docker container management — inspired by Vercel.

## Features

- Deploy from public Git repository URLs
- Per-project environment variable management
- Real-time deployment log streaming
- Dockerfile detection with Dockerode builds
- Deployment history with status tracking
- Multi-page dashboard: projects, new project, settings, detail

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Language | **TypeScript** (strict)                         |
| Backend  | Node.js, Express, Dockerode, tsx                |
| Git      | simple-git                                      |
| Storage  | JSON file store                                 |
| Frontend | React, Vite, React Router, TypeScript           |
| Styling  | Tailwind CSS                                    |

## Ports

| Service | Port |
|---------|------|
| UI      | 5012 |
| API     | 6012 |

## Quick Start

```bash
cp .env.example .env
npm run install:all
npm run dev
```

- **UI:** http://localhost:5012
- **API:** http://localhost:6012

## Project Structure

```
DeployHive/
├── src/
│   ├── server/       # API, deploy pipeline, routes
│   └── client/       # React dashboard
├── deployments/
├── repos/
└── package.json
```

## License

MIT
