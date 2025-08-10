import { Spin, Button } from "antd";
import useProjects from "./useProjects";
import { useNavigate } from "react-router";
import clsx from "clsx";

const Projects: React.FC = () => {
  const { projects, isLoading } = useProjects();
  const navigate = useNavigate();
  return (
    <div className="px-4 text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-white mt-4">Repositories</h2>
        <Button className={clsx("mt-4")}>Create Project</Button>
      </div>
      <Spin spinning={isLoading}>
        <div className="flex flex-wrap gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/repositories/${project.id}`)}
              className="flex items-center gap-2 relative cursor-pointer group transition-transform duration-200 hover:scale-105"
            >
              <svg
                key={project.id}
                width="256"
                height="192"
                viewBox="0 0 128 96"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-200 group-hover:drop-shadow-lg"
              >
                <rect x="0" y="0" width="128" height="96" fill="none" />
                <path
                  d="M0 24C0 17.3726 5.37258 12 12 12H48L60 24H116C122.627 24 128 29.3726 128 36V84C128 90.6274 122.627 96 116 96H12C5.37258 96 0 90.6274 0 84V24Z"
                  fill="#2E2E2E"
                  className="transition-colors duration-200 group-hover:fill-[#3a3a3a]"
                />
                <path
                  d="M0 24C0 17.3726 5.37258 12 12 12H48L60 24H0V24Z"
                  fill="#B0B0B0"
                  className="transition-colors duration-200 group-hover:fill-[#c4c4c4]"
                />
              </svg>
              <p className="absolute bottom-4 text-2xl left-6 text-white capitalize font-medium transition-all duration-200 group-hover:text-opacity-90">
                {project.name}
              </p>
            </div>
          ))}
        </div>
      </Spin>
    </div>
  );
};

export default Projects;
