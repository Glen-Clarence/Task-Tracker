import { useQuery } from "@tanstack/react-query";
import useUserStore from "../../store/useUserStore";
import { usersApi } from "@/api/users.api";
import { taskApi } from "@/api/task.api";
import { Filter } from "../search/Search";
import { useState } from "react";

type TaskSummaryResponse = {
  summary: string;
};

const useAdmin = () => {
  const token = useUserStore((state) => state.token);
  const [search, setSearch] = useState<Filter[]>([]);

  const {
    data: taskSummary,
    isLoading,
    refetch: getTaskSummary,
  } = useQuery<TaskSummaryResponse>({
    queryKey: ["taskSummary", token],
    queryFn: async () => {
      console.log("Starting worker...");
      // Create a web worker with type: 'module'
      const worker = new Worker(
        new URL("./workers/taskSummary.worker.ts", import.meta.url),
        { type: "module" }
      );

      return new Promise((resolve, reject) => {
        // Listen for messages from the worker
        worker.onmessage = (event) => {
          worker.terminate(); // Clean up worker when done
          resolve(event.data);
        };

        worker.onerror = (error) => {
          worker.terminate();
          reject(error);
        };

        // Start the worker with the API call
        console.log("Sending message to worker...");
        worker.postMessage({
          type: "GET_TASK_SUMMARY",
          token, // Pass the token to the worker
        });
      });
    },
    enabled: false,
  });

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryFn: ({ queryKey }) => {
      const filters = queryKey[1] as Filter[];
      const searchParams = filters.reduce((acc, filter) => {
        if (filter.type === "name") acc.userId = filter.value.id;
        if (filter.type === "priority") acc.status = filter.value.id;
        if (filter.type === "date") acc.search = filter.value.label;
        return acc;
      }, {} as { search?: string; userId?: string; status?: string });
      return taskApi.getAll(searchParams);
    },
    queryKey: ["tasks", search],
  });

  return {
    taskSummary,
    isLoading,
    users,
    isUsersLoading,
    getTaskSummary,
    tasks: tasks?.tasks,
    isTasksLoading,
    search,
    setSearch,
  };
};

export default useAdmin;
