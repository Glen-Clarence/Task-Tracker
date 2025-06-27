import { useEffect, useState } from "react";

import useKanbanStore, { Task } from "../../components/kanban/useKanbanStore";
import useUserStore from "../../store/useUserStore";

import { message, Modal } from "antd";

import clsx from "clsx";
import dayjs from "dayjs";
import QuickTask from "../../components/modals/QuickTask";
import { ArrowUpToLine } from "lucide-react";
import { AxiosResponse } from "axios";
import apiClient from "@/api/_setup";
import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "@/api/tags.api";
// import TextArea from "antd/es/input/TextArea";
import { priorityOptions, statusOptions } from "@/utils/options";
import {
  SelectContent,
  SelectValue,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Select,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
  const getQuickTasks = useKanbanStore((state) => state.getQuickTasks);
  const addTask = useKanbanStore((state) => state.addTask);
  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const tags = await tagsApi.getAll();
      return tags.map((tag) => ({
        value: tag.id,
        label: tag.name,
      }));
    },
  });

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      title: "",
      priority: "LOW",
      status: "NOT_STARTED",
      tagIDs: [],
      isRecurring: false,
    },
  });

  const onSubmit = async (values: Task) => {
    const newTodo: Task = {
      title: values.title,
      priority: values.priority,
      status: values.status,
      date: dayjs().format("YYYY-MM-DD"),
      isForAWeek: false,
      tagIDs: [values.tagIDs as unknown as string],
      isRecurring: values.isRecurring,
    };
    try {
      const response: AxiosResponse<Task[]> = await apiClient.post("/tasks", [
        newTodo,
      ]);

      if (response.status === 200 || response.status === 201) {
        addTask(response.data[0]);
        message.success("Task added successfully!");
        setIsModalOpen((prev) => ({ ...prev, task: false }));
      } else {
        message.error("Failed to add task");
      }
    } catch (error) {
      console.error("Error submitting todos:", error);
      message.error("An error occurred while submitting todos");
    }
  };

  useEffect(() => {
    fetchTasks();
    getQuickTasks();
  }, []);

  const tasksToday = tasks
    .filter((task) => {
      const created = new Date(task.createdAt as string);
      const now = new Date();
      return (
        (created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth() &&
          created.getDate() === now.getDate()) ||
        task.status !== "COMPLETED"
      );
    })
    .sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
      return 0;
    });

  return (
    <div>
      <div className="container mx-auto 2xl:max-w-[100%] grid grid-cols-3 text-white border-b pb-4 border-[#999]">
        <h1 className="text-2xl font-normal flex justify-start items-end">
          CCC-Tracker
        </h1>
        <p className="text-2xl font-normal flex justify-center items-end">
          Todays Tasks
        </p>
        <p className="text-2xl font-normal flex justify-end items-end ">
          {dayjs().format("dddd Do")}
        </p>
      </div>

      <div className="container mx-auto 2xl:max-w-[100%] pl-4  py-4  text-white pb-4">
        <div
          className="grid grid-cols-1 mx-auto gap-4 mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <div className="flex w-[60%] mx-auto flex-col items-center justify-start">
            <h3 className="text-4xl font-medium">{dayjs().format("h:mm")}</h3>
            <h1 className="text-2xl font-normal text-center">
              Hy, {profile?.name.split(" ")[0]}
            </h1>
            <p className="text-gray-500 text-xl">What's on your mind today?</p>
            <div className="mx-auto p-4 w-full">
              <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#2d2d2d] rounded-3xl">
                {/* Main Input Area */}
                <div className="relative">
                  <Textarea
                    {...register("title", {
                      required: "Please enter a task",
                    })}
                    placeholder="Enter your task..."
                    className="min-h-[50px] h-14 resize-y border-0 shadow-none focus-visible:ring-0 text-base p-0 placeholder:text-gray-400 text-white bg-transparent"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                      }
                    }}
                  />
                </div>

                {/* Selection Row */}
                <div className="">
                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Priority Select as Button */}
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-[140px] h-8 hover:bg-black/20 text-sm font-medium text-white border-none rounded-full">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#202020]">
                            <SelectGroup>
                              {priorityOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="!text-white hover:!bg-black/20 hover:!border-none  focus:!border-none"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {/* Status Select as Button */}
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-[140px] h-8 hover:bg-black/20 text-sm font-medium text-white border-none rounded-full">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#202020]">
                            <SelectGroup>
                              {statusOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="!text-white hover:!bg-black/20 hover:!border-none  focus:!border-none"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {/* Tag Select as Button */}
                    <Controller
                      name="tagIDs"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value as unknown as string}
                        >
                          <SelectTrigger className="w-[120px] h-8 hover:bg-black/20 text-sm font-medium text-white border-none rounded-full">
                            <SelectValue placeholder="Tag" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#202020]">
                            <SelectGroup className="max-h-[200px] overflow-y-auto">
                              {tags?.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="!text-white hover:!bg-black/20 hover:!border-black  focus:!border-black"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <Controller
                      name="isRecurring"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <p>Recurring</p>
                        </div>
                      )}
                    />

                    <div className="ml-auto p-2 bg-white rounded-full cursor-pointer">
                      <ArrowUpToLine
                        color="#000"
                        size={16}
                        onClick={handleSubmit(onSubmit)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {tasksToday?.map((task) => (
              <div
                key={task.id}
                className="bg-[#2d2d2d] col-span-1 text-white rounded-3xl p-4 h-fit"
              >
                <div className="flex justify-between items-start gap-8 border-b border-[#363636] pb-4">
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
                      "text-[10px] px-2 py-1 rounded-full",
                      task.status === "COMPLETED" && "bg-green-200 text-black",
                      task.status === "IN_PROGRESS" && "bg-blue-200 text-black",
                      task.status === "PENDING" && "bg-red-200 text-black",
                      task.status === "NOT_STARTED" &&
                        "bg-yellow-200 text-black"
                    )}
                  >
                    {task.status}
                  </p>
                </div>
                <div className="grid grid-cols-12 gap-4 mt-4 border-b border-[#363636] pb-4">
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
                    <span className="text-gray-400 text-[12px]">
                      Created At:
                    </span>
                    <span>{dayjs(task.createdAt).format("MMM DD")}</span>
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    {task?.tags?.map((tag) => (
                      <p className="bg-gray-200 capitalize text-black px-2 py-1 rounded-md text-sm">
                        {tag.name}
                      </p>
                    ))}
                  </div>
                  {task.status !== "COMPLETED" ? (
                    <Button
                      // variant="outlined"
                      // shape="round"
                      color="geekblue"
                      onClick={() => moveTaskTo(task.id as string, "COMPLETED")}
                    >
                      Mark Done
                    </Button>
                  ) : (
                    <Button
                      // variant="outlined"
                      // shape="round"
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
