import { create } from "zustand";

interface IssuesState {
  selectedIssue: string | null;
  setSelectedIssue: (id: string | null) => void;
}

const useIssuesStore = create<IssuesState>((set) => ({
  selectedIssue: null,
  setSelectedIssue: (id) => set({ selectedIssue: id }),
}));

export default useIssuesStore;
