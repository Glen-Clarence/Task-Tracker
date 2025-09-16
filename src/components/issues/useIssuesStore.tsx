import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Issue } from "@/api/issues.api";

type FilterType = "all" | "open" | "closed";
type SortType = "newest" | "oldest" | "updated" | "priority";

interface IssuesState {
  // Selection
  selectedIssue: string | null;
  selectedIssues: string[];

  // Filters and Search
  activeFilter: FilterType;
  searchQuery: string;
  sortBy: SortType;

  // UI State
  isCreatingIssue: boolean;
  isEditingIssue: string | null;

  // Actions
  setSelectedIssue: (id: string | null) => void;
  toggleIssueSelection: (id: string) => void;
  selectAllIssues: (issueIds: string[]) => void;
  clearSelection: () => void;

  setActiveFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortType) => void;

  setIsCreatingIssue: (creating: boolean) => void;
  setIsEditingIssue: (id: string | null) => void;

  // Computed helpers
  isIssueSelected: (id: string) => boolean;
  getSelectedCount: () => number;
}

const useIssuesStore = create<IssuesState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedIssue: null,
      selectedIssues: [],
      activeFilter: "open",
      searchQuery: "",
      sortBy: "newest",
      isCreatingIssue: false,
      isEditingIssue: null,

      // Selection actions
      setSelectedIssue: (id) => set({ selectedIssue: id }),

      toggleIssueSelection: (id) => set((state) => ({
        selectedIssues: state.selectedIssues.includes(id)
          ? state.selectedIssues.filter(issueId => issueId !== id)
          : [...state.selectedIssues, id]
      })),

      selectAllIssues: (issueIds) => set({ selectedIssues: issueIds }),

      clearSelection: () => set({ selectedIssues: [], selectedIssue: null }),

      // Filter and search actions
      setActiveFilter: (filter) => set({ activeFilter: filter }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSortBy: (sort) => set({ sortBy: sort }),

      // UI state actions
      setIsCreatingIssue: (creating) => set({ isCreatingIssue: creating }),

      setIsEditingIssue: (id) => set({ isEditingIssue: id }),

      // Computed helpers
      isIssueSelected: (id) => get().selectedIssues.includes(id),

      getSelectedCount: () => get().selectedIssues.length,
    }),
    {
      name: "issues-store",
      // Only persist certain fields
      partialize: (state) => ({
        activeFilter: state.activeFilter,
        sortBy: state.sortBy,
      }),
    }
  )
);

// Helper function to sort issues
export const sortIssues = (issues: Issue[], sortBy: SortType): Issue[] => {
  const sorted = [...issues];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    case "oldest":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    case "updated":
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    case "priority":
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    default:
      return sorted;
  }
};

// Helper function to filter issues
export const filterIssues = (issues: Issue[], filter: FilterType, searchQuery: string): Issue[] => {
  let filtered = issues;

  // Apply status filter
  switch (filter) {
    case "open":
      filtered = filtered.filter(issue =>
        issue.status === "NOT_STARTED" || issue.status === "IN_PROGRESS"
      );
      break;
    case "closed":
      filtered = filtered.filter(issue =>
        issue.status === "COMPLETED" || issue.status === "CANCELLED"
      );
      break;
    case "all":
    default:
      // No filtering needed
      break;
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(issue =>
      issue.title.toLowerCase().includes(query) ||
      issue.description?.toLowerCase().includes(query) ||
      issue.id.toLowerCase().includes(query) ||
      issue.createdBy?.name?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export default useIssuesStore;
