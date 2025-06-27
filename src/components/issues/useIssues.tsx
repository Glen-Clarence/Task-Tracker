import { useQuery, useMutation } from "@tanstack/react-query";

import { Issue, issuesApi } from "../../api/issues.api";
import { useQueryCache } from "../../hooks/useQueryClient";
import { useParams } from "react-router";
import { projectsApi } from "@/api/projects.api";

export const useIssues = () => {
  const { updateCache } = useQueryCache<Issue>({
    queryKey: ["issues"],
    getId: (issue) => issue.id,
  });
  const { id } = useParams();
  // Query for fetching issues
  const {
    data: issues = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["issues", id],
    queryFn: ({ queryKey }) => issuesApi.getAll(queryKey[1] as string),
  });

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getRepo(id as string),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: issuesApi.create,
    onSuccess: updateCache.onSuccess,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: issuesApi.update,
    onSuccess: updateCache.onUpdate,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: issuesApi.delete,
    onSuccess: (_, deletedId) => updateCache.onDelete(deletedId),
  });

  return {
    // Data
    issues,
    isLoading,
    error,

    project,

    // Actions
    createIssue: createMutation.mutate,
    updateIssue: updateMutation.mutate,
    deleteIssue: deleteMutation.mutate,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states

    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};
