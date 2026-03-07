import { Routes, Route, NavLink } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Rocket, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-hive-panel border-r border-hive-border flex flex-col">
        <div className="p-5 border-b border-hive-border">
          <div className="flex items-center gap-2">
            <Hexagon className="w-8 h-8 text-hive-accent" />
            <div>
              <h1 className="font-bold">DeployHive</h1>
              <p className="text-xs text-hive-muted">Deploy Panel</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink to="/new" className={navClass}>
            <Rocket className="w-4 h-4" /> New Project
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            <Settings className="w-4 h-4" /> Settings
          </NavLink>
        </nav>
        <div className="p-4 text-xs text-hive-muted border-t border-hive-border">
          DeployHive v1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewProject />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
    isActive ? 'bg-hive-accent/15 text-hive-accentHover' : 'text-hive-muted hover:text-white hover:bg-hive-border/50'
  }`;
}
