import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  MenuProps,
  message,
  Select,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import {
  ChartSpline,
  Ellipsis,
  FlagTriangleRight,
  GitBranchPlus,
  ListCheck,
  Save,
  Tag,
  WandSparkles,
} from "lucide-react";

import { AxiosResponse } from "axios";
import apiClient from "../../api/_setup";
import useKanbanStore, { FormValues, Task } from "../kanban/useKanbanStore";
import { priorityOptions, statusOptions } from "../../utils/options";
import { elaborateTaskWithGroq } from "../../utils/groqTaskElaborator";

import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "@/api/tags.api";
import { projectsApi } from "@/api/projects.api";

interface EditTaskFormProps {
  task: Task;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({ task }) => {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();
  const { updateTaskLocal } = useKanbanStore();
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const tags = await tagsApi.getAll();
      return tags.map((tag) => ({
        value: tag.id,
        label: tag.name,
      }));
    },
  });

  const { data: repositories, isLoading: isLoadingRepositories } = useQuery({
    queryKey: ["repositories"],
    queryFn: async () => {
      const repositories = await projectsApi.getAll();
      return repositories.map((repository) => ({
        value: repository.id,
        label: repository.name,
      }));
    },
  });

  // Set initial form values when task or repositories change
  useEffect(() => {
    if (task && repositories) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        priority: task.priority || "MEDIUM",
        status: task.status || "NOT_STARTED",
        date: task.date ? dayjs(task.date) : dayjs(),
        tags: task.tags?.map(tag => tag.id),
        repositoryId: task.repository?.id,
        timeEstimate: task.timeEstimate,
      });
    }
  }, [task, repositories, form]);

  const handleSubmit = async (values: FormValues) => {
    const selectedRepositoryId = values.repositoryId;
    
    if (!selectedRepositoryId) {
      message.error("Please select a repository");
      return;
    }

    // Convert dayjs date to string format and prepare the task data similar to AddTask
    const updatedTask = {
      title: values.title,
      description: values.description,
      date: values.date ? values.date.format('YYYY-MM-DD') : task.date,
      status: values.status || "NOT_STARTED",
      priority: values.priority || "LOW",
      isForAWeek: false,
      repositoryId: selectedRepositoryId,
      tagIDs: values.tags || [],
      timeEstimate: values.timeEstimate,
    };

    console.log("Submitting task update:", updatedTask);

    try {
      const response: AxiosResponse<Task> = await apiClient.put(`/tasks/${task.id}`, updatedTask);
      
      if (response.status === 200 || response.status === 201) {
        updateTaskLocal(task.id!, response.data);
        message.success("Task updated successfully!");
        navigate("/dashboard");
      } else {
        message.error("Failed to update task");
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      if (error?.response?.data) {
        console.error("Error details:", error.response.data);
      }
      message.error("An error occurred while updating the task");
    }
  };

  const handleElaborate = async () => {
    const { repositoryId } = form.getFieldsValue() as Partial<FormValues> & {
      repositoryId?: string;
    };
    if (!repositoryId) {
      message.error("Please select a repository");
      return;
    }
    setLoadingAI(true);
    try {
      const elaboratedTask = await elaborateTaskWithGroq(
        form.getFieldValue("title")
      );
      form.setFieldValue("description", elaboratedTask);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Subtasks",
      icon: <GitBranchPlus size={12} />,
    },
    {
      key: "2",
      label: "Checklist",
      icon: <ListCheck size={12} />,
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <div className="grid grid-cols-1">
        <div>
          <Form.Item
            name="title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <TextArea rows={2} placeholder="Enter Your Task" />
          </Form.Item>
          <Button
            onClick={handleElaborate}
            loading={loadingAI}
            icon={<WandSparkles size={12} />}
            size="small"
            className="mb-2 !mt-2"
          >
            Write with AI
          </Button>
        </div>

        <Form.Item
          name="description"
          rules={[
            {
              required: true,
              message: "Please enter a description",
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="You dont have to enter a description just click elaborate with AI"
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-4 gap-2 items-center">
        <Form.Item
          name="priority"
          rules={[
            {
              required: true,
              message: "Please select a priority",
            },
          ]}
        >
          <Select
            placeholder="Priority"
            options={priorityOptions}
            size="small"
            allowClear
            suffixIcon={<FlagTriangleRight size={12} />}
          />
        </Form.Item>
        <Form.Item
          name="status"
          rules={[
            {
              required: true,
              message: "Please select a status",
            },
          ]}
        >
          <Select
            placeholder="Status"
            options={statusOptions}
            size="small"
            allowClear
            suffixIcon={<ChartSpline size={12} />}
          />
        </Form.Item>

        <Form.Item
          name="date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker
            format="ddd, DD"
            size="small"
            style={{
              width: "100%",
            }}
          />
        </Form.Item>
        <Form.Item name="tags">
          <Select
            placeholder="Tag"
            options={tags}
            size="small"
            style={{
              maxWidth: "200px",
              minWidth: "150px",
            }}
            loading={isLoadingTags}
            allowClear
            suffixIcon={<Tag size={12} />}
          />
        </Form.Item>
        <Form.Item
          name="repositoryId"
          rules={[{ required: true, message: "Please select a repository" }]}
        >
          <Select
            placeholder="Repository"
            options={repositories}
            loading={isLoadingRepositories}
            size="small"
            style={{
              maxWidth: "200px",
              minWidth: "120px",
            }}
            allowClear
            suffixIcon={<GitBranchPlus size={12} />}
          />
        </Form.Item>
        <Form.Item name="timeEstimate">
          <Select
            placeholder="Time Estimate"
            options={[
              {
                value: "1",
                label: "Less than an hour",
              },
              {
                value: "2",
                label: "Within 2 hours",
              },
              {
                value: "3",
                label: "Within 4 hours",
              },
              {
                value: "4",
                label: "Within 6 hours",
              },
              {
                value: "5",
                label: "Within 8 hours",
              },
              {
                value: "6",
                label: "More than 8 hours",
              },
            ]}
            size="small"
            style={{
              maxWidth: "200px",
              minWidth: "150px",
            }}
            loading={isLoadingTags}
            allowClear
            suffixIcon={<Tag size={12} />}
          />
        </Form.Item>
        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Button
            size="small"
            icon={<Ellipsis size={12} className="text-gray-500" />}
          />
        </Dropdown>
      </div>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<Save size={12} />}
          size="small"
          block
          className="!w-fit ml-auto !flex"
        >
          Update Task
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EditTaskForm;