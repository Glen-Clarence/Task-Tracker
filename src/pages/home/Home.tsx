import { useEffect, useState } from "react";

import useKanbanStore from "../../components/kanban/useKanbanStore";
import useUserStore from "../../store/useUserStore";
import StreakWeek from "../../components/streak/StreakWeek";

import { Button, Modal } from "antd";

import { CheckCheck, Plus, Trash } from "lucide-react";

import clsx from "clsx";
import dayjs from "dayjs";
import QuickTask from "../../components/modals/QuickTask";

const Home = () => {
  const { profile } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState<{
    task?: boolean;
    issue?: boolean;
  }>({
    task: false,
    issue: false,
  });
  const tasks = useKanbanStore((state) => state.tasks);
  const fetchTasks = useKanbanStore((state) => state.fetchTasks);
  const moveTaskTo = useKanbanStore((state) => state.moveTaskTo);
  const quickTasks = useKanbanStore((state) => state.quickTasks);
  const getQuickTasks = useKanbanStore((state) => state.getQuickTasks);
  const updateQuickTask = useKanbanStore((state) => state.updateQuickTask);
  const deleteQuickTask = useKanbanStore((state) => state.deleteQuickTask);
  const getStats = useKanbanStore((state) => state.getStats);
  const stats = useKanbanStore((state) => state.stats);

  useEffect(() => {
    fetchTasks();
    getStats();
    getQuickTasks();
  }, []);

  const tasksToday = tasks
    .filter((task) => {
      const created = new Date(task.createdAt as string);
      const now = new Date();
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    })
    .sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
      return 0;
    });

  return (
    <div>
      <div className="container 2xl:max-w-[100%] grid grid-cols-3 text-white border-b pb-4 border-[#999]">
        <h1 className="text-4xl font-normal">
          Hy, {profile?.name.split(" ")[0]}
        </h1>
        <p className="text-2xl font-normal flex justify-center items-end">
          Todays Tasks
        </p>
        <p className="text-2xl font-normal flex justify-end items-end ">
          {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="container 2xl:max-w-[100%] pl-4  py-4 grid grid-cols-3 text-white pb-4">
        <div className=" text-white p-6 pt-2 pl-0 rounded-3xl">
          <div className="flex justify-between">
            <span>
              <h2 className="text-[7rem] font-normal mb-0 mt-[-1rem]">
                {tasks.length}%
              </h2>
              <p className="text-xl font-medium mt-[-2rem]">
                Today's Productivity
              </p>
            </span>
            <span>
              <h2 className="text-[7rem] font-normal mb-0 mt-[-1rem]">
                {tasks.length}%
              </h2>
              <p className="text-xl font-medium mt-[-2rem]">Error Rate</p>
            </span>
          </div>
          <div
            style={{
              // backgroundColor: !isScrolled ? "rgba(204, 204, 204, 0.08)" : "#fff",
              backgroundColor: "rgba(204, 204, 204, 0.08)",
              backdropFilter: "blur(5px)",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            }}
            className="p-4 rounded-3xl mt-6"
          >
            <div className="flex justify-between items-center">
              <p>Your Activity</p>
              <p className="text-gray-600 bg-white rounded-full px-4 py-1 text-sm">
                Statistic
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="col-span-1 rounded-lg ">
                <span className="text-3xl font-medium text-left block">
                  {stats.totalInProgressTasks}
                </span>
                <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  Ongoing
                </span>
              </div>
              <div className="col-span-1 rounded-lg ">
                <span className="text-3xl font-medium text-left block">
                  {stats.totalPendingTasks}
                </span>
                <span className="xl:text-sm text-[12px] font-bold text-gray-400 whitespace-nowrap">
                  In Progress
                </span>
              </div>
              <div className="col-span-1 rounded-lg  hidden md:block">
                <span className="text-3xl font-medium text-left block">
                  {stats.totalCompletedTasks}
                </span>
                <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="grid grid-cols-1 gap-4 mt-4 max-h-[calc(100vh-12rem)] overflow-y-auto"
          style={{
            scrollbarWidth: "none",
          }}
        >
          {tasksToday?.map((task) => (
            <div
              key={task.id}
              className="bg-white text-black rounded-3xl p-4 h-fit"
            >
              <div className="flex justify-between items-start gap-8 border-b border-gray-100 pb-4">
                <h5
                  className={clsx(
                    "text-xl font-normal whitespace-nowrap overflow-hidden text-ellipsis",
                    task.status === "COMPLETED" && "line-through"
                  )}
                >
                  {task.title}
                </h5>
                <p
                  className={clsx(
                    "text-[10px] text-white px-2 py-1 rounded-full",
                    task.status === "COMPLETED" && "bg-green-500",
                    task.status === "IN_PROGRESS" && "bg-blue-500",
                    task.status === "PENDING" && "bg-red-500",
                    task.status === "NOT_STARTED" && "bg-yellow-500"
                  )}
                >
                  {task.status}
                </p>
              </div>
              <div className="grid grid-cols-12 gap-4 mt-4 border-b border-gray-100 pb-4">
                <p className="text-sm flex flex-col col-span-3">
                  <span className="text-gray-400 text-[12px]">Priority:</span>
                  <span>{task.priority}</span>
                </p>
                <p className="text-sm text-gray-500 col-span-6">
                  <span className="text-gray-400 text-[12px] ">
                    Description:
                  </span>
                  <span className="line-clamp-2">{task.description}</span>
                </p>
                <p className="text-sm flex flex-col text-gray-500 col-span-3">
                  <span className="text-gray-400 text-[12px]">Created At:</span>
                  <span>{dayjs(task.createdAt).format("MMM DD")}</span>
                </p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <p className="bg-red-300 px-2 py-1 rounded-md text-sm">Bug</p>
                  <p className="bg-blue-300 px-2 py-1 rounded-md text-sm">
                    Enhancement
                  </p>
                </div>
                {task.status !== "COMPLETED" ? (
                  <Button
                    variant="outlined"
                    shape="round"
                    color="geekblue"
                    onClick={() => moveTaskTo(task.id as string, "COMPLETED")}
                  >
                    Mark Done
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    shape="round"
                    color="geekblue"
                    onClick={() => moveTaskTo(task.id as string, "PENDING")}
                  >
                    Mark Undone
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4 items-end">
          <div className="w-full pl-6">
            <StreakWeek completedDates={[]} />
          </div>
          <div className="pl-6 w-full">
            <div className="flex justify-between items-center">
              <h5 className="text-2xl font-medium">Quick Requests</h5>
              <Button
                type="text"
                className="text-white hover:!text-white"
                onClick={() =>
                  setIsModalOpen((prev) => ({ ...prev, task: true }))
                }
              >
                <Plus size={16} /> Set Quick Task
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              {quickTasks?.map((task) => (
                <div
                  key={task.id}
                  className="text-white rounded-3xl px-4 py-2 group hover:bg-opacity-20"
                  style={{
                    backgroundColor: "rgba(204, 204, 204, 0.08)",
                    backdropFilter: "blur(5px)",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div className="flex justify-between items-start gap-8">
                    <h5
                      className={clsx(
                        "text-sm font-normal line-clamp-2",
                        task.status === "COMPLETED" && "line-through"
                      )}
                    >
                      {task.description}
                    </h5>
                    <div className="flex gap-2">
                      <Button
                        shape="circle"
                        className="group-hover:opacity-100 opacity-0 transition-opacity"
                        onClick={() => deleteQuickTask(task.id as string)}
                      >
                        <Trash size={14} />
                      </Button>
                      <Button
                        shape="circle"
                        onClick={() =>
                          updateQuickTask(task.id as string, "COMPLETED")
                        }
                      >
                        <CheckCheck size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={isModalOpen.task}
        onCancel={() => setIsModalOpen((prev) => ({ ...prev, task: false }))}
        footer={false}
      >
        <QuickTask setIsModalOpen={setIsModalOpen} />
      </Modal>
    </div>
  );
};

export default Home;
