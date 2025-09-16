import { useQuery, useMutation, useQueryClient, QueryFilters } from "@tanstack/react-query";
import { useParams } from "react-router";
import { Issue, issuesApi, CreateIssueData, IssueStatus, IssuePriority } from "../../api/issues.api";
import { projectsApi } from "@/api/projects.api";

interface UpdateIssueParams {
  issueId: string;
  updates: Partial<Omit<CreateIssueData, 'repositoryId'>>;
}

export const useIssues = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  // Query for fetching issues
  const {
    data: issues = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: id ? ["issues", id] : ["issues"],
    queryFn: () => issuesApi.getAll(id),
    enabled: true,
  });

  // Query for project data
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getRepo(id as string),
    enabled: !!id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newIssue: CreateIssueData) => issuesApi.create(newIssue),
    onSuccess: (newIssue) => {
      queryClient.setQueryData(["issues", id], (oldData: Issue[] = []) => [
        newIssue,
        ...oldData,
      ]);
      queryClient.invalidateQueries({ queryKey: ["issues", id] });
    },
    onError: (error) => {
      console.error("Failed to create issue:", error);
    },
  });

  // Update mutation
const updateMutation = useMutation({
  mutationFn: ({ issueId, updates }: UpdateIssueParams) =>
    issuesApi.update({ id: issueId, updates }),
  onMutate: async ({ issueId, updates }: UpdateIssueParams) => {
    await queryClient.cancelQueries(["issues", id] as QueryFilters);
    const previousIssues = queryClient.getQueryData<Issue[]>(["issues", id]);
    queryClient.setQueryData<Issue[]>(["issues", id], (oldData = []) =>
      oldData.map((issue) =>
        issue.id === issueId ? { ...issue, ...updates } : issue
      )
    );
    return { previousIssues };
  },
  onError: (_err, _variables, context: any) => {
    queryClient.setQueryData(["issues", id], context.previousIssues);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["issues", id] });
  },
});

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (issueId: string) => issuesApi.delete(issueId),
    onMutate: async (issueId: string) => {
      await queryClient.cancelQueries(["issues", id] as QueryFilters);
      const previousIssues = queryClient.getQueryData<Issue[]>(["issues", id]);
      queryClient.setQueryData<Issue[]>(["issues", id], (oldData = []) =>
        oldData.filter((issue) => issue.id !== issueId)
      );
      return { previousIssues };
    },
    onError: (_err: Error, _issueId: string, context: { previousIssues: Issue[] | undefined } | undefined) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(["issues", id], context.previousIssues);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", id] });
    },
  });

  // Get issue by ID
  const getIssueById = (issueId: string) => {
    return issues.find((issue) => issue.id === issueId);
  };

  // Filter issues by status
  const getIssuesByStatus = (status: IssueStatus) => {
    return issues.filter((issue) => issue.status === status);
  };

  // Filter issues by priority
  const getIssuesByPriority = (priority: IssuePriority) => {
    return issues.filter((issue) => issue.priority === priority);
  };

  return {
    // Data
    issues,
    isLoading,
    error,
    project,

    // Actions
    createIssue: createMutation.mutateAsync,
    updateIssue: (issueId: string, updates: Partial<CreateIssueData>) =>
      updateMutation.mutateAsync({ issueId, updates }),
    deleteIssue: deleteMutation.mutateAsync,
    refetchIssues: refetch,

    // Helper functions
    getIssueById,
    getIssuesByStatus,
    getIssuesByPriority,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Success states
    createSuccess: createMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,
  };
};
