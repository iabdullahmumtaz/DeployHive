import express from 'express';
import store from '../store';
import {  createDeployment, isDockerAvailable  } from '../services/deployService';
const router = express.Router();

router.get('/', (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
  res.json(store.getDeployments(projectId));
});

router.get('/docker-status', async (_req, res) => {
  const available = await isDockerAvailable();
  res.json({ available });
});

router.get('/:id', (req, res) => {
  const deployment = store.getDeployment(req.params.id);
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
  res.json(deployment);
});

router.post('/', (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    const reposDir = req.app.locals.reposDir;
    const deployment = createDeployment(projectId, reposDir);
    res.status(201).json(deployment);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Deploy failed' });
  }
});

export default router;
