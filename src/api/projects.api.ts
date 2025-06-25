import apiClient from "./_setup";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>(
      "/repositories/user/repositories"
    );
    return data;
  },
  getRepo: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/repositories/${id}`);
    return data;
  },
};
