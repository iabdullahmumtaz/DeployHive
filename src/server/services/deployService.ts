import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import store from '../store';
const docker = new Docker(process.env.DOCKER_HOST ? { socketPath: process.env.DOCKER_HOST } : undefined);

async function isDockerAvailable() {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

async function runDeploy(deploymentId: string, project: import('../types').Project, reposDir: string) {
  const deployment = store.getDeployment(deploymentId);
  if (!deployment) return;

  const log = (msg: string) => store.appendLog(deploymentId, msg);

  try {
    deployment.status = 'building';
    store.saveDeployment(deployment);
    log(`Starting deployment for ${project.name}`);

    const repoPath = path.join(reposDir, project.id);
    if (fs.existsSync(repoPath)) {
      log('Pulling latest changes...');
      const git = simpleGit(repoPath);
      await git.pull('origin', project.branch || 'main').catch(async () => {
        log('Pull failed, recloning...');
        fs.rmSync(repoPath, { recursive: true, force: true });
      });
    }

    if (!fs.existsSync(repoPath)) {
      log(`Cloning ${project.repoUrl}...`);
      fs.mkdirSync(reposDir, { recursive: true });
      await simpleGit().clone(project.repoUrl, repoPath, ['--depth', '1', '--branch', project.branch || 'main']);
      log('Clone complete');
    }

    const dockerAvailable = await isDockerAvailable();
    const hasDockerfile = fs.existsSync(path.join(repoPath, 'Dockerfile'));

    if (dockerAvailable && hasDockerfile) {
      log('Dockerfile detected — building image...');
      const imageTag = `deployhive/${project.id}:${deploymentId.slice(0, 8)}`;
      const containerName = `deployhive-${project.id}`;

      await new Promise((resolve, reject) => {
        const build = spawn('docker', ['build', '-t', imageTag, repoPath], { shell: true });
        build.stdout.on('data', (d) => log(d.toString().trim()));
        build.stderr.on('data', (d) => log(d.toString().trim()));
        build.on('close', (code) => (code === 0 ? resolve(undefined) : reject(new Error(`Build failed with code ${code}`))));
      });

      log('Stopping previous container if running...');
      try {
        const old = docker.getContainer(containerName);
        await old.stop().catch(() => {});
        await old.remove().catch(() => {});
      } catch {
        /* no existing container */
      }

      log('Starting container...');
      const envArr = Object.entries(project.envVars || {}).map(([k, v]) => `${k}=${v}`);
      const port = project.port || 3000;

      const container = await docker.createContainer({
        name: containerName,
        Image: imageTag,
        Env: envArr,
        ExposedPorts: { [`${port}/tcp`]: {} },
        HostConfig: {
          PortBindings: { [`${port}/tcp`]: [{ HostPort: String(project.hostPort || port) }] },
          RestartPolicy: { Name: 'unless-stopped' },
        },
      });

      await container.start();
      deployment.containerId = container.id;
      deployment.url = `http://localhost:${project.hostPort || port}`;
      log(`Container started — ${deployment.url}`);
    } else if (fs.existsSync(path.join(repoPath, 'package.json'))) {
      log('Node.js project detected — installing dependencies...');
      execSync('npm install --omit=dev', { cwd: repoPath, stdio: 'pipe' });
      log('Dependencies installed');
      log('Build simulation complete (no Dockerfile — deploy marked ready)');
      deployment.url = project.repoUrl;
    } else {
      log('Repository cloned successfully');
      deployment.url = project.repoUrl;
    }

    deployment.status = 'ready';
    deployment.completedAt = new Date().toISOString();
    store.saveDeployment(deployment);

    project.lastDeployedAt = deployment.completedAt;
    project.status = 'ready';
    store.saveProject(project);
    log('Deployment successful!');
  } catch (err) {
    log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    deployment.status = 'failed';
    deployment.completedAt = new Date().toISOString();
    store.saveDeployment(deployment);
    project.status = 'failed';
    store.saveProject(project);
  }
}

function createDeployment(projectId: string, reposDir: string) {
  const project = store.getProject(projectId);
  if (!project) throw new Error('Project not found');
  const deployment = {
    id: uuidv4(),
    projectId,
    status: 'queued',
    logs: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    containerId: null,
    url: null,
  };

  store.saveDeployment(deployment);
  project.status = 'deploying';
  store.saveProject(project);

  setImmediate(() => runDeploy(deployment.id, project, reposDir));
  return deployment;
}

export { createDeployment, isDockerAvailable };
