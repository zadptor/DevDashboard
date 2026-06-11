/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, GitPullRequest, FileSpreadsheet, Settings, CalendarDays, Layers } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from 'firebase/auth';

import { subscribeToAuthChanges } from './lib/auth';
import { useDashboardStore } from './store';
import DashboardHome from './views/DashboardHome';
import TasksView from './views/TasksView';
import PullRequestsView from './views/PullRequestsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import TimelineView from './views/TimelineView';
import PokerDashboard from './views/PokerDashboard';
import PokerRoom from './views/PokerRoom';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const queryClient = new QueryClient();

import { TooltipProvider } from '../components/ui/tooltip';

const DEMO_USER = {
  uid: 'demo',
  email: 'demo@devcommand.app',
  displayName: 'Demo User',
  photoURL: null,
  emailVerified: true,
} as unknown as User;

export default function App() {
  const [user, setUser] = useState<User | null>(() =>
    localStorage.getItem('devMode') === 'true' ? DEMO_USER : null
  );
  const [loading, setLoading] = useState(true);
  const { config } = useDashboardStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'jarvis');

    if (config.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(config.theme || 'light');
    }
  }, [config.theme]);

  useEffect(() => {
    if (localStorage.getItem('devMode') === 'true') {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDemoLogin = () => {
    localStorage.setItem('devMode', 'true');
    setUser(DEMO_USER);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Loading Dev Command...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent user={user} onDemoLogin={handleDemoLogin} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent({ user, onDemoLogin }: { user: User | null; onDemoLogin: () => void }) {
  const location = useLocation();
  const isPublicPokerRoute = location.pathname.startsWith('/poker/room/');

  // If there's no user, and this is not a public shared poker room URL, redirect to Login
  if (!user && !isPublicPokerRoute) {
    return <LoginView onDemoLogin={onDemoLogin} />;
  }

  return (
    <div className="flex h-screen font-sans text-foreground bg-transparent">
      {/* Sidebar: only show if we have an authenticated user AND we are NOT inside a poker room session (full screen immersion) */}
      {user && !isPublicPokerRoute && (
        <aside className="w-64 border-r border-border bg-card flex flex-col z-10">
          <div className="p-6 pb-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground mr-2.5 shadow-sm">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              Dev Workspace
            </h1>
          </div>
          
          <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Work</div>
              <nav className="space-y-1">
                <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4 mr-3" />} label="Overview" />
                <NavItem to="/tasks" icon={<CheckSquare className="w-4 h-4 mr-3" />} label="Tasks & Jira" />
                <NavItem to="/timeline" icon={<CalendarDays className="w-4 h-4 mr-3" />} label="Timeline" />
              </nav>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Collaboration</div>
              <nav className="space-y-1">
                <NavItem to="/prs" icon={<GitPullRequest className="w-4 h-4 mr-3" />} label="Pull Requests" />
                <NavItem to="/poker" icon={<Layers className="w-4 h-4 mr-3" />} label="Planning Poker" />
              </nav>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Reporting</div>
              <nav className="space-y-1">
                <NavItem to="/reports" icon={<FileSpreadsheet className="w-4 h-4 mr-3" />} label="SAP CATS" />
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <NavItem to="/settings" icon={<Settings className="w-4 h-4 mr-3" />} label="Settings" />
            <div className="flex items-center space-x-3 px-2 py-3 mt-4 mt-auto">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-background border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-background border border-border">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-sm font-semibold text-foreground leading-none truncate">{user.displayName || 'Developer'}</span>
                <span className="text-xs text-muted-foreground mt-1.5 leading-none">Status: Online</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full relative bg-background">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/timeline" element={<TimelineView />} />
          <Route path="/prs" element={<PullRequestsView />} />
          <Route path="/poker" element={<PokerDashboard />} />
          <Route path="/poker/room/:roomId" element={<PokerRoom />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-muted text-foreground" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

