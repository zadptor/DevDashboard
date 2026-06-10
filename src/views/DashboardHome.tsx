import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { CheckCircle2, GitPullRequest, Clock, AlertCircle, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useDashboardStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { isToday, differenceInDays } from 'date-fns';
import { cn } from '../App';

export default function DashboardHome() {
  const { tasks } = useDashboardStore();
  const navigate = useNavigate();

  const openTasks = tasks.filter(t => t.status !== 'Done');
  const completedTasksThisWeek = tasks.filter(t => t.status === 'Done'); // Approximation for this week
  const hoursLoggedThisWeek = completedTasksThisWeek.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const blockedItemsCount = tasks.filter(t => t.status === 'Blocked').length;

  const todayTasks = tasks.filter(t => t.status !== 'Done' && (!t.dueDate || isToday(new Date(t.dueDate))));
  const itemsDueSoon = tasks.filter(t => t.status !== 'Done' && t.dueDate && differenceInDays(new Date(t.dueDate), new Date()) <= 3).length;
  const prsNeedReview = 2; // For demo purpose, we'll keep this hardcoded unless we have PR assignees. The prompt says 'Today: 2 PRs need review'.
  
  const dailyBrief = `Today: ${prsNeedReview} PRs need review, ${blockedItemsCount} blocked task, ${hoursLoggedThisWeek}h logged this week, ${itemsDueSoon} item due soon.`;

  return (
    <div className="p-8 pb-16 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">Welcome back. Here's your productivity summary for today.</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">Daily Dev Brief</h3>
            <p className="text-sm text-muted-foreground">"{dailyBrief}"</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Tooltip>
          <TooltipTrigger className="block w-full text-left bg-transparent border-none p-0 cursor-pointer" onClick={() => navigate('/tasks')}>
            <StatsCard title="Open Tasks" value={openTasks.length.toString()} icon={<CheckCircle2 className="w-5 h-5 text-muted-foreground" />} className="hover:border-primary/50 transition-colors shadow-sm" />
          </TooltipTrigger>
          <TooltipContent>
            <p>View all your open tasks</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger className="block w-full text-left bg-transparent border-none p-0 cursor-pointer" onClick={() => navigate('/prs')}>
            <StatsCard title="Active PRs" value="4" icon={<GitPullRequest className="w-5 h-5 text-muted-foreground" />} className="hover:border-primary/50 transition-colors shadow-sm" />
          </TooltipTrigger>
          <TooltipContent>
            <p>View pending pull requests</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger className="block w-full text-left bg-transparent border-none p-0 cursor-pointer" onClick={() => navigate('/reports')}>
            <StatsCard title="Hours Logged" value={hoursLoggedThisWeek.toString()} icon={<Clock className="w-5 h-5 text-muted-foreground" />} subtitle="Total completed" className="hover:border-primary/50 transition-colors shadow-sm" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Go to SAP CATS reports</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger className="block w-full text-left bg-transparent border-none p-0 cursor-pointer" onClick={() => navigate('/timeline')}>
            <StatsCard title="Blocked" value={blockedItemsCount.toString()} icon={<AlertCircle className="w-5 h-5 text-destructive" />} subtitle="Needs attention" className="hover:border-destructive/50 transition-colors shadow-sm" />
          </TooltipTrigger>
          <TooltipContent>
            <p>View timeline and blocked tasks</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <CardTitle className="text-base font-semibold">Recent Pull Requests</CardTitle>
            <Link to="/prs" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                   <GitPullRequest className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">Feature: unified dashboard (#42)</p>
                   <p className="text-xs text-muted-foreground mt-0.5">Updated 2h ago</p>
                 </div>
                 <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider shrink-0">Open</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <CardTitle className="text-base font-semibold">Today's Priority Tasks</CardTitle>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {todayTasks.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No tasks due today.</div>}
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                   <div className="flex items-center space-x-4 min-w-0">
                     <div className={`shrink-0 w-2 h-2 rounded-full ${task.priority === 'Urgent' ? 'bg-destructive' : 'bg-primary'}`} />
                     <div className="min-w-0">
                       <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors truncate">{task.title}</p>
                       <div className="flex items-center space-x-2 mt-1.5">
                         <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{task.project}</span>
                         <span className="text-[10px] text-muted-foreground/50">•</span>
                         <span className="text-xs text-muted-foreground">{task.priority} Priority</span>
                       </div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle, className }: { title: string, value: string, icon: React.ReactNode, subtitle?: string, className?: string }) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-2 font-medium">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
