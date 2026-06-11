/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, GitPullRequest, FileSpreadsheet,
  Settings, CalendarDays, Layers, Box,
} from 'lucide-react';
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
    return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Loading Dev Command...</div>;
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

  if (!user && !isPublicPokerRoute) {
    return <LoginView onDemoLogin={onDemoLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      {user && !isPublicPokerRoute && (
        <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 z-10">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/50 flex-shrink-0">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-base">DevCommand</span>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
            <NavItem to="/"         icon={<LayoutDashboard size={17} />} label="Overview" />
            <NavItem to="/tasks"    icon={<CheckSquare size={17} />}     label="Tasks & Jira" />
            <NavItem to="/timeline" icon={<CalendarDays size={17} />}    label="Timeline" />
            <NavItem to="/prs"      icon={<GitPullRequest size={17} />}  label="Pull Requests" />
            <NavItem to="/poker"    icon={<Layers size={17} />}          label="Planning Poker" />
            <NavItem to="/reports"  icon={<FileSpreadsheet size={17} />} label="SAP CATS" />
          </div>

          {/* Bottom */}
          <div className="p-3 border-t border-slate-800/50 space-y-0.5 flex-shrink-0">
            <NavItem to="/settings" icon={<Settings size={17} />} label="Settings" />
            <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg hover:bg-slate-900/50 transition-colors cursor-pointer">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs border border-slate-700 flex-shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-200 truncate leading-tight">
                  {user.displayName || 'Developer'}
                </span>
                <span className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                  {user.email === 'demo@devcommand.app' ? 'Demo Mode' : 'Online'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Routes>
          <Route path="/"              element={<DashboardHome />} />
          <Route path="/tasks"         element={<TasksView />} />
          <Route path="/timeline"      element={<TimelineView />} />
          <Route path="/prs"           element={<PullRequestsView />} />
          <Route path="/poker"         element={<PokerDashboard />} />
          <Route path="/poker/room/:roomId" element={<PokerRoom />} />
          <Route path="/reports"       element={<ReportsView />} />
          <Route path="/settings"      element={<SettingsView />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm",
        isActive
          ? "bg-violet-600/10 text-violet-400 font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}
