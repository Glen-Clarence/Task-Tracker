import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EditTaskForm from "@/components/modals/EditTaskForm";
import useKanbanStore, { Task } from "@/components/kanban/useKanbanStore";

const EditTask: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { tasks, fetchTasks } = useKanbanStore();
    const [task, setTask] = useState<Task | null>(null);

    useEffect(() => {
        if (tasks.length === 0) {
            fetchTasks();
        }
    }, [tasks.length, fetchTasks]);

    useEffect(() => {
        if (id && tasks.length > 0) {
            const foundTask = tasks.find(t => t.id === id);
            setTask(foundTask || null);
        }
    }, [id, tasks]);

    if (!task) {
        return (
            <div className="bg-[#1a1a1a] text-white">
                <div className="h-16 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-6 mb-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/dashboard")}
                            className="text-gray-400 hover:bg-white/10 active:bg-white/20"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-xl font-medium text-white">Edit Task</h1>
                    </div>
                </div>
                <div className="px-6 pb-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 text-center">
                            <p className="text-gray-400">Loading task...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] text-white">
            {/* Top Bar */}
            <div className="h-16 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-6 mb-6 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                        className="text-gray-400 hover:bg-white/10 active:bg-white/20"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-xl font-medium text-white">Edit Task</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <EditTaskForm task={task} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTask;