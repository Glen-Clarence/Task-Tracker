import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useIssues } from "./useIssues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Image as ImageIcon } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "../ui/plugins/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import ExampleTheme from "../ui/themes/ExpTheme";
import { $getRoot, EditorState } from "lexical";
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

  const getInitialEditorState = (description?: string) => {
    if (description) return description;
    return JSON.stringify({
      root: {
        children: [{
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    });
  };

  const editorConfig = (initialDescription?: string) => ({
    namespace: 'IssueDescriptionEditor',
    theme: ExampleTheme,
    onError(error: Error) {
      console.error(error);
    },
    editorState: getInitialEditorState(initialDescription),
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  });

  const updateDescription = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAssignees, setSelectedAssignees] = useState<UserProfile[]>([]);
  const [createMore, setCreateMore] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: repositories = [], isLoading: loadingRepos } = useQuery({
    queryKey: ["repositories"],
    queryFn: projectsApi.getAll,
  });

  const { data: repositoryUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["repository-users", formData.repositoryId],
    queryFn: () => projectsApi.getUsers(formData.repositoryId!),
    enabled: !!formData.repositoryId,
  });

  const availableUsers = repositoryUsers
    ? [...repositoryUsers.members, repositoryUsers.lead]
    : [];

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
      const issueData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        assignedToIds: formData.assignedToIds || [],
        repositoryId: formData.repositoryId,
        dueDate: undefined,
        tagIDs: []
      };

      await createIssue(issueData);

      if (createMore) {
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
        navigate(-1);
      }
    } catch (error) {
      console.error("Failed to create issue:", error);
    }
  };

  const handleInputChange = (field: keyof CreateIssueFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

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

  const toggleDropdown = (dropdownId: string) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  const selectDropdownItem = (field: keyof CreateIssueFormData, value: string) => {
    handleInputChange(field, value);
    setOpenDropdown(null);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl space-y-4">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-grey border-slate-700/50 backdrop-blur-sm shadow-2xl">
                <div className="p-8 space-y-6">
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

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-white text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      Description
                    </Label>
                    <div className="editor-wrapper">
                      <LexicalComposer initialConfig={editorConfig(formData.description)}>
                        <LexicalEditorWrapper 
                          updateDescription={updateDescription} 
                        />
                      </LexicalComposer>
                    </div>

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

            {/* sidebar */}
            <Card className="bg-grey border-slate-700/50 backdrop-blur-sm shadow-2xl rounded-md">
              <div className="p-8 space-y-6">

                <div className="border-b border-gray-600 py-4 relative cursor-pointer" onClick={() => toggleDropdown("repository")}>
                  <div className="font-semibold text-white flex justify-between hover:bg-gray-800 ">
                    Repository <span className="text-gray-500">⚙️</span>
                  </div>
                  <div className="text-gray-400 mt-2">
                    {repositories.find(r => r.id === formData.repositoryId)?.name || "No repository selected"}
                  </div>
                  {openDropdown === "repository" && (
                    <div className="absolute bg-black border border-gray-600 w-full mt-2 z-10">
                      {repositories.map(repo => (
                        <div key={repo.id} className="p-2 hover:bg-gray-700 cursor-pointer text-white" onClick={() => selectDropdownItem("repositoryId", repo.id)}>
                          {repo.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-600 py-4 relative cursor-pointer" onClick={() => toggleDropdown("priority")}>
                  <div className="font-semibold text-white flex justify-between hover:bg-gray-800">
                    Priority <span className="text-gray-500">⚙️</span>
                  </div>
                  <div className="text-gray-400 mt-2">{formData.priority}</div>
                  {openDropdown === "priority" && (
                    <div className="absolute bg-black border border-gray-600 w-full mt-2 z-10">
                      {["LOW", "MEDIUM", "HIGH"].map(p => (
                        <div key={p} className="p-2 hover:bg-gray-700 cursor-pointer text-white" onClick={() => selectDropdownItem("priority", p)}>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-600 py-4 relative cursor-pointer" onClick={() => toggleDropdown("status")}>
                  <div className="font-semibold text-white flex justify-between hover:bg-gray-800">
                    Status <span className="text-gray-500">⚙️</span>
                  </div>
                  <div className="text-gray-400 mt-2">{formData.status}</div>
                  {openDropdown === "status" && (
                    <div className="absolute bg-black border border-gray-600 w-full mt-2 z-10">
                      {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => (
                        <div key={s} className="p-2 hover:bg-gray-700 cursor-pointer text-white" onClick={() => selectDropdownItem("status", s)}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-600 py-4 relative cursor-pointer" onClick={() => toggleDropdown("assignees")}>
                  <div className="font-semibold text-white flex justify-between hover:bg-gray-800">
                    Assignees <span className="text-gray-500">⚙️</span>
                  </div>
                  <div className="text-gray-400 mt-2">
                    {selectedAssignees.length > 0 ? selectedAssignees.map(u => u.name).join(", ") : "No one"}
                  </div>
                  {openDropdown === "assignees" && (
                    <div className="absolute bg-black border border-gray-600 w-full mt-2 z-10 max-h-60 overflow-auto">
                      {availableUsers.map(user => (
                        <div key={user.id} className="p-2 hover:bg-gray-700 cursor-pointer text-white" onClick={() => handleAssigneeToggle(user)}>
                          {user.name}
                        </div>
                      ))}
                    </div>
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

function LexicalEditorWrapper({ updateDescription }: { updateDescription: (desc: string) => void }) {
  const [editor] = useLexicalComposerContext();
  
  return (
    <div className="relative">
      <ToolbarPlugin 
        setShowDoodle={() => {}} 
        showDoodle={false} 
        title="" 
      />
      <div className="editor-container relative bg-black border border-slate-600 rounded-md p-2 min-h-[200px] mt-1">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="editor-input min-h-[150px] p-2 focus:outline-none text-white" />
          }
          placeholder={
            <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
              Describe the issue...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin
          onChange={(editorState: EditorState) => {
            editorState.read(() => {
              const description = $getRoot().getTextContent();
              updateDescription(description);
            });
          }}
        />
        <AutoFocusPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </div>
    </div>
  );
}

export default NewIssue;
