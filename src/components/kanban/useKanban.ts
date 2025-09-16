// src/hooks/useKanban.ts
import { Form, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import useUserStore from "../../store/useUserStore";
import useKanbanStore, { FormValues, Task } from "./useKanbanStore";
import { AxiosResponse } from "axios";
import apiClient from "../../api/_setup";

export const useKanban = () => {
  const [form] = Form.useForm<FormValues>();
  const [editingTaskForm] = Form.useForm<FormValues>();
  const navigate = useNavigate();
  const { profile } = useUserStore();

  // Get state and actions from Zustand store
  const editingTask = useKanbanStore((state) => state.editingTask);
  const loading = useKanbanStore((state) => state.loading);
  const fetchTasks = useKanbanStore((state) => state.fetchTasks);
  const updateTask = useKanbanStore((state) => state.updateTask);
  const setEditingTask = useKanbanStore((state) => state.setEditingTask);
  const tasks = useKanbanStore((state) => state.tasks);
  const addTask = useKanbanStore((state) => state.addTask);

  const handleEdit = (task: Task) => {
    setEditingTask(task.id || null);

    editingTaskForm.setFieldsValue({
      priority: task.priority,
      title: task.title,
      id: task.id,
    });
  };

  const handleUpdateTask = () => {
    const updatedTask = {
      title: editingTaskForm.getFieldValue("title"),
      description: editingTaskForm.getFieldValue("description"),
      priority: editingTaskForm.getFieldValue("priority"),
    };
    const id = editingTaskForm.getFieldValue("id");

    updateTask(updatedTask, id);
  };

  const handleSubmit = async (values: Task) => {
    // Ensure repositoryId exists
    const repositoryId = (values as unknown as { repositoryId?: string })
      .repositoryId;
    if (!repositoryId) {
      message.error("Please select a repository");
      return;
    }

    const newTodo: Task = {
      ...values,
      id: form.getFieldValue("id") || undefined,
      status: form.getFieldValue("status"),
      isForAWeek: false,
      // Convert date Dayjs to string if present
      date: (values as any)?.date?.format
        ? (values as any).date.format("YYYY-MM-DD")
        : values.date,
    };
    try {
      const response: AxiosResponse<Task[]> = await apiClient.post("/tasks", [
        newTodo,
      ]);
      if (response.status === 200 || response.status === 201) {
        addTask(response.data[0]);
        message.success("Task added successfully!");
      } else {
        message.error("Failed to add task");
      }
    } catch (error) {
      console.error("Error submitting todos:", error);
      message.error("An error occurred while submitting todos");
    } finally {
      form.resetFields();
    }
  };

  useEffect(() => {
    if (!profile) {
      navigate("/login");
    } else {
      // Load todos on component mount
      fetchTasks();
    }
  }, [profile, navigate, fetchTasks]);

  return {
    form,
    editingTask,
    handleEdit,
    loading,
    updateTask: handleUpdateTask,
    editingTaskForm,
    tasks,
    handleSubmit,
  };
};

export default useKanban;
