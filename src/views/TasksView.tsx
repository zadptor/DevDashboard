import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { useDashboardStore } from '../store';
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '../App';

export default function TasksView() {
  const { tasks, addTask, updateTask } = useDashboardStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [completingTask, setCompletingTask] = useState<any>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const shortDesc = formData.get('shortDesc') as string;
    const projectCode = formData.get('projectCode') as string || 'Default';

    addTask({
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      description: '',
      shortDescription: shortDesc,
      status: 'To Do',
      priority: 'Medium',
      project: projectCode,
      estimatedHours: 0,
      actualHours: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setNewTaskTitle('');
    (e.target as HTMLFormElement).reset();
  };

  const handleToggle = (task: any) => {
    if (task.status === 'Done') {
      updateTask(task.id, { status: 'To Do', actualHours: 0, completedDate: undefined, shortDescription: undefined });
    } else {
      setCompletingTask(task);
    }
  };

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    updateTask(completingTask.id, {
      status: 'Done',
      shortDescription: formData.get('shortDescription') as string,
      actualHours: Number(formData.get('hours')) || 0,
      completedDate: new Date(formData.get('date') as string),
      project: formData.get('project') as string || completingTask.project,
    });
    setCompletingTask(null);
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto relative divide-y divide-border/50">
      <div className="pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tasks & Jira Issues</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">Manage your day, log your time, and integrate with Jira.</p>
      </div>

      <div className="py-8">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
          <form onSubmit={handleAddTask} className="p-1">
            <div className="p-3 border-b border-border bg-card">
               <Input 
                 placeholder="What needs to be done?" 
                 value={newTaskTitle}
                 onChange={(e) => setNewTaskTitle(e.target.value)}
                 className="w-full text-base bg-transparent border-none shadow-none focus-visible:ring-0 px-2 font-medium"
                 required
                 autoFocus
               />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20">
               <div className="flex gap-4 flex-1 mr-4">
                 <div className="flex-1">
                   <Input 
                     placeholder="Short Description (optional)" 
                     name="shortDesc"
                     className="text-xs bg-transparent border-transparent hover:border-border h-8 shadow-none focus-visible:ring-1"
                   />
                 </div>
                 <div className="w-1/3 relative group">
                   <div className="absolute -top-6 right-0 scale-0 transition-transform group-hover:scale-100 bg-foreground text-background text-[10px] py-1 px-2 rounded font-medium whitespace-nowrap z-10">SAP CATS Project Code</div>
                   <Input 
                     placeholder="Project: Default" 
                     name="projectCode"
                     defaultValue="Default"
                     className="text-xs bg-transparent border-transparent hover:border-border h-8 shadow-none focus-visible:ring-1 font-mono uppercase"
                   />
                 </div>
               </div>
               <Button type="submit" size="sm" className="h-8 shadow-sm">
                 <Plus className="w-4 h-4 mr-1.5" /> Add Task
               </Button>
            </div>
          </form>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center">
              Active Tasks
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{pendingTasks.length}</span>
            </h3>
            <div className="space-y-2">
              {pendingTasks.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No pending tasks. You're all caught up!</p>
                </div>
              )}
              {pendingTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => handleToggle(task)} 
                />
              ))}
            </div>
          </div>

          {doneTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Completed</h3>
              <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                {doneTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={() => handleToggle(task)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!completingTask} onOpenChange={(open) => !open && setCompletingTask(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Log your time and details for reporting.
            </DialogDescription>
          </DialogHeader>
          {completingTask && (
            <form onSubmit={handleCompletionSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Project Code</Label>
                   <span className="text-[10px] text-muted-foreground/caption bg-muted px-1.5 py-0.5 border border-border rounded">SAP CATS</span>
                 </div>
                 <Input name="project" defaultValue={completingTask.project || 'Default'} required className="font-mono text-sm uppercase" />
              </div>
              <div className="space-y-2">
                 <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Log Note</Label>
                 <Input name="shortDescription" placeholder="What was accomplished?" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Hours</Label>
                   <Input name="hours" type="number" step="0.25" defaultValue="1" required className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date</Label>
                   <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="text-sm" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                 <Button type="button" variant="ghost" onClick={() => setCompletingTask(null)}>Cancel</Button>
                 <Button type="submit">Complete & Log Time</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskItem({ task, onToggle }: { key?: string, task: any, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
      <div className="flex items-center space-x-3 w-3/4 min-w-0">
        <button onClick={onToggle} className="text-muted-foreground hover:text-primary transition-colors focus:outline-none shrink-0 group-hover:scale-110 duration-200">
          {task.status === 'Done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <span className={cn("text-sm font-medium pr-4 truncate", task.status === 'Done' && "line-through text-muted-foreground")}>
            {task.title}
          </span>
          {task.status === 'Done' && task.shortDescription && (
             <span className="text-xs text-muted-foreground truncate mt-1 bg-muted px-2 py-0.5 rounded w-fit">{task.shortDescription}</span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4 text-sm text-muted-foreground shrink-0">
        <span className="px-2 py-1 rounded bg-secondary/50 text-secondary-foreground text-[10px] font-bold font-mono tracking-wider uppercase">{task.project}</span>
        {task.actualHours > 0 && <span className="flex items-center font-mono text-xs"><Clock className="w-3.5 h-3.5 mr-1 text-muted-foreground/70"/> {task.actualHours}h</span>}
      </div>
    </div>
  );
}
