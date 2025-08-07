import { useState } from "react";

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
  PlusIcon,
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

const AddTask: React.FC<{
  setIsModalOpen: React.Dispatch<
    React.SetStateAction<{
      task?: boolean;
      issue?: boolean;
    }>
  >;
}> = ({ setIsModalOpen }) => {
  const [form] = Form.useForm<FormValues>();
  const addTask = useKanbanStore((state) => state.addTask);
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

  const handleSubmit = async (values: Task) => {
    const newTodo: Task = {
      ...values,
      status: form.getFieldValue("status") || "NOT_STARTED",
      priority: form.getFieldValue("priority") || "LOW",
      isForAWeek: false,
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
    } finally {
      form.resetFields();
    }
  };

  const handleElaborate = async () => {
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
      onFinish={(values) => handleSubmit(values as Task)}
      initialValues={{
        date: dayjs(), // Get today's date using dayjs
      }}
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

      <div className="flex gap-2 items-center">
        <Form.Item
          name="priority"
          // label="Priority"
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
            style={{
              maxWidth: "100px",
            }}
            allowClear
            suffixIcon={<FlagTriangleRight size={12} />}
          />
        </Form.Item>
        <Form.Item
          name="status"
          // label="Priority"
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
            style={{
              maxWidth: "200px",
              minWidth: "100px",
            }}
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
              maxWidth: "100px",
            }}
          />
        </Form.Item>
        <Form.Item
          name="tags"
          // label="Priority"
          rules={[
            {
              required: true,
              message: "Please select a tag",
            },
          ]}
        >
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
          name="repository"
        >
          <Select
            placeholder="Repository"
            options={[
              { label: "Frontend", value: "frontend" },
              { label: "Backend", value: "backend" },
              { label: "Mobile", value: "mobile" },
              { label: "DevOps", value: "devops" },
              { label: "Database", value: "database" },
              { label: "API", value: "api" },
            ]}
            size="small"
            style={{
              maxWidth: "200px",
              minWidth: "120px",
            }}
            allowClear
            suffixIcon={<GitBranchPlus size={12} />}
          />
        </Form.Item>
        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Button
            size="small"
            // ghost
            icon={<Ellipsis size={12} className="text-gray-500" />}
          />
        </Dropdown>
      </div>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusIcon size={12} />}
          size="small"
          block
          className="!w-fit ml-auto !flex"
        >
          Add Task
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddTask;
