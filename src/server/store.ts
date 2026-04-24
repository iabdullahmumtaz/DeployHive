import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Project, Deployment, StoreData } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../deployments/data.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ projects: [], deployments: [] }, null, 2));
  }
}

function readData(): StoreData {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as StoreData;
}

function writeData(data: StoreData): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getProjects() {
  return readData().projects;
}

function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

function saveProject(project: Project): Project {
  const data = readData();
  const idx = data.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) data.projects[idx] = project;
  else data.projects.push(project);
  writeData(data);
  return project;
}

function deleteProject(id: string): void {
  const data = readData();
  data.projects = data.projects.filter((p) => p.id !== id);
  data.deployments = data.deployments.filter((d) => d.projectId !== id);
  writeData(data);
}

function getDeployments(projectId?: string): Deployment[] {
  const deps = readData().deployments;
  return projectId ? deps.filter((d) => d.projectId === projectId) : deps;
}

function getDeployment(id: string): Deployment | undefined {
  return readData().deployments.find((d) => d.id === id);
}

function saveDeployment(deployment: Deployment): Deployment {
  const data = readData();
  const idx = data.deployments.findIndex((d) => d.id === deployment.id);
  if (idx >= 0) data.deployments[idx] = deployment;
  else data.deployments.unshift(deployment);
  writeData(data);
  return deployment;
}

function appendLog(deploymentId: string, line: string): void {
  const dep = getDeployment(deploymentId);
  if (!dep) return;
  dep.logs = dep.logs || [];
  dep.logs.push({ timestamp: new Date().toISOString(), message: line });
  saveDeployment(dep);
}

export {
  getProjects,
  getProject,
  saveProject,
  deleteProject,
  getDeployments,
  getDeployment,
  saveDeployment,
  appendLog,
};

export default {
  getProjects,
  getProject,
  saveProject,
  deleteProject,
  getDeployments,
  getDeployment,
  saveDeployment,
  appendLog,
};
