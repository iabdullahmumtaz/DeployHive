import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../store';
const router = express.Router();

router.get('/', (_req, res) => {
  res.json(store.getProjects());
});

router.get('/:id', (req, res) => {
  const project = store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/', (req, res) => {
  const { name, repoUrl, branch, envVars, port, hostPort } = req.body;
  if (!name || !repoUrl) {
    return res.status(400).json({ error: 'name and repoUrl are required' });
  }

  const project = {
    id: uuidv4(),
    name,
    repoUrl,
    branch: branch || 'main',
    envVars: envVars || {},
    port: port || 3000,
    hostPort: hostPort || 8080,
    status: 'idle',
    createdAt: new Date().toISOString(),
    lastDeployedAt: null,
  };

  store.saveProject(project);
  res.status(201).json(project);
});

router.put('/:id', (req, res) => {
  const project = store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { name, repoUrl, branch, envVars, port, hostPort } = req.body;
  if (name) project.name = name;
  if (repoUrl) project.repoUrl = repoUrl;
  if (branch) project.branch = branch;
  if (envVars) project.envVars = envVars;
  if (port) project.port = port;
  if (hostPort) project.hostPort = hostPort;

  store.saveProject(project);
  res.json(project);
});

router.delete('/:id', (req, res) => {
  store.deleteProject(req.params.id);
  res.json({ message: 'Project deleted' });
});

export default router;
