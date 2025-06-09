import { useQuery } from "@tanstack/react-query";
import { Project, projectsApi } from "../../api/projects.api";
import { useQueryCache } from "../../hooks/useQueryClient";

const useProjects = () => {
  const { updateCache } = useQueryCache<Project>({
    queryKey: ["projects"],
    getId: (project) => project.id,
  });

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  return { projects, isLoading, error };
};

export default useProjects;
