import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/api/projects.api";
import { FolderOpenDot, User, UsersRound } from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();

  const { data: users } = useQuery({
    queryKey: ["users", id],
    queryFn: () => projectsApi.getUsers(id as string),
  });

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getRepo(id as string),
  });

  return (
    <div className="text-white flex justify-center pt-4">
      <div className="flex flex-col gap-4 max-w-[70%]">
        <FolderOpenDot />
        <h2 className="text-2xl text-white">{project?.name}</h2>
        <p className="text-white">{project?.description}</p>
        <div className="flex gap-2 items-center">
          <h2 className=" text-white flex gap-2 items-center">
            <User size={12} /> Lead :{" "}
          </h2>
          <span className="ml-1">{users?.lead.name}</span>
        </div>
        <div className="flex gap-2 items-center">
          <h2 className=" text-white flex gap-2 items-center">
            <UsersRound size={12} /> Members :{" "}
          </h2>
          {users?.members?.map((user) => (
            <span key={user.id} className="ml-1">
              {user.name} ,
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
