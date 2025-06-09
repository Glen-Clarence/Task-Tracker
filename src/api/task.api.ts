import apiClient from "./_setup";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  priority: string;
  user: User;
};

type Response = {
  tasks: Task[];
};

export const taskApi = {
  getAll: async (params?: {
    search?: string;
    userId?: string;
    status?: string;
  }): Promise<Response> => {
    const { data } = await apiClient.get<Response>("/tasks/all", params);
    return data;
  },
};
