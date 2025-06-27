import { Form, Input, DatePicker, Select, Button, message } from "antd";
import type { Dayjs } from "dayjs";
import { priorityOptions, statusOptions } from "../../utils/options";
import { ChartSpline, FlagTriangleRight, Plus } from "lucide-react";
import apiClient from "../../api/_setup";

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

interface AddIssueFormData {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  targetDate: Dayjs | null;
}

const AddIssue: React.FC = () => {
  const [form] = Form.useForm<AddIssueFormData>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await apiClient.post("/issues", values);
      message.success("Issue created successfully");
      form.resetFields();
    } catch (error) {
      message.error("Failed to create issue");
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
        name="title"
        rules={[{ required: true, message: "Please enter the issue title" }]}
      >
        <Input placeholder="Enter issue title" />
      </Form.Item>

      <Form.Item
        name="description"
        rules={[
          { required: true, message: "Please enter the issue description" },
        ]}
      >
        <div className="relative"></div>
      </Form.Item>

      <div className="flex gap-2">
        <Form.Item name="dueDate">
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
      <Form.Item className="flex justify-end">
        <Button
          type="primary"
          htmlType="submit"
          icon={<Plus size={12} />}
          size="small"
        >
          Add Issue
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddIssue;
