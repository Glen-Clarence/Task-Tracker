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

export interface Stats {
  total?: number;
  totalCompletedTasks?: number;
  totalPendingTasks?: number;
  totalInProgressTasks?: number;
  totalCancelledTasks?: number;
  onGoingTasks?: number;
  byStatus?: {
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
}

type Response = {
  tasks: Task[];
};

export const taskApi = {
  getAll: async (params?: {
    search?: string;
    userId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }): Promise<Response> => {
    const { data } = await apiClient.get<Response>("/tasks/all", params);
    return data;
  },
  getStats: async (): Promise<Stats> => {
    const { data } = await apiClient.get<Stats>("/tasks/stats");
    return data;
  },
  download: async (): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
      "/tasks/download",
      {},
      {},
      {
        responseType: "blob",
      }
    );
    console.log(data);
    return data;
  },
};
