import apiClient from "./_setup";

type Author = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
};

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  labels?: string[];
  createdBy?: Author;
}

export const issuesApi = {
  getAll: async (): Promise<Issue[]> => {
    const { data } = await apiClient.get<Issue[]>("/issues");
    return data;
  },
  create: async (
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt">
  ): Promise<Issue> => {
    const { data } = await apiClient.post<Issue>("/api/issues", issue);
    return data;
  },
  update: async ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<Issue>;
  }): Promise<Issue> => {
    const { data } = await apiClient.patch<Issue>(`/api/issues/${id}`, updates);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/issues/${id}`);
  },
};
