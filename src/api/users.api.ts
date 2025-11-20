import apiClient from "./_setup";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  picture: string;
  streak: number;
  maxStreak: number;
  // Add other relevant fields as necessary
}
export interface UserAnalytics {
  date: string;
  hoursWorked: number;
  tasksCount: number;
}

export interface RepositoryStats {
  repositoryId: string;
  repositoryName: string;
  totalHours: number;
  tasksCount: number;
}

export interface UserTask {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  priority: string;
  timeEstimate: string;
  createdAt: string;
  updatedAt: string;
  repositoryId: string;
  repositoryName: string;
}

export interface UserAnalyticsData {
  id: string;
  email: string;
  name: string;
  analytics: UserAnalytics[];
  repositories: RepositoryStats[];
  tasks: UserTask[];
}

export const usersApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>("/users/all");
    return data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>("/users/profile");
    return data;
  },
  getAnalytics: async (repositoryId?: string): Promise<UserAnalyticsData[]> => {
    const url = repositoryId
      ? `/users/all?repositoryId=${repositoryId}`
      : `/users/all`;
    const { data } = await apiClient.get<UserAnalyticsData[]>(url);
    return data;
  },
};
