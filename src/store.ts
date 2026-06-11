import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from './types';

interface ConfigState {
  githubToken: string;
  jiraDomain: string;
  jiraUsername: string;
  jiraToken: string;
  theme: 'light' | 'dark' | 'system' | 'jarvis';
}

interface DashboardState {
  tasks: Task[];
  config: ConfigState;
  setConfig: (config: Partial<ConfigState>) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  syncJiraTasks: (apiIssues: any[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      tasks: [],
      config: {
        githubToken: '',
        jiraDomain: '',
        jiraUsername: '',
        jiraToken: '',
        theme: 'system',
      },
      setConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t)
      })),
      removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId)
      })),
      syncJiraTasks: (apiIssues) => set((state) => {
        let newTasks = [...state.tasks];
        
        const issuesMap = new Map();
        apiIssues.forEach((issue: any) => {
            const parentKey = issue.fields?.parent?.key;
            const mainRefKey = parentKey || issue.key;
            const title = issue.fields?.parent?.fields?.summary || issue.fields.summary;
            const project = issue.fields.project?.key || 'Default';
            
            if (!issuesMap.has(mainRefKey)) {
                issuesMap.set(mainRefKey, {
                    mainRefKey,
                    title,
                    project,
                    originalIssueKeys: [issue.key]
                });
            } else {
                issuesMap.get(mainRefKey).originalIssueKeys.push(issue.key);
            }
        });

        issuesMap.forEach((data, mainRefKey) => {
            const matchingExisting = newTasks.filter(t => 
                t.mainJiraRef === mainRefKey || 
                t.jiraRef === mainRefKey || 
                data.originalIssueKeys.includes(t.jiraRef) ||
                data.originalIssueKeys.includes(t.sapNetworkCode)
            );

            if (matchingExisting.length > 0) {
                matchingExisting.sort((a, b) => (b.actualHours || 0) - (a.actualHours || 0));
                
                const bestTask = matchingExisting[0];
                newTasks = newTasks.map(t => {
                   if (t.id === bestTask.id) {
                       return {
                           ...t,
                           mainJiraRef: mainRefKey,
                           jiraRef: mainRefKey,
                           sapNetworkCode: mainRefKey,
                           title: data.title,
                           project: data.project,
                       };
                   }
                   return t;
                });

                const idsToRemove = matchingExisting.slice(1).map(t => t.id);
                if (idsToRemove.length > 0) {
                    newTasks = newTasks.filter(t => !idsToRemove.includes(t.id));
                }
            } else {
                newTasks.push({
                   id: Math.random().toString(36).substr(2, 9),
                   title: data.title,
                   description: '',
                   status: 'To Do',
                   priority: 'Medium',
                   project: data.project,
                   estimatedHours: 4,
                   actualHours: 0,
                   jiraRef: mainRefKey,
                   mainJiraRef: mainRefKey,
                   sapNetworkCode: mainRefKey,
                   sapActivity: 'Development',
                   sapActTyp: '100',
                   createdAt: new Date(),
                   updatedAt: new Date()
                } as Task);
            }
        });
        
        return { tasks: newTasks };
      }),
    }),
    {
      name: 'dev-dashboard-storage',
    }
  )
);
