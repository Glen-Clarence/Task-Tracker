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
export const usersApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>("/users/all");
    return data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>("/users/profile");
    return data;
  },
};
