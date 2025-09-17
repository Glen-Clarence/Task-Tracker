import apiClient from "./_setup";
import { UserProfile } from "./users.api";
import { Tag } from "./tags.api";

// --- Shared Types ---

type Author = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
};

export type IssueStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const statusDisplayMap = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-blue-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500' }
} as const;

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH";

// --- Type for Issue Lists (Simpler) ---
export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
  createdBy?: Author;
  assignedToIds?: string[]; 
  tagIDs?: string[];
}

// --- Type for a Single, Detailed Issue (Richer) ---
interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name?: string;
    picture?: string;
  };
  createdAt: string;
}

export interface IssueDetailData extends Omit<Issue, 'assignedToIds' | 'tagIDs'> {
  repository: {
    id: string;
    name: string;
  };
  assignedTo: UserProfile[];
  tags: Tag[];
  comments: Comment[];
}

// --- API Functions ---
export const issuesApi = {
  getAll: async (repositoryId?: string): Promise<Issue[]> => {
    const params = repositoryId ? { repositoryId } : {};
    const { data } = await apiClient.get<Issue[]>("/issues", { params });
    return data;
  },
  getById: async (id: string): Promise<IssueDetailData> => {
    const { data } = await apiClient.get<IssueDetailData>(`/issues/${id}`);
    return data;
  },
  create: async (
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt"> & { repositoryId: string }
  ): Promise<Issue> => {
    const { data } = await apiClient.post<Issue>("/issues", issue);
    return data;
  },
  update: async ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<Issue>;
  }): Promise<Issue> => {
    const { data } = await apiClient.put<Issue>(`/issues/${id}`, updates);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`);
  },
};