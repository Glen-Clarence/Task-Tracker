import { useMemo } from "react";
import useKanbanStore from "../kanban/useKanbanStore";
import dayjs from "dayjs";
import clsx from "clsx";
import { Avatar, Spin, Tooltip } from "antd";
import useAdmin from "./useAdmin";
import { FilterOption, Filters } from "../search/Search";
import parse from "html-react-parser";
import { SearchFilterInput } from "../search/Search";
import { Button } from "../ui/button";

const cleanHtmlTags = (html: string) => {
  return html
    .replace(
      /<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>/gi,
      ""
    )
    .replace(/```html|```/g, "");
};

const AdminDashboard: React.FC = () => {
  const allTasks = useKanbanStore((state) => state.allTasks);

  const {
    taskSummary,
    isLoading,
    users,
    getTaskSummary,
    tasks,
    isTasksLoading,
    setSearch,
  } = useAdmin();

  const dates = useMemo(() => {
    const today = dayjs();
    return {
      today: {
        label: "Today",
        value: today.format("YYYY-MM-DD"),
      },
      yesterday: {
        label: "Yesterday",
        value: today.subtract(1, "day").format("YYYY-MM-DD"),
      },
      lastWeek: {
        label: "Last Week",
        value: today.subtract(7, "days").format("YYYY-MM-DD"),
      },
      lastMonth: {
        label: "Last Month",
        value: today.subtract(1, "month").format("YYYY-MM-DD"),
      },
    };
  }, []);

  const filters = useMemo<Filters>(
    () => ({
      name:
        users?.reduce(
          (acc, user) => ({
            ...acc,
            [user.id]: { id: user.id, label: user.name },
          }),
          {}
        ) ?? {},
      priority: {
        IN_PROGRESS: { id: "IN_PROGRESS", label: "In Progress" },
        PENDING: { id: "PENDING", label: "Pending" },
        COMPLETED: { id: "COMPLETED", label: "Completed" },
        CANCELLED: { id: "CANCELLED", label: "Cancelled" },
      },
      date: {
        today: { id: "today", label: dates.today.label },
        yesterday: { id: "yesterday", label: dates.yesterday.label },
        lastWeek: { id: "lastWeek", label: dates.lastWeek.label },
        lastMonth: { id: "lastMonth", label: dates.lastMonth.label },
      },
    }),
    [users, dates]
  );

  const filterOptions: FilterOption[] = [
    {
      key: "name",
      label: "Name:",
      description: "Filter by name",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    {
      key: "priority",
      label: "priority:",
      description: "Filter by priority",
      color: "bg-red-100 text-red-800 border-red-200",
    },
    {
      key: "date",
      label: "Date:",
      description: "Filter by date",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
  ];

  return (
    <div
      className="h-[calc(100vh)] overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-normal text-white mb-4 mt-0 sticky top-0 z-10 ">
          Admin Dashboard
        </h2>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="md:col-span-6 col-span-12  ">
          <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-normal mb-6">Overall Information</h2>

            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="text-4xl font-medium">{allTasks?.length}</span>
                <p className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  Tasks done for all time
                </p>
              </div>
              <div>
                <span className="text-4xl font-medium">
                  {
                    allTasks?.filter((task) => task.status === "CANCELLED")
                      .length
                  }
                </span>
                <p className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  tasks are stopped
                </p>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 grid-cols-2 gap-4">
              <div className="bg-gray-800 col-span-1 p-4 rounded-lg text-center">
                <span className="text-3xl font-medium block">
                  {
                    allTasks?.filter((task) => task.status === "IN_PROGRESS")
                      .length
                  }
                </span>
                <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  Ongoing
                </span>
              </div>
              <div className="bg-gray-800 col-span-1 p-4 rounded-lg text-center">
                <span className="text-3xl font-medium block">
                  {allTasks?.filter((task) => task.status === "PENDING").length}
                </span>
                <span className="xl:text-sm text-[12px] font-bold text-gray-400 whitespace-nowrap">
                  In Progress
                </span>
              </div>
              <div className="bg-gray-800 col-span-1 p-4 rounded-lg text-center hidden md:block">
                <span className="text-3xl font-medium block">
                  {
                    allTasks?.filter((task) => task.status === "COMPLETED")
                      .length
                  }
                </span>
                <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="md:col-span-8 col-span-12 bg-black/50 text-white w-full rounded-3xl p-4 mt-4">
        <div className="flex justify-between items-center max-w-lg">
          <h2 className="text-xl mb-2">Todays Tasks</h2>
          <Button onClick={() => getTaskSummary()}>Refresh</Button>
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 table-container">
          {!isLoading && parse(cleanHtmlTags(taskSummary?.summary || ""))}
        </div>
      </div>
      <div className="h-[60vh] mt-4">
        <div>
          <SearchFilterInput
            filters={filters}
            filterOptions={filterOptions}
            // @ts-expect-error - TODO: fix this
            onSearch={(value, filters) => {
              setSearch(filters);
            }}
          />
        </div>
        <h2 className="text-xl mb-2">All Tasks</h2>
        <div className="flex flex-col gap-4 text-white text-[16px]">
          <div className="flex gap-4">
            <p className="flex-1">Name</p>
            <p className="flex-1">Title</p>
            <p className="flex-1">Description</p>
            <p className="flex-1">Priority</p>
            <p className="flex-1">Status</p>
            <p className="flex-1">Updated At</p>
            <p className="flex-1">Created At</p>
            <p className="flex-1">Date</p>
          </div>
          <Spin spinning={isTasksLoading}>
            {tasks?.map((task) => {
              return (
                <div key={task.id} className="flex gap-4 text-[12px]">
                  <p className="flex-1">{task.user?.name}</p>
                  <h3 className="flex-1">{task.title}</h3>
                  <p className="flex-1 line-clamp-3">{task.description}</p>
                  <p className="flex-1">{task.priority}</p>
                  <p className="flex-1">{task.status}</p>
                  <p className="flex-1">
                    {dayjs(task.updatedAt).format("DD MMM YYYY")}
                  </p>
                  <p className="flex-1">
                    {dayjs(task.createdAt).format("DD MMM YYYY")}
                  </p>
                  <p className="flex-1">
                    {dayjs(task.date).format("DD MMM YYYY")}
                  </p>
                </div>
              );
            })}
          </Spin>
        </div>
      </div>
    </div>
  );
};

interface TrelloCardProps {
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  avatarUrl?: string;
  name?: string;
}

export const TrelloCardWithBorder: React.FC<TrelloCardProps> = ({
  title,
  description,
  labels = [],
  dueDate,
  name,
  avatarUrl,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "COMPLETED":
        return "border-t-green-500";
      case "IN_PROGRESS":
        return "border-t-blue-500";
      case "PENDING":
        return "border-t-yellow-500";
      default:
        return "border-t-gray-500";
    }
  };
  console.log(name);

  return (
    <div
      className={clsx(
        "bg-white min-h-[220px] relative p-4 col-span-1 border-t-4 rounded-br-2xl rounded-bl-2xl shadow-md hover:shadow-lg transition-all w-full max-w-sm",
        getPriorityColor(labels[1])
      )}
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map((label, idx) => (
          <span
            key={idx}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium"
          >
            {label}
          </span>
        ))}
      </div>

      <h3 className="font-semibold text-lg text-gray-800 mt-4 mb-1 line-clamp-2">
        {title}
      </h3>
      {description && (
        <Tooltip title={description.length > 100 ? description : ""}>
          <p className="text-sm text-gray-600 line-clamp-2 overflow-hidden text-ellipsis">
            {description}
          </p>
        </Tooltip>
      )}

      <div className="flex justify-between items-center mt-4 w-full absolute bottom-0 left-0 px-4 py-4">
        <span className="text-xs text-gray-500">
          <Tooltip title={name}>
            <Avatar src={avatarUrl} />
          </Tooltip>
        </span>
        {dueDate && (
          <span className="text-xs text-gray-500">
            📅 {dayjs(dueDate).format("DD MMM YYYY")}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
