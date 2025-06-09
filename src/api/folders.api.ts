import apiClient from "./_setup";

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const foldersApi = {
  getAll: async (): Promise<Folder[]> => {
    const { data } = await apiClient.get<Folder[]>("/folders");
    return data;
  },
  create: async (folder: Folder): Promise<Folder> => {
    const { data } = await apiClient.post<Folder>("/folders", folder);
    return data;
  },
};
