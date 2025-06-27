import { Button, Checkbox, ConfigProvider, theme } from "antd";
import { useState } from "react";
import { useIssues } from "./useIssues";

// import { Issue } from "../../api/issues.api";
import dayjs from "dayjs";
import { FilterOption, SearchFilterInput } from "../search/Search";

type Filterbtns = {
  id: string;
  label: string;
};

const Issues = () => {
  const filterbtns: Filterbtns[] = [
    { id: "all", label: "All Issues" },
    { id: "open", label: "Open Issues" },
    { id: "closed", label: "Closed Issues" },
  ];

  const [activeFilter, setActiveFilter] = useState<string>(filterbtns[0].id);

  const { issues, project } = useIssues();

  console.log(project);

  const filters = {
    priority: {
      IN_PROGRESS: { id: "IN_PROGRESS", label: "In Progress" },
      PENDING: { id: "PENDING", label: "Pending" },
      COMPLETED: { id: "COMPLETED", label: "Completed" },
      CANCELLED: { id: "CANCELLED", label: "Cancelled" },
    },
  };

  const filterOptions: FilterOption[] = [
    {
      key: "priority",
      label: "priority:",
      description: "Filter by priority",
      color: "bg-red-100 text-red-800 border-red-200",
    },
  ];

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/20 text-red-500 border-red-500/20";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
      case "LOW":
        return "bg-green-500/20 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-500 border-blue-500/20";
      case "COMPLETED":
        return "bg-green-500/20 text-green-500 border-green-500/20";
      case "CANCELLED":
        return "bg-red-500/20 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/20";
    }
  };

  // const getLabelClass = (label: string) => {
  //   switch (label) {
  //     case "bug":
  //       return "bg-red-500/20 text-red-500 border-red-500/20";
  //     case "feature":
  //       return "bg-blue-500/20 text-blue-500 border-blue-500/20";
  //     case "enhancement":
  //       return "bg-purple-500/20 text-purple-500 border-purple-500/20";
  //     case "documentation":
  //       return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
  //     default:
  //       return "bg-gray-500/20 text-gray-500 border-gray-500/20";
  //   }
  // };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#777",
          fontSize: 12,
        },
        algorithm: theme.darkAlgorithm,
      }}
    >
      <div className="text-white">
        <h1 className="text-2xl text-white">My Issues</h1>
        <div className="flex gap-2 mt-2">
          {filterbtns.map((option) => (
            <Button
              key={option.id}
              type={activeFilter === option.id ? "default" : "primary"}
              ghost={activeFilter === option.id}
              size="small"
              onClick={() => setActiveFilter(option.id)}
              className={
                activeFilter === option.id
                  ? "!text-white !border-white hover:!text-white hover:!border-white"
                  : ""
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
        <SearchFilterInput
          filters={filters}
          filterOptions={filterOptions}
          onSearch={() => {}}
        />

        <div className="max-w-2xl flex flex-col gap-2 p-2">
          {issues.map((issue) => {
            return (
              <>
                <span className="flex items-center gap-2">
                  <Checkbox name={issue.title} />
                  <span className="text-base font-medium">{issue.title}</span>
                  <span className={getStatusClass(issue.status)}>
                    {issue.status}
                  </span>
                </span>
                <span className="flex items-center gap-2 font-light text-gray-300">
                  <span className={getPriorityClass(issue.priority)}>
                    {issue.priority}
                  </span>
                  <span># {issue.id.slice(0, 6)}</span>
                  <span>by {issue.createdBy?.name?.split(" ")[0]} </span>
                  <span>
                    opened on {dayjs(issue.createdAt).format("DD-MM-YYYY")}
                  </span>
                </span>
              </>
            );
          })}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Issues;
