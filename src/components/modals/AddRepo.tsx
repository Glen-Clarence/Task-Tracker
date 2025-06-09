import { Form, Input, DatePicker, Select, Button, message } from "antd";
import type { Dayjs } from "dayjs";
import { priorityOptions, statusOptions } from "../../utils/options";
import { ChartSpline, FlagTriangleRight, Plus } from "lucide-react";
import apiClient from "../../api/_setup";

const { TextArea } = Input;

enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

enum Status {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

interface AddRepoFormData {
  title: string;
  description: string;
  dueDate: Dayjs | null;
  priority: Priority;
  status: Status;
}

const AddRepo: React.FC = () => {
  const [form] = Form.useForm<AddRepoFormData>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await apiClient.post("/repositories", values);
      message.success("Repository created successfully");
      form.resetFields();
    } catch (error) {
      message.error("Failed to create repository");
      console.error("Validation failed:", error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="flex flex-col gap-4"
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: "Please enter the repo name" }]}
      >
        <Input placeholder="Enter repo name" />
      </Form.Item>

      <Form.Item
        name="description"
        rules={[
          { required: true, message: "Please enter the repo description" },
        ]}
      >
        <TextArea rows={4} placeholder="Enter repo description" />
      </Form.Item>

      <div className="flex gap-2">
        <Form.Item name="startDate">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Start"
            size="small"
            format="ddd, DD"
          />
        </Form.Item>
        <Form.Item name="targetDate">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Target"
            size="small"
            format="ddd, DD"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          rules={[{ required: true, message: "Please select priority" }]}
        >
          <Select
            size="small"
            options={priorityOptions}
            placeholder="Priority"
            style={{
              maxWidth: "200px",
              minWidth: "100px",
            }}
            suffixIcon={<FlagTriangleRight size={12} />}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="status"
          rules={[{ required: true, message: "Please select status" }]}
        >
          <Select
            size="small"
            options={statusOptions}
            placeholder="Status"
            style={{
              maxWidth: "200px",
              minWidth: "100px",
            }}
            suffixIcon={<ChartSpline size={12} />}
            allowClear
          />
        </Form.Item>
      </div>
      <Form.Item
        name="summary"
        rules={[{ required: true, message: "Please enter the repo summary" }]}
      >
        <TextArea rows={4} placeholder="Enter repo summary" />
      </Form.Item>
      <Form.Item className="flex justify-end">
        <Button
          type="primary"
          htmlType="submit"
          icon={<Plus size={12} />}
          size="small"
        >
          Add Repo
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddRepo;
