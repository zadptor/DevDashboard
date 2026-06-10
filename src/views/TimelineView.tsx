import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { useDashboardStore } from '../store';
import { Calendar as CalendarIcon, Clock, AlertTriangle, Target, Filter } from 'lucide-react';
import { format, addDays, isPast, isToday, isSameDay, startOfDay } from 'date-fns';

export default function TimelineView() {
  const { tasks } = useDashboardStore();
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sprintDays, setSprintDays] = useState(14);
  
  const selectedDate = startOfDay(new Date(selectedDateStr));
  const isTodaySelected = isSameDay(selectedDate, new Date());
  
  // Future dates not allowed
  const maxDate = format(new Date(), 'yyyy-MM-dd');

  const getUrgencyColor = (dueDate: Date | undefined) => {
    if (!dueDate) return 'bg-muted text-foreground dark:text-muted-foreground';
    if (isPast(dueDate) && !isToday(dueDate)) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
    if (isToday(dueDate)) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const relevantTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskCreated = startOfDay(new Date(task.createdAt));
      const taskUpdated = startOfDay(new Date(task.updatedAt));
      const taskCompleted = task.completedDate ? startOfDay(new Date(task.completedDate)) : null;
      const taskDue = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

      if (isTodaySelected) {
        // Today view: show active items and items created/completed/due today
        return task.status !== 'Done' || 
               (taskCompleted && isSameDay(taskCompleted, selectedDate)) ||
               (taskDue && isSameDay(taskDue, selectedDate));
      } else {
        // Historical view: items created, updated, or completed on that date
        return isSameDay(taskCreated, selectedDate) || 
               isSameDay(taskUpdated, selectedDate) || 
               (taskCompleted && isSameDay(taskCompleted, selectedDate)) ||
               (taskDue && isSameDay(taskDue, selectedDate));
      }
    }).sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [tasks, selectedDate, isTodaySelected]);

  // Sprint deadlines
  const sprintEndDate = addDays(selectedDate, sprintDays);
  const sprintDeadlineTasks = tasks.filter(t => 
    t.dueDate && 
    new Date(t.dueDate) >= selectedDate && 
    new Date(t.dueDate) <= sprintEndDate && 
    t.status !== 'Done'
  );

  // Daily work workload (In Progress today)
  const workingHoursTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Review');
  const totalWorkingHours = isTodaySelected ? workingHoursTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0) : relevantTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  
  // Upcoming Tasks (Planned, not yet working, not done)
  const upcomingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'Blocked');

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Daily Timeline</h2>
          <p className="text-muted-foreground mt-1">Daily workflow tracking with history and sprint deadlines.</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-card border border-border p-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Select Date</span>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <input 
                type="date" 
                max={maxDate}
                value={selectedDateStr}
                onChange={e => {
                  if(e.target.value) setSelectedDateStr(e.target.value)
                }}
                className="bg-transparent text-sm border-none focus:outline-none focus:ring-0 text-foreground cursor-pointer"
              />
            </div>
          </div>
          
          <div className="h-8 w-px bg-border"></div>
          
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Sprint Length (Days)</span>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <input 
                type="number" 
                min="1"
                max="90"
                value={sprintDays}
                onChange={e => setSprintDays(parseInt(e.target.value) || 14)}
                className="bg-transparent text-sm w-16 border-none focus:outline-none focus:ring-0 text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 shrink-0">
               <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Total Working Hours</div>
              <div className="text-2xl font-bold text-foreground mt-0.5">
                {totalWorkingHours}h
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">Based on estimated effort</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mr-4 shrink-0">
               <Filter className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Upcoming Planned</div>
              <div className="text-2xl font-bold text-foreground mt-0.5">
                {upcomingTasks.length}
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">Not yet active today</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mr-4 shrink-0">
               <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Sprint Deadlines</div>
              <div className="text-2xl font-bold text-foreground mt-0.5">
                {sprintDeadlineTasks.length}
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">Due within {sprintDays} days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border p-8 overflow-y-auto shadow-sm">
        <h3 className="text-sm uppercase tracking-wider font-semibold mb-8 flex items-center text-muted-foreground">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Timeline Activity &bull; {format(selectedDate, 'MMM d, yyyy')}
        </h3>
        
        <div className="relative border-l border-border ml-3 space-y-8">
          {relevantTasks.length === 0 ? (
            <p className="text-muted-foreground ml-6 font-mono text-sm">No activity recorded for this date.</p>
          ) : (
            relevantTasks.map((task) => {
              const isDone = task.status === 'Done';
              return (
                <div key={task.id} className="ml-6 relative">
                  <span className={`absolute -left-[33px] top-1 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white dark:ring-neutral-900 ${isDone ? 'bg-emerald-500' : 'bg-primary'}`}></span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                    <h4 className={`text-md font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </h4>
                    {task.dueDate && (
                      <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-md mt-2 sm:mt-0 ${getUrgencyColor(new Date(task.dueDate))}`}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl flex items-center space-x-2">
                    <span className="font-semibold text-foreground/70">{task.project}</span>
                    <span>&bull;</span>
                    <span>Est. {task.estimatedHours}h</span>
                    <span>&bull;</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      task.status === 'In Progress' ? 'bg-primary/10 text-primary' : 
                      task.status === 'To Do' ? 'bg-muted text-muted-foreground' : 
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {task.status}
                    </span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

