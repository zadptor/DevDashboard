import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from './types';

interface ConfigState {
  githubToken: string;
  jiraDomain: string;
  jiraEmail: string;
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
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      tasks: [],
      config: {
        githubToken: '',
        jiraDomain: '',
        jiraEmail: '',
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
    }),
    {
      name: 'dev-dashboard-storage',
    }
  )
);
