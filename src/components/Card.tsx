import { ArrowUp, Clock, Pencil, Trash } from "lucide-react";
import { Button, Form, FormInstance, Popconfirm, Select } from "antd";
import { FormValues, Task } from "./kanban/useKanbanStore";
import { priorityOptions } from "../utils/options";
import useUserStore from "../store/useUserStore";
import TextArea from "antd/es/input/TextArea";

export default function TrelloCard({
  cardData,
  handleDelete,
  handleEdit,
  editingTaskForm,
  editingTodo,
  updateTodo,
}: {
  cardData: Task;
  handleDelete?: () => void;
  handleEdit?: () => void;
  editingTaskForm?: FormInstance<FormValues>;
  editingTodo?: string | null;
  updateTodo?: () => void;
}) {
  const { profile } = useUserStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Determine label color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-blue-500";
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "PENDING":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center justify-center w-full transition-all duration-300 h-full">
      <div className="bg-white rounded-md shadow-md w-64 p-3 cursor-pointer h-full">
        {/* Priority and Status as Labels */}
        <div className="flex flex-wrap gap-1 mb-2">
          <div
            className={`${getPriorityColor(
              cardData.priority as string
            )} text-[10px] text-white px-1 py-0.5 flex items-center justify-center rounded-md font-medium`}
          >
            {cardData.priority}
          </div>
          {profile?.role !== "ADMIN" && (
            <>
              {editingTodo === cardData.id ? (
                <Button
                  type="primary"
                  size="small"
                  className="!ml-auto"
                  onClick={updateTodo}
                >
                  <ArrowUp size={12} />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="small"
                  className="!ml-auto"
                  onClick={handleEdit}
                >
                  <Pencil size={12} />
                </Button>
              )}
            </>
          )}

          {profile?.role !== "ADMIN" && (
            <Popconfirm
              title="Are you sure you want to delete this todo?"
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button type="default" size="small">
                <Trash size={12} />
              </Button>
            </Popconfirm>
          )}
          {profile?.role === "ADMIN" && (
            <div
              className={`${getPriorityColor(
                cardData.status as string
              )} text-[10px] text-white px-2 py-1 rounded-md font-medium ml-auto`}
            >
              {cardData.status}
            </div>
          )}
        </div>

        {/* Card Title */}
        {editingTodo !== cardData.id ? (
          <>
            {cardData.user?.name && (
              <h2 className="text-sm text-gray-700 font-semibold mb-2">
                {cardData.user?.name}
              </h2>
            )}
            <h3 className="text-sm line-clamp-3">{cardData.title}</h3>

            <p className="text-xs text-gray-600 mb-3 overflow-hidden line-clamp-2">
              {cardData.description}
            </p>
          </>
        ) : (
          <Form
            form={editingTaskForm}
            layout="vertical"
            size="small"
            onFinish={updateTodo}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <TextArea rows={4} placeholder="Enter Your Task" />
            </Form.Item>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[
                {
                  required: true,
                  message: "Please select a priority",
                },
              ]}
            >
              <Select placeholder="Select priority" options={priorityOptions} />
            </Form.Item>
          </Form>
        )}

        {/* Card Footer */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center text-[10px] text-gray-500">
            <Clock size={10} className="mr-1" />
            <span>{formatDate(cardData.date as string)}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span>id: {cardData.id?.slice(0, 5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
