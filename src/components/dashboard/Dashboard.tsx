import { Spin } from "antd";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { notesApi } from "@/api/notes.api";
import { taskApi } from "@/api/task.api";
import { ArrowUpRight } from "lucide-react";

const Dashboard: React.FC = () => {
  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: notesApi.getAll,
  });
  const { data: tasks } = useQuery({
    queryFn: () => taskApi.getAll({ limit: 5 }),
    queryKey: ["tasks"],
  });
  const { data: stats } = useQuery({
    queryFn: taskApi.getStats,
    queryKey: ["stats"],
  });

  return (
    <Spin spinning={false}>
      <div className="text-white container mx-auto">
        <div className="grid grid-cols-3 text-white border-b pb-4 border-[#999]">
          <h1 className="text-2xl font-normal flex justify-start items-end">
            CCC-Tracker
          </h1>
          <p className="text-2xl font-normal flex justify-center items-end">
            Dashboard
          </p>
          <p className="text-2xl font-normal flex justify-end items-end">
            {dayjs().format("dddd Do")}
          </p>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 mt-4">
          {/* Notes Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium mb-2">Notes</h3>
              <ArrowUpRight />
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {notes?.map((note) => (
                <div key={note.id} className="bg-[#202020] p-2 rounded-lg">
                  <p className="text-gray-100 capitalize line-clamp-1">
                    {note.name}
                  </p>
                  <p className="text-xs text-gray-200">
                    {dayjs(note.createdAt).format("MMM D, YYYY")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium mb-2">Tasks</h3>
              <ArrowUpRight />
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {tasks?.tasks?.map((task) => (
                <div key={task.id} className="bg-[#202020] p-2 rounded-lg">
                  <p className="text-gray-100 capitalize line-clamp-3">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-200">
                    {dayjs(task.createdAt).format("MMM D, YYYY")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <h3 className="text-xl font-medium mb-2">Your Activity</h3>
            <div className="max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="col-span-1 rounded-lg ">
                  <span className="text-3xl font-medium text-left block">
                    {stats?.byStatus?.IN_PROGRESS}
                  </span>
                  <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                    Ongoing
                  </span>
                </div>
                <div className="col-span-1 rounded-lg ">
                  <span className="text-3xl font-medium text-left block">
                    {stats?.byStatus?.PENDING}
                  </span>
                  <span className="xl:text-sm text-[12px] font-bold text-gray-400 whitespace-nowrap">
                    In Progress
                  </span>
                </div>
                <div className="col-span-1 rounded-lg  hidden md:block">
                  <span className="text-3xl font-medium text-left block">
                    {stats?.byStatus?.COMPLETED}
                  </span>
                  <span className="text-gray-400 xl:text-sm text-[12px] font-bold">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Repositories Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <h3 className="text-xl font-medium mb-2">Percentages</h3>
            <div className="max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              <div className="flex justify-between">
                <span>
                  <h2 className="text-[3rem] font-normal mb-0">
                    {tasks?.tasks.length}%
                  </h2>
                  <p className="text-sm font-medium">Today's Productivity</p>
                </span>
                <span>
                  <h2 className="text-[3rem] font-normal mb-0">
                    {tasks?.tasks.length}%
                  </h2>
                  <p className="text-sm font-medium">Error Rate</p>
                </span>
              </div>
            </div>
          </div>

          {/* Issues Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <h3 className="text-xl font-medium mb-2">Issues</h3>
            <div className="max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              <p className="text-gray-400">Short content</p>
            </div>
          </div>

          {/* Pulseboard Section */}
          <div className="bg-[#2d2d2d] break-inside-avoid rounded-xl p-4 mb-4 max-h-96 overflow-hidden">
            <h3 className="text-xl font-medium mb-2">Pulseboard</h3>
            <div className="max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              <p className="text-gray-400">
                Medium length content that shows how items flow in the masonry
                grid layout with maximum height constraint and scrollable
                content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default Dashboard;
