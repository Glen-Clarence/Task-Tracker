import apiClient from "./_setup";
import { UserProfile } from "./users.api";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string;
  userId: string;
  assignedToId?: string | null;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  isForAWeek?: boolean;
  isRecurring?: boolean;
  tagIDs?: string[];
  repositoryId?: string;
  timeEstimate?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  estimatedDuration?: string | null;
  actualDuration?: string | null;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
  assignedToIds?: string[];
  tagIDs?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  leadId?: string;
  startDate?: string | null;
  targetDate?: string | null;
  status?: string;
  memberIds?: string[];
  priority?: string;
  user?: UserProfile;
  lead?: UserProfile;
  members?: UserProfile[];
  tasks?: Task[];
  issues?: Issue[];
}

export interface Repository {
  members: UserProfile[];
  lead: UserProfile;
}

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>("/repositories");
    return data;
  },
  getRepo: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/repositories/${id}`);
    return data;
  },
  getUsers: async (id: string): Promise<Repository> => {
    const { data } = await apiClient.get<Repository>(
      `/repositories/${id}/users`
    );
    return data;
  },
};
