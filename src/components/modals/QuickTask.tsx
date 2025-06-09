import { Button, ConfigProvider, Form, message, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { ChartSpline, PlusIcon } from "lucide-react";

import { AxiosResponse } from "axios";
import apiClient from "../../api/_setup";
import useKanbanStore, {
  FormValues,
  QuickTaskType,
  Task,
} from "../kanban/useKanbanStore";

import dayjs from "dayjs";
import { statusOptions } from "../../utils/options";

const QuickTask: React.FC<{
  setIsModalOpen: React.Dispatch<
    React.SetStateAction<{
      task?: boolean;
      issue?: boolean;
    }>
  >;
}> = ({ setIsModalOpen }) => {
  const [form] = Form.useForm<FormValues>();
  const addQuickTask = useKanbanStore((state) => state.addQuickTask);

  const handleSubmit = async (values: QuickTaskType) => {
    try {
      const response: AxiosResponse<QuickTaskType> = await apiClient.post(
        "/quicktasks",
        values
      );
      if (response.status === 200 || response.status === 201) {
        addQuickTask(response.data);
        message.success("Quick Task added successfully!");
      } else {
        message.error("Failed to add quick task");
      }
    } catch (error) {
      console.error("Error submitting todos:", error);
      message.error("An error occurred while submitting todos");
    } finally {
      setIsModalOpen((prev) => ({ ...prev, task: false }));
      form.resetFields();
    }
  };

  return (
    <>
      <h2 className="text-sm">Add Quick Task</h2>
      <ConfigProvider
        theme={{
          components: {
            Input: {
              colorBorder: "transparent",
              activeBorderColor: "transparent",
              activeShadow: "none",
              hoverBg: "#f2f2f2",
              hoverBorderColor: "transparent",
              activeBg: "#f2f2f2",
            },
            Form: {
              itemMarginBottom: 0,
            },
          },
          token: {
            fontSize: 12,
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleSubmit(values as Task)}
          initialValues={{
            date: dayjs(), // Get today's date using dayjs
          }}
        >
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Form.Item
              name="description"
              rules={[
                {
                  required: true,
                  message: "Please enter a description",
                },
              ]}
            >
              <TextArea rows={4} placeholder="Describe your quicktask" />
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
                  width: "100px",
                }}
                allowClear
                suffixIcon={<ChartSpline size={12} />}
              />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusIcon size={12} />}
              size="small"
              block
              className="!w-fit ml-auto !flex mt-4"
            >
              Add Quick Task
            </Button>
          </Form.Item>
        </Form>
      </ConfigProvider>
    </>
  );
};

export default QuickTask;
