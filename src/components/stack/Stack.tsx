import { Avatar, Select, Button } from "antd";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
// import TrelloCard from "../Card";
import useKanbanStore, { Task } from "../kanban/useKanbanStore";
import { priorityOptions, statusOptions } from "../../utils/options";
import { Grid, List, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import clsx from "clsx";

// const { Option } = Select;

const CARD_COLORS = ["#266678", "#cb7c7a", "#36a18b", "#cda35f", "#747474"];
const CARD_OFFSET = 10;
const SCALE_FACTOR = 0.06;

export const CardStack = () => {
  const allTasks = useKanbanStore((state) => state.allTasks);
  const fetchAllTasks = useKanbanStore((state) => state.fetchAllTasks);
  const moveTaskStackToEnd = useKanbanStore(
    (state) => state.moveTaskStackToEnd
  );
  const restoreAllTasks = useKanbanStore((state) => state.restoreAllTasks);

  const [selectedUser, setSelectedUser] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [gridView, setGridView] = useState<boolean>(false);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  // Group tasks by user if not "All", otherwise use the flat list
  const groupedTasks: Record<string, Task[]> = {};
  allTasks.forEach((task) => {
    const name = task.user?.name || "Unknown";
    if (!groupedTasks[name]) {
      groupedTasks[name] = [];
    }
    groupedTasks[name].push(task);
  });

  const userNames = Object.keys(groupedTasks);

  const filteredAndSorted = (taskList: Task[]) => {
    return taskList.filter((task) => {
      const matchesPriority = priority === "All" || task.priority === priority;
      const matchesStatus = status === "All" || task.status === status;
      return matchesPriority && matchesStatus;
    });
  };

  // Render task stack for a single user or for all users
  const renderTaskStack = (tasks: Task[]) => {
    const visibleTasks = filteredAndSorted(tasks);
    const tasksYesterday = visibleTasks.filter((task) => {
      const created = new Date(task.createdAt as string);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return (
        created.getFullYear() === yesterday.getFullYear() &&
        created.getMonth() === yesterday.getMonth() &&
        created.getDate() === yesterday.getDate()
      );
    });
    if (visibleTasks.length === 0) return null;

    return (
      <div style={{ marginBottom: "2rem", minHeight: "75vh" }}>
        <div
          className="flex gap-4 overflow-scroll mt-4"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <div
            className={clsx(
              "border border-[#ccc] px-4 py-2 rounded-xl cursor-pointer",
              selectedUser === "All" && "bg-blue-500 text-white border-none"
            )}
            onClick={() => setSelectedUser("All")}
          >
            <h3 className="text-sm text-nowrap">All</h3>
          </div>
          {userNames.map((name) => (
            <div
              key={name}
              className={clsx(
                "border border-[#ccc] px-4 py-2 rounded-xl cursor-pointer",
                selectedUser === name && "bg-blue-500 text-white border-none"
              )}
              onClick={() => setSelectedUser(name)}
            >
              <h3 className="text-sm text-nowrap">{name}</h3>
            </div>
          ))}
        </div>
        {gridView ? (
          <>
            <div className="grid grid-cols-12 gap-4 mt-4">
              {visibleTasks.map((todo) => (
                <TrelloCardWithBorder
                  key={todo.id}
                  title={todo.title as string}
                  description={todo.description}
                  labels={[todo.priority as string, todo.status as string]}
                  dueDate={todo.createdAt}
                  name={todo.user?.picture}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={wrapperStyle}>
            <ul style={cardWrapStyle}>
              {tasksYesterday.map((todo, index) => {
                const canDrag = index === 0;
                return (
                  <motion.li
                    key={todo.id}
                    style={{
                      ...cardStyle,
                      cursor: canDrag ? "grab" : "auto",
                    }}
                    animate={{
                      top: index * -CARD_OFFSET,
                      scale: 1 - index * SCALE_FACTOR,
                      zIndex: CARD_COLORS.length - index,
                    }}
                    drag={canDrag ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={() => moveTaskStackToEnd(todo.id as string)}
                  >
                    <TrelloCard key={todo.id} cardData={todo as Task} />
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="gap-4 mb-4 items-center flex-wrap hidden md:flex">
        {/* <div className="flex flex-col">
          <label htmlFor="user-select">Users</label>
          <Select
            id="user-select"
            style={{ width: 180 }}
            value={selectedUser}
            onChange={(val) => setSelectedUser(val)}
          >
            <Option value="All">All Users</Option>
            {userNames.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div> */}

        <div className="md:flex flex-col">
          <label htmlFor="priority-select">Priority</label>
          <Select
            id="priority-select"
            style={{ width: 140 }}
            value={priority}
            onChange={(val) => setPriority(val)}
            options={priorityOptions}
            allowClear
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="status-select">Status</label>
          <Select
            id="status-select"
            style={{ width: 160 }}
            allowClear
            value={status}
            onChange={(val) => setStatus(val)}
            options={statusOptions}
          />
        </div>

        <div className="flex items-center gap-2">
          {gridView ? (
            <Grid
              onClick={() => setGridView(false)}
              className="cursor-pointer"
              size={20}
            />
          ) : (
            <List
              onClick={() => setGridView(true)}
              className="cursor-pointer"
              size={20}
            />
          )}
          <Button
            type="primary"
            icon={<RefreshCw size={16} />}
            onClick={restoreAllTasks}
            className="flex items-center gap-1"
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Render Task Stacks */}
      {selectedUser === "All"
        ? renderTaskStack(allTasks) // Render all tasks as one stack
        : selectedUser in groupedTasks &&
          renderTaskStack(groupedTasks[selectedUser])}
      {/* Grouped by user */}
    </div>
  );
};

interface TrelloCardProps {
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  name?: string;
}
export const TrelloCardWithBorder: React.FC<TrelloCardProps> = ({
  title,
  description,
  labels = [],
  dueDate,
  name,
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

  return (
    <div
      className={clsx(
        "bg-white min-h-[220px] relative p-4 col-span-3 border-t-4 rounded-br-2xl rounded-bl-2xl shadow-md hover:shadow-lg transition-all w-full max-w-sm",
        getPriorityColor(labels[1])
      )}
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map((label, idx) => (
          <span
            key={idx}
            className="text-xs bg-blue-100 text-blue-800 px-2 mt-2 py-0.5 rounded-full font-medium"
          >
            {label}
          </span>
        ))}
      </div>

      <h3 className="font-semibold text-lg line-clamp-2 text-gray-800 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 line-clamp-2 overflow-hidden text-ellipsis">
          {description}
        </p>
      )}

      <div className="flex justify-between items-center mt-4 w-full absolute bottom-0 left-0 px-4 py-4">
        {name && (
          <span className="text-xs text-gray-500">
            <Avatar src={name} />
          </span>
        )}

        {dueDate && (
          <span className="text-xs text-gray-500">
            📅 {dayjs(dueDate).format("DD MMM YYYY")}
          </span>
        )}
      </div>
    </div>
  );
};

interface TrelloProps {
  cardData: Task;
}

const getRandomLightColor = () => {
  const r = Math.floor(200 + Math.random() * 55);
  const g = Math.floor(200 + Math.random() * 55);
  const b = Math.floor(200 + Math.random() * 55);
  return `rgb(${r}, ${g}, ${b})`;
};

const TrelloCard = ({ cardData }: TrelloProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "PENDING":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  const [bgColor, setBgColor] = useState(getRandomLightColor());

  useEffect(() => {
    setBgColor(getRandomLightColor());
  }, []);

  return (
    <div
      className="rounded-md shadow-md p-4 pt-8 cursor-pointer h-full"
      style={{
        backgroundColor: bgColor,
      }}
    >
      <span
        className={clsx(
          getPriorityColor(cardData.status as string),
          "text-white px-3 py-2 rounded-full font-medium"
        )}
      >
        {cardData.status}
      </span>
      <h2 className="text-2xl first-letter:capitalize font-normal mt-4 line-clamp-2">
        {cardData.title}
      </h2>
      <p className="mt-4">{dayjs(cardData.createdAt).format("DD MMM YYYY")}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="flex items-center gap-2">
          <Avatar src={cardData.user?.picture} size={50} />
          <span>
            <span className="text-sm text-gray-500 mb-0">Task by</span>
            <p className="text-sm font-semibold capitalize mt-0">
              {cardData.user?.name.split(" ")[0]}
            </p>
          </span>
        </span>
        <span className="bg-black/80 px-4 py-2 rounded-full text-white">
          <p>{cardData.priority}</p>
        </span>
      </div>
      <p className="first-letter:capitalize mt-4 text-base text-gray-800 line-clamp-[8]">
        {cardData.description}
      </p>
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  top: "100px",
};

const cardWrapStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "500px",
};

const cardStyle: React.CSSProperties = {
  position: "absolute",
  // maxWidth: "350px",
  width: "100%",
  height: "500px",
  borderRadius: "16px",
  transformOrigin: "top center",
  listStyle: "none",
};
