import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../../api/projects.api";

const useProjects = () => {
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
