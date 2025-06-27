import apiClient from "./_setup";

type getAllType = {
  summary: string;
};

export const miscellaneousApi = {
  getAll: async (): Promise<getAllType> => {
    const { data } = await apiClient.get<getAllType>("/misc/task-summary");
    return data;
  },
};
