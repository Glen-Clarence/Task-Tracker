import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/api/projects.api";

const ProjectDetails = () => {
  const { id } = useParams();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", id],
    queryFn: () => projectsApi.getUsers(id as string),
  });

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getRepo(id as string),
  });

  console.log(project, isLoadingProject);

  return (
    <div className="text-white">
      <h1 className="text-2xl text-white">Project Details</h1>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-white">Project Name</h2>
        <p className="text-base text-white">{project?.name}</p>
      </div>
      {users?.map((user) => (
        <div
          key={user.id}
          className="text-white border border-white rounded-md p-2"
        >
          {user.name}
        </div>
      ))}
    </div>
  );
};

export default ProjectDetails;
