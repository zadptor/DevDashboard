import React from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  GitPullRequest,
  Box,
  Clock,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Search,
  Bell,
  GitMerge,
  GitCommit,
  Clock3,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  return (
    <div className="flex h-[800px] w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg">DevCommand</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
          <NavItem icon={<CheckCircle2 size={18} />} label="Tasks & Jira" />
          <NavItem icon={<Calendar size={18} />} label="Timeline" />
          <NavItem icon={<GitPullRequest size={18} />} label="Pull Requests" badge="7" />
          <NavItem icon={<Box size={18} />} label="Planning Poker" />
          <NavItem icon={<Clock size={18} />} label="SAP CATS" />
        </div>

        <div className="p-4 border-t border-slate-800/50">
          <NavItem icon={<Settings size={18} />} label="Settings" />
          <div className="mt-4 flex items-center gap-3 px-3 py-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer">
            <Avatar className="w-9 h-9 border border-slate-800">
              <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=f1f5f9" />
              <AvatarFallback className="bg-slate-800 text-slate-300">AK</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium text-slate-200 truncate">Alex K.</span>
              <span className="text-xs text-slate-500 truncate">Senior Engineer</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20 rounded-full px-5">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* AI Brief */}
            <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-5 border border-violet-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-violet-600 border border-violet-100">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  Daily Brief <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-[10px] px-1.5 py-0">AI</Badge>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You have <strong className="text-slate-900 font-medium">3 blocked items</strong> holding up the 2.3.1 release. Review PR #847 first, then check the staging DB timeout issue.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-5">
              <StatCard title="Open Tasks" value="14" icon={<CheckCircle2 />} trend="-2" color="blue" />
              <StatCard title="Active PRs" value="7" icon={<GitPullRequest />} trend="+3" color="violet" />
              <StatCard title="Hours Logged" value="32.5h" icon={<Clock />} trend="+4.1h" color="emerald" />
              <StatCard title="Blocked" value="3" icon={<Box />} trend="+1" color="rose" alert />
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Tasks List */}
              <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Active Tasks</h2>
                  <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">View all</Button>
                </div>
                
                <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    <TaskItem 
                      title="Implement auth flow redesign" 
                      status="In Progress" 
                      priority="High"
                      progress={65}
                      assignee="AK"
                    />
                    <TaskItem 
                      title="Fix staging DB timeout" 
                      status="Review" 
                      priority="Urgent"
                      progress={90}
                      assignee="SJ"
                    />
                    <TaskItem 
                      title="Update API docs" 
                      status="In Progress" 
                      priority="Medium"
                      progress={30}
                      assignee="AK"
                    />
                    <TaskItem 
                      title="Review PR #847" 
                      status="To Do" 
                      priority="High"
                      progress={0}
                      assignee="AK"
                    />
                    <TaskItem 
                      title="Deploy v2.3.1 to prod" 
                      status="Blocked" 
                      priority="Urgent"
                      progress={80}
                      assignee="MJ"
                    />
                  </div>
                </Card>
              </div>

              {/* PRs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Recent PRs</h2>
                  <Button variant="ghost" size="sm" className="text-slate-500">View all</Button>
                </div>

                <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    <PRItem 
                      title="feat/auth-redesign"
                      repo="core-api"
                      status="Review"
                      time="2h ago"
                    />
                    <PRItem 
                      title="fix/db-timeout-staging"
                      repo="infrastructure"
                      status="Open"
                      time="4h ago"
                    />
                    <PRItem 
                      title="docs/api-v3"
                      repo="core-api"
                      status="Merged"
                      time="1d ago"
                    />
                    <PRItem 
                      title="chore/dependency-updates"
                      repo="frontend-app"
                      status="Merged"
                      time="2d ago"
                    />
                  </div>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, active, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
      active 
        ? "bg-violet-600/10 text-violet-400 font-medium" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, alert }: { title: string; value: string; icon: React.ReactNode; trend: string; color: "blue" | "violet" | "emerald" | "rose"; alert?: boolean }) {
  const isPositive = trend.startsWith("+");
  const trendColor = alert ? "text-rose-600" : isPositive ? "text-emerald-600" : "text-slate-500";
  const trendBg = alert ? "bg-rose-50" : isPositive ? "bg-emerald-50" : "bg-slate-100";
  
  const iconColors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <Card className="shadow-sm border-slate-200/60">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconColors[color]}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${trendBg} ${trendColor}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.replace(/[+-]/, '')}
          </div>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-slate-500">{title}</h4>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ title, status, priority, progress, assignee }: { title: string; status: string; priority: string; progress: number; assignee: string }) {
  const statusColors: Record<string, string> = {
    "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
    "Review": "bg-amber-50 text-amber-700 border-amber-200",
    "To Do": "bg-slate-100 text-slate-600 border-slate-200",
    "Blocked": "bg-rose-50 text-rose-700 border-rose-200",
  };

  const priorityColors: Record<string, string> = {
    "Urgent": "text-rose-600 bg-rose-50",
    "High": "text-orange-600 bg-orange-50",
    "Medium": "text-blue-600 bg-blue-50",
  };

  return (
    <div className="p-4 hover:bg-slate-50/80 transition-colors flex items-center gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="text-sm font-medium text-slate-900 truncate">{title}</h4>
          <Badge variant="outline" className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0 ${priorityColors[priority] || "text-slate-600 bg-slate-50"}`}>
            {priority}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 w-32">
            <Progress value={progress} className="h-1.5 bg-slate-100" />
            <span className="w-8 text-right font-medium">{progress}%</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColors[status] || statusColors["To Do"]}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8 border border-white shadow-sm">
          <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-medium">{assignee}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PRItem({ title, repo, status, time }: { title: string; repo: string; status: string; time: string }) {
  const statusIcons: Record<string, React.ReactNode> = {
    "Open": <GitPullRequest className="w-4 h-4 text-emerald-500" />,
    "Merged": <GitMerge className="w-4 h-4 text-violet-500" />,
    "Review": <GitCommit className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3">
      <div className="mt-0.5 bg-white p-1 rounded border border-slate-100 shadow-sm">
        {statusIcons[status]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-900 truncate">{title}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">{repo}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{time}</span>
        </div>
      </div>
    </div>
  );
}
