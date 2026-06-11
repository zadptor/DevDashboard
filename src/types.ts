import { z } from "zod";

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Blocked" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours: number;
  actualHours: number;
  project: string;
  dueDate?: Date;
  completedDate?: Date;
  jiraRef?: string;
  mainJiraRef?: string;
  sapNetworkCode?: string;
  sapActivity?: string;
  sapActTyp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityItem {
  id: string;
  type: 'pr' | 'ticket' | 'task';
  description: string;
  date: Date;
  status: string;
}
