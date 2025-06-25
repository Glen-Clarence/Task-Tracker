import apiClient from "./_setup";

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<{ tags: Tag[] }>("/tags");
    return data.tags;
  },
  create: async (tag: Tag): Promise<Tag> => {
    const { data } = await apiClient.post<Tag>("/tags", tag);
    return data;
  },
  getTag: async (id: string): Promise<Tag> => {
    const { data } = await apiClient.get<Tag>(`/tags/${id}`);
    return data;
  },
  updateTag: async ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<Tag>;
  }): Promise<Tag> => {
    const payload = {
      id,
      name: updates.name,
      description: updates.description,
    };
    const { data } = await apiClient.patch<Tag>(`/tags/${id}`, payload);
    return data;
  },
};
