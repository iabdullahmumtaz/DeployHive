import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from 'fs';
import projectRoutes from './routes/projects';
import deploymentRoutes from './routes/deployments';
const app = express();
const PORT = process.env.PORT || 6012;

const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR || 'deployments';
const REPOS_DIR = process.env.REPOS_DIR || 'repos';

[DEPLOYMENTS_DIR, REPOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5012' }));
app.use(express.json());

app.locals.deploymentsDir = DEPLOYMENTS_DIR;
app.locals.reposDir = REPOS_DIR;

app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DeployHive' });
});

const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => console.log(`DeployHive running on port ${PORT}`));
