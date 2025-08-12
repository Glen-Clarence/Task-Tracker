import apiClient from "./_setup";
import { UserProfile } from "./users.api";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
