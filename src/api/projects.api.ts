import apiClient from "./_setup";
import { UserProfile } from "./users.api";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
  getUsers: async (id: string): Promise<UserProfile[]> => {
    const { data } = await apiClient.get<UserProfile[]>(
      `/repositories/${id}/users`
    );
    return data;
  },
};
