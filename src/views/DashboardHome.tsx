import React from 'react';
import {
  CheckCircle2, GitPullRequest, Clock, AlertCircle,
  ArrowUpRight, ArrowDownRight, Bell, Plus, Search,
  MoreHorizontal, GitMerge, GitCommit, Clock3, Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useDashboardStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { cn } from '../App';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import type { Task } from '../types';

export default function DashboardHome() {
  const { tasks, config } = useDashboardStore();
  const navigate = useNavigate();

  const openTasks    = tasks.filter(t => t.status !== 'Done');
  const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
  const hoursLogged  = tasks.filter(t => t.status === 'Done').reduce((s, t) => s + (t.actualHours || 0), 0);
  const itemsDueSoon = tasks.filter(t => t.status !== 'Done' && t.dueDate && differenceInDays(new Date(t.dueDate), new Date()) <= 3).length;

  const { data: prs } = useQuery({
    queryKey: ['dashboard-prs', config.githubToken],
    enabled: !!config.githubToken,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
      if (config.githubToken) headers['x-github-token'] = config.githubToken;
      const res = await axios.get('/api/github/repos/shadcn-ui/ui/pulls?state=open&per_page=4', { headers });
      return res.data as any[];
    },
  });

  const activeTasks = openTasks.slice(0, 5);

  const dailyBriefText = blockedCount > 0
    ? `You have ${blockedCount} blocked item${blockedCount > 1 ? 's' : ''} needing attention. ${itemsDueSoon > 0 ? `${itemsDueSoon} task${itemsDueSoon > 1 ? 's' : ''} due soon.` : 'Check your task list for details.'}`
    : openTasks.length === 0
      ? "All clear! No open tasks. Add some tasks or sync from Jira to get started."
      : `${openTasks.length} open task${openTasks.length > 1 ? 's' : ''}. ${hoursLogged > 0 ? `${hoursLogged}h logged so far.` : ''} Good progress!`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-8 flex-shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative group hidden md:flex">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-violet-500" />
            <input
              type="text"
              placeholder="Search anything..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm w-60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="w-5 h-5" />
            {blockedCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20 rounded-full px-5 gap-2"
            onClick={() => navigate('/tasks')}
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-7">

          {/* AI Daily Brief */}
          <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent dark:from-violet-500/15 dark:via-violet-900/5 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/50 flex items-start gap-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                Daily Brief
                <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 text-[10px] px-1.5 py-0 font-medium">AI</Badge>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{dailyBriefText}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Tooltip>
              <TooltipTrigger render={<div role="button" tabIndex={0} onClick={() => navigate('/tasks')} onKeyDown={e => e.key === 'Enter' && navigate('/tasks')} className="cursor-pointer w-full text-left outline-none" />}>
                <StatCard title="Open Tasks" value={openTasks.length.toString()} icon={<CheckCircle2 />} trend={openTasks.length > 0 ? `-${Math.min(openTasks.length, 2)}` : "0"} color="blue" />
              </TooltipTrigger>
              <TooltipContent>View all open tasks</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<div role="button" tabIndex={0} onClick={() => navigate('/prs')} onKeyDown={e => e.key === 'Enter' && navigate('/prs')} className="cursor-pointer w-full text-left outline-none" />}>
                <StatCard title="Active PRs" value={prs ? prs.length.toString() : "—"} icon={<GitPullRequest />} trend={prs ? `+${Math.min(prs.length, 3)}` : "0"} color="violet" />
              </TooltipTrigger>
              <TooltipContent>View pull requests</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<div role="button" tabIndex={0} onClick={() => navigate('/reports')} onKeyDown={e => e.key === 'Enter' && navigate('/reports')} className="cursor-pointer w-full text-left outline-none" />}>
                <StatCard title="Hours Logged" value={hoursLogged > 0 ? `${hoursLogged}h` : "0h"} icon={<Clock />} trend={hoursLogged > 0 ? `+${Math.min(hoursLogged, 4).toFixed(1)}h` : "0h"} color="emerald" />
              </TooltipTrigger>
              <TooltipContent>Go to SAP CATS reports</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<div role="button" tabIndex={0} onClick={() => navigate('/tasks')} onKeyDown={e => e.key === 'Enter' && navigate('/tasks')} className="cursor-pointer w-full text-left outline-none" />}>
                <StatCard title="Blocked" value={blockedCount.toString()} icon={<AlertCircle />} trend={blockedCount > 0 ? `+${blockedCount}` : "0"} color="rose" alert={blockedCount > 0} />
              </TooltipTrigger>
              <TooltipContent>View blocked tasks</TooltipContent>
            </Tooltip>
          </div>

          {/* Tasks + PRs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {/* Active Tasks */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Active Tasks</h2>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50 h-8 text-xs">View all</Button>
                </Link>
              </div>
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900">
                {activeTasks.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No active tasks. Add tasks or sync from Jira.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                )}
              </Card>
            </div>

            {/* Recent PRs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Recent PRs</h2>
                <Link to="/prs">
                  <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 h-8 text-xs">View all</Button>
                </Link>
              </div>
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900">
                {!config.githubToken ? (
                  <div className="p-6 text-center space-y-1">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Configure GitHub token in</p>
                    <Link to="/settings" className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium block">Settings</Link>
                    <p className="text-xs text-slate-400 dark:text-slate-500">to see pull requests.</p>
                  </div>
                ) : !prs ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-4 flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : prs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">No open PRs right now.</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {prs.slice(0, 4).map((pr: any) => (
                      <PRRow
                        key={pr.id}
                        title={pr.head?.ref || pr.title}
                        repo={pr.base?.repo?.name || 'repo'}
                        status={pr.draft ? 'Draft' : 'Open'}
                        time={formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })}
                        url={pr.html_url}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ title, value, icon, trend, color, alert }: {
  title: string; value: string; icon: React.ReactNode;
  trend: string; color: 'blue' | 'violet' | 'emerald' | 'rose'; alert?: boolean;
}) {
  const isPositive = trend.startsWith('+');
  const trendColor = alert ? 'text-rose-600 dark:text-rose-400' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400';
  const trendBg    = alert ? 'bg-rose-50 dark:bg-rose-950/50' : isPositive ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-slate-100 dark:bg-slate-800';
  const iconStyle  = {
    blue:    'bg-blue-50    dark:bg-blue-950/50   text-blue-600    dark:text-blue-400    border-blue-100    dark:border-blue-900/50',
    violet:  'bg-violet-50  dark:bg-violet-950/50 text-violet-600  dark:text-violet-400  border-violet-100  dark:border-violet-900/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    rose:    'bg-rose-50    dark:bg-rose-950/50   text-rose-600    dark:text-rose-400    border-rose-100    dark:border-rose-900/50',
  }[color];

  return (
    <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 w-full">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', iconStyle)}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
          </div>
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md', trendBg, trendColor)}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.replace(/[+\-]/, '')}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }: { task: Task; key?: React.Key }) {
  const progress = task.estimatedHours > 0
    ? Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100))
    : task.status === 'Done' ? 100 : task.status === 'Review' ? 80 : task.status === 'In Progress' ? 50 : task.status === 'Blocked' ? 40 : 0;

  const statusStyle: Record<string, string> = {
    'In Progress': 'bg-blue-50    dark:bg-blue-950/50   text-blue-700    dark:text-blue-300   border-blue-200    dark:border-blue-800',
    'Review':      'bg-amber-50   dark:bg-amber-950/50  text-amber-700   dark:text-amber-300  border-amber-200   dark:border-amber-800',
    'To Do':       'bg-slate-100  dark:bg-slate-800     text-slate-600   dark:text-slate-400  border-slate-200   dark:border-slate-700',
    'Blocked':     'bg-rose-50    dark:bg-rose-950/50   text-rose-700    dark:text-rose-300   border-rose-200    dark:border-rose-800',
    'Done':        'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  const priorityStyle: Record<string, string> = {
    'Urgent': 'text-rose-600    dark:text-rose-400   bg-rose-50    dark:bg-rose-950/50',
    'High':   'text-orange-600  dark:text-orange-400 bg-orange-50  dark:bg-orange-950/50',
    'Medium': 'text-blue-600    dark:text-blue-400   bg-blue-50    dark:bg-blue-950/50',
    'Low':    'text-slate-500   dark:text-slate-400  bg-slate-100  dark:bg-slate-800',
  };

  const initials = task.project
    ? task.project.slice(0, 2).toUpperCase()
    : task.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{task.title}</span>
          <Badge variant="outline" className={cn('text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0 border-0', priorityStyle[task.priority] || 'text-slate-600 bg-slate-100')}>
            {task.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 w-36">
            <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-800 flex-1" />
            <span className="w-8 text-right font-medium text-slate-400 dark:text-slate-500">{progress}%</span>
          </div>
          <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-medium', statusStyle[task.status] || statusStyle['To Do'])}>
            {task.status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 border border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-medium">
          {initials}
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PRRow({ title, repo, status, time, url }: { title: string; repo: string; status: string; time: string; url?: string; key?: React.Key }) {
  const statusIcon: Record<string, React.ReactNode> = {
    'Open':   <GitPullRequest className="w-4 h-4 text-emerald-500" />,
    'Merged': <GitMerge className="w-4 h-4 text-violet-500 dark:text-violet-400" />,
    'Review': <GitCommit className="w-4 h-4 text-amber-500" />,
    'Draft':  <GitPullRequest className="w-4 h-4 text-slate-400 dark:text-slate-500" />,
  };

  const inner = (
    <div className="px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3">
      <div className="mt-0.5 bg-white dark:bg-slate-800 p-1 rounded border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        {statusIcon[status] ?? statusIcon['Open']}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{title}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{repo}</span>
          <span>•</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock3 className="w-3 h-3" />{time}
          </span>
        </div>
      </div>
    </div>
  );

  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <div>{inner}</div>;
}
