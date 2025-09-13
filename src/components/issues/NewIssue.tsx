import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useIssues } from "./useIssues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CircleDot, Play, CheckCircle2, XCircle, X, Users, Building } from "lucide-react";
import { Issue, IssueStatus } from "@/api/issues.api";
import { projectsApi } from "@/api/projects.api";
import { UserProfile } from "@/api/users.api";

type IssuePriority = "LOW" | "MEDIUM" | "HIGH";

type CreateIssueFormData = Omit<Issue, "id" | "createdAt" | "updatedAt"> & {
  repositoryId: string;
  assignedToIds: string[];
  dueDate?: Date;
  tagIDs?: string[];
};

const NewIssue = () => {
  const navigate = useNavigate();
  const { id: repositoryId } = useParams();
  const { createIssue, isCreating } = useIssues();

  const [formData, setFormData] = useState<CreateIssueFormData>({
    title: "",
    description: "",
    priority: "MEDIUM" as IssuePriority,
    status: "NOT_STARTED" as IssueStatus,
    repositoryId: repositoryId || "",
    assignedToIds: [],
    dueDate: undefined,
    tagIDs: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAssignees, setSelectedAssignees] = useState<UserProfile[]>([]);
  const [createMore, setCreateMore] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all repositories
  const { data: repositories = [], isLoading: loadingRepos } = useQuery({
    queryKey: ["repositories"],
    queryFn: projectsApi.getAll,
  });

  // Fetch users for the selected repository
  const { data: repositoryUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["repository-users", formData.repositoryId],
    queryFn: () => projectsApi.getUsers(formData.repositoryId!),
    enabled: !!formData.repositoryId,
  });

  // Available users for assignment (members + lead)
  const availableUsers = repositoryUsers
    ? [...repositoryUsers.members, repositoryUsers.lead]
    : [];

  // Update assignedToIds when selectedAssignees changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assignedToIds: selectedAssignees.map(user => user.id)
    }));
  }, [selectedAssignees]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    if (!formData.repositoryId) {
      newErrors.repositoryId = "Repository is required";
    }

    if (formData.description && formData.description.trim().length < 2) {
      newErrors.description = "Description must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Create the issue data in the format expected by the API
      const issueData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        // Convert assignedToIds to the format expected by the backend
        assignedToIds: formData.assignedToIds || [],
        repositoryId: formData.repositoryId,
        // Add default values for required fields
        dueDate: undefined,
        tagIDs: []
      };

      await createIssue(issueData);

      if (createMore) {
        // Reset form for creating another issue while keeping repository context
        setFormData(prev => ({
          ...prev,
          title: "",
          description: "",
          priority: "MEDIUM" as IssuePriority,
          status: "NOT_STARTED" as IssueStatus,
          assignedToIds: [],
          tagIDs: [],
          dueDate: undefined
        }));
        setSelectedAssignees([]);
        setErrors({});
      } else {
        // Navigate back to issues list
        navigate(-1);
      }
    } catch (error) {
      console.error("Failed to create issue:", error);
    }
  };

  const handleInputChange = (field: keyof CreateIssueFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Clear assignees when repository changes
    if (field === "repositoryId") {
      setSelectedAssignees([]);
    }
  };

  const handleAssigneeToggle = (user: UserProfile) => {
    setSelectedAssignees(prev => {
      const isSelected = prev.some(assignee => assignee.id === user.id);
      if (isSelected) {
        return prev.filter(assignee => assignee.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeAssignee = (userId: string) => {
    setSelectedAssignees(prev => prev.filter(assignee => assignee.id !== userId));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white hover:bg-black/10 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Button>
        </div>

        {/* Title Section */}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-grey border-slate-700/50 backdrop-blur-sm shadow-2xl">
                <div className="p-8 space-y-6">
                  {/* Title */}
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-white text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Issue Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className={`bg-black border-slate-600 text-white placeholder:text-gray-400 text-lg py-3 px-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 ${errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                        }`}
                    />
                    {errors.title && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        {errors.title}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-white text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Type your description here..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={10}
                      className="resize-none bg-black border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                    />

                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setAttachments(files);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-gray-200 text-sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📎 Click to Add Files.
                        </Button>
                        {attachments.length > 0 && (
                          <div className="text-xs text-gray-400">
                            Selected {attachments.length} file{attachments.length > 1 ? "s" : ""}: {attachments
                              .slice(0, 3)
                              .map((f) => f.name)
                              .join(", ")}{attachments.length > 3 ? " + more" : ""}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="create-more"
                            checked={createMore}
                            onChange={(e) => setCreateMore(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-black border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <Label htmlFor="create-more" className="text-sm text-gray-300">
                            Create more
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(-1)}
                          disabled={isCreating}
                          className="border-slate-600 text-black-800 hover:text-white hover:bg-black/50"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isCreating ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </div>
                          ) : (
                            "Create"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <Card className="bg-grey border-slate-700/50 backdrop-blur-sm shadow-2xl rounded-md">
              <div className="p-8 space-y-6">
                {/* Repository */}
                <div>
                  <Label className="text-white text-lg font-semibold">Repository</Label>
                  <Select
                    value={formData.repositoryId || ""}
                    onValueChange={(value: string) => handleInputChange("repositoryId", value)}
                    disabled={loadingRepos}
                  >
                    <SelectTrigger className="bg-black border-slate-600 text-white w-full">
                      <SelectValue placeholder="Choose a repository" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-slate-700">
                      {repositories.map(repo => (
                        <SelectItem key={repo.id} value={repo.id} className="text-white">
                          {repo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.repositoryId && <div className="text-red-400 text-xs mt-1">{errors.repositoryId}</div>}
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-white text-lg font-semibold">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: IssuePriority) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger className="bg-black border-slate-600 text-white w-full">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-slate-700">
                      <SelectItem value="LOW" className="text-white">Low</SelectItem>
                      <SelectItem value="MEDIUM" className="text-white">Medium</SelectItem>
                      <SelectItem value="HIGH" className="text-white">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-white text-lg font-semibold">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: IssueStatus) => handleInputChange("status", value)}
                  >
                    <SelectTrigger className="bg-black border-slate-600 text-white w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-slate-700">
                      <SelectItem value="NOT_STARTED" className="text-white">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS" className="text-white">In Progress</SelectItem>
                      <SelectItem value="COMPLETED" className="text-white">Completed</SelectItem>
                      <SelectItem value="CANCELLED" className="text-white">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignees */}
                <div>
                  <Label className="text-white text-lg font-semibold">Assignees</Label>
                  {selectedAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignees.map(user => (
                        <Badge key={user.id} className="bg-slate-700 text-white rounded flex items-center gap-2">
                          {user.name}
                          <button type="button" onClick={() => removeAssignee(user.id)} className="text-red-400">
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {formData.repositoryId && (
                    <Select
                      onValueChange={(userId: string) => {
                        const user = availableUsers.find(u => u.id === userId);
                        if (user && !selectedAssignees.some(a => a.id === userId)) {
                          handleAssigneeToggle(user);
                        }
                      }}
                      disabled={loadingUsers || !availableUsers.length}
                    >
                      <SelectTrigger className="bg-black border-slate-600 text-white w-full">
                        <SelectValue placeholder="Add team member" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-slate-700">
                        {availableUsers
                          .filter(user => !selectedAssignees.some(a => a.id === user.id))
                          .map(user => (
                            <SelectItem key={user.id} value={user.id} className="text-white">
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </Card>


          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssue;
