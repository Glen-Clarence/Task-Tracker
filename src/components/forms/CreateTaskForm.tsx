import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    CalendarDays,
    Flag,
    GitBranch,
    Clock,
    Tag,
    Sparkles,
    Plus,
    Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "@/api/tags.api";
import { projectsApi } from "@/api/projects.api";
import useKanbanStore, { Task } from "../kanban/useKanbanStore";
import { message } from "antd";
import apiClient from "../../api/_setup";
import { AxiosResponse } from "axios";
import { elaborateTaskWithGroq } from "../../utils/groqTaskElaborator";

interface TaskFormData {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: "NOT_STARTED" | "IN_PROGRESS" | "PENDING" | "COMPLETED";
    repositoryId: string;
    timeEstimate?: string;
    tags?: string[];
    date: string;
}

const CreateTaskForm: React.FC = () => {
    const navigate = useNavigate();
    const { addTask } = useKanbanStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isElaborating, setIsElaborating] = useState(false);

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

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        getValues,
    } = useForm<TaskFormData>({
        defaultValues: {
            priority: "MEDIUM",
            status: "NOT_STARTED",
            date: new Date().toISOString().split('T')[0],
            tags: [],
        },
    });

    const watchedTitle = watch("title");
    const watchedRepositoryId = watch("repositoryId");

    const handleElaborate = async () => {
        if (!watchedTitle) {
            message.error("Please enter a title first");
            return;
        }
        if (!watchedRepositoryId) {
            message.error("Please select a repository first");
            return;
        }

        setIsElaborating(true);
        try {
            const elaboratedDescription = await elaborateTaskWithGroq(watchedTitle);
            setValue("description", elaboratedDescription);
            message.success("Description generated successfully!");
        } catch (error) {
            console.error("Error elaborating task:", error);
            message.error("Failed to generate description");
        } finally {
            setIsElaborating(false);
        }
    };

    const onSubmit = async (data: TaskFormData) => {
        // Basic validation
        if (!data.title?.trim()) {
            message.error("Title is required");
            return;
        }
        if (!data.description?.trim()) {
            message.error("Description is required");
            return;
        }
        if (!data.repositoryId) {
            message.error("Repository is required");
            return;
        }

        setIsSubmitting(true);

        const newTask: Task = {
            ...data,
            isForAWeek: false,
            tagIDs: data.tags || [],
            tags: undefined, // Remove tags property to avoid type conflict
        };

        try {
            const response: AxiosResponse<Task[]> = await apiClient.post("/tasks", [newTask]);

            if (response.status === 200 || response.status === 201) {
                addTask(response.data[0]);
                message.success("Task created successfully!");
                navigate("/dashboard");
            } else {
                message.error("Failed to create task");
            }
        } catch (error) {
            console.error("Error creating task:", error);
            message.error("An error occurred while creating the task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const priorityColors = {
        LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    const statusColors = {
        NOT_STARTED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
    };

    return (
        <Card className="bg-[#1a1a1a] border-gray-800 text-white">
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Title Section */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium text-gray-200">
                            Task Title
                        </Label>
                        <Input
                            id="title"
                            {...register("title", { required: "Title is required" })}
                            placeholder="Enter a descriptive title for your task..."
                            className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-400">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-200">
                                Description
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleElaborate}
                                disabled={isElaborating || !watchedTitle}
                                className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                            >
                                {isElaborating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                {isElaborating ? "Generating..." : "Generate with AI"}
                            </Button>
                        </div>
                        <Textarea
                            id="description"
                            {...register("description", { required: "Description is required" })}
                            placeholder="Describe what needs to be done..."
                            rows={4}
                            className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-400">{errors.description.message}</p>
                        )}
                    </div>

                    <Separator className="bg-gray-800" />

                    {/* Task Properties Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                Priority
                            </Label>
                            <Select onValueChange={(value) => setValue("priority", value as any)} defaultValue="MEDIUM">
                                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                                    <SelectItem value="LOW" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={priorityColors.LOW}>
                                                Low
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="MEDIUM" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={priorityColors.MEDIUM}>
                                                Medium
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="HIGH" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={priorityColors.HIGH}>
                                                High
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priority && (
                                <p className="text-sm text-red-400">{errors.priority.message}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Status
                            </Label>
                            <Select onValueChange={(value) => setValue("status", value as any)} defaultValue="NOT_STARTED">
                                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                                    <SelectItem value="NOT_STARTED" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={statusColors.NOT_STARTED}>
                                                Not Started
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="IN_PROGRESS" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={statusColors.IN_PROGRESS}>
                                                In Progress
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="PENDING" className="text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={statusColors.PENDING}>
                                                Pending
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-red-400">{errors.status.message}</p>
                            )}
                        </div>

                        {/* Repository */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Repository
                            </Label>
                            <Select onValueChange={(value) => setValue("repositoryId", value)} disabled={isLoadingRepositories}>
                                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectValue placeholder="Select repository..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                                    {repositories?.map((repo) => (
                                        <SelectItem key={repo.value} value={repo.value} className="text-white hover:bg-gray-800">
                                            {repo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.repositoryId && (
                                <p className="text-sm text-red-400">{errors.repositoryId.message}</p>
                            )}
                        </div>

                        {/* Time Estimate */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Time Estimate
                            </Label>
                            <Select onValueChange={(value) => setValue("timeEstimate", value)}>
                                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectValue placeholder="Select time estimate..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                                    <SelectItem value="1" className="text-white hover:bg-gray-800">Less than an hour</SelectItem>
                                    <SelectItem value="2" className="text-white hover:bg-gray-800">Within 2 hours</SelectItem>
                                    <SelectItem value="3" className="text-white hover:bg-gray-800">Within 4 hours</SelectItem>
                                    <SelectItem value="4" className="text-white hover:bg-gray-800">Within 6 hours</SelectItem>
                                    <SelectItem value="5" className="text-white hover:bg-gray-800">Within 8 hours</SelectItem>
                                    <SelectItem value="6" className="text-white hover:bg-gray-800">More than 8 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Due Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                {...register("date", { required: "Date is required" })}
                                className="bg-[#1a1a1a] border-gray-700 text-white focus:border-blue-500"
                            />
                            {errors.date && (
                                <p className="text-sm text-red-400">{errors.date.message}</p>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Tags (Optional)
                            </Label>
                            <Select onValueChange={(value) => {
                                const currentTags = getValues("tags") || [];
                                if (!currentTags.includes(value)) {
                                    setValue("tags", [...currentTags, value]);
                                }
                            }} disabled={isLoadingTags}>
                                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectValue placeholder="Select tags..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                                    {tags?.map((tag) => (
                                        <SelectItem key={tag.value} value={tag.value} className="text-white hover:bg-gray-800">
                                            {tag.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/dashboard")}
                            className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateTaskForm;