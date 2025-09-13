import {
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Modal, Dropdown, MenuProps } from "antd";
import QuickAdd from "../modals/QuickAdd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddFolder from "../modals/AddFolder";
import Addnotes from "../modals/Addnotes";
import { useNavigate } from "react-router";
import useKanbanStore, { Task } from "../kanban/useKanbanStore";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, fetchTasks, deleteTask, moveTaskTo } = useKanbanStore();
  const [isModalOpen, setIsModalOpen] = useState<{
    task?: boolean;
    issue?: boolean;
  }>({
    task: false,
    issue: false,
  });

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const quickActions = [
    { title: "Create new task", subtitle: "Add task to your project", color: "bg-gradient-to-br from-orange-500 to-pink-500" },
    { title: "Create new project", subtitle: "New project in your space", color: "bg-gradient-to-br from-purple-500 to-blue-500" },
    { title: "Create new folder", subtitle: "New folder in your project", color: "bg-gradient-to-br from-blue-500 to-cyan-500" },
    { title: "Create new doc", subtitle: "New doc in your folder", color: "bg-gradient-to-br from-purple-600 to-pink-600" },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500";
      case "IN_PROGRESS":
        return "text-blue-500";
      case "PENDING":
        return "text-yellow-500";
      case "NOT_STARTED":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const handleTaskEdit = (task: Task) => {
    // Navigate to edit task or open edit modal
    navigate(`/dashboard/edit-task/${task.id}`);
  };

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleMarkAsComplete = async (taskId: string) => {
    await moveTaskTo(taskId, "COMPLETED");
  };

  const getTaskMenuItems = (task: Task): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => handleTaskEdit(task),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: () => handleTaskDelete(task.id!),
      danger: true,
    },
  ];

  return (
    <div className="bg-[#1a1a1a] text-white min-h-screen">
      {/* Top Bar */}
      <div className="h-16 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-6 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate("/dashboard/create-task")}
          >
            Add task
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`${action.color} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => {
                if (action.title === "Create new task") {
                  navigate("/dashboard/create-task");
                } else if (action.title === "Create new folder") {
                  setIsFolderDialogOpen(true);
                } else if (action.title === "Create new doc") {
                  setIsNoteDialogOpen(true);
                }
              }}
            >
              <h3 className="font-medium text-white mb-1">{action.title}</h3>
              <p className="text-sm text-white/80">{action.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
          <h2 className="text-xl font-medium text-white mb-4">My Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : task.status === 'IN_PROGRESS' ? (
                      <Circle size={16} className="text-blue-500 flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status!)} bg-opacity-20`}>
                      {task.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <Dropdown
                    menu={{ items: getTaskMenuItems(task) }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                  </Dropdown>
                </div>

                <div className="mb-3">
                  <h3 className={`font-medium text-sm mb-2 overflow-hidden ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-white'}`}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-400 overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                    {task.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Added:</span>
                    <span className="text-gray-400">{formatDate(task.createdAt || task.date!)}</span>
                  </div>

                  {task.repository && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Repository:</span>
                      <span className="text-blue-400 bg-blue-600/20 px-2 py-1 rounded-full">
                        {task.repository.name}
                      </span>
                    </div>
                  )}

                  {task.priority && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'HIGH' ? 'bg-red-600/20 text-red-400' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-blue-600/20 text-blue-400'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mark as Complete Button */}
                {task.status !== 'COMPLETED' && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsComplete(task.id!)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-7"
                    >
                      <CheckCircle2 size={12} className="mr-1" />
                      Mark as Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                <Circle size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No tasks yet</p>
                <p className="text-sm mb-4">Create your first task to get started</p>
                <Button
                  onClick={() => navigate("/dashboard/create-task")}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Quick Add */}
      <Modal
        open={isModalOpen.task}
        onCancel={() => setIsModalOpen({ ...isModalOpen, task: false })}
        footer={null}
        width={800}
      >
        <QuickAdd setIsModalOpen={setIsModalOpen} />
      </Modal>

      {/* Dialog for Add Folder */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Folder</DialogTitle>
          </DialogHeader>
          <AddFolder setIsModalOpen={setIsFolderDialogOpen} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Add Note */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Addnotes setIsModalOpen={setIsNoteDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
