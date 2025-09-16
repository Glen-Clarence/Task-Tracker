import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CreateTaskForm from "@/components/forms/CreateTaskForm";

const CreateTask: React.FC = () => {
    const navigate = useNavigate();

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
                    <h1 className="text-xl font-medium text-white">Create New Task</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
                <div className="max-w-4xl mx-auto">
                    <CreateTaskForm />
                </div>
            </div>
        </div>
    );
};

export default CreateTask;