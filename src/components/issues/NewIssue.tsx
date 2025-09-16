import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useIssues } from "./useIssues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { $getRoot, EditorState } from "lexical";
import { Issue, IssueStatus } from "@/api/issues.api";
import { projectsApi } from "@/api/projects.api";
import { UserProfile } from "@/api/users.api";
import { Tag, tagsApi } from "@/api/tags.api";


import { DescriptionEditor } from "./DescriptionEditor";

// Lexical Node imports are only needed for the config, which is passed as a prop
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import ExampleTheme from "../ui/themes/ExpTheme";


type IssuePriority = "LOW" | "MEDIUM" | "HIGH";

type CreateIssueFormData = Omit<Issue, "id" | "createdAt" | "updatedAt"> & {
  repositoryId: string;
  assignedToIds: string[];
  dueDate?: Date;
  tagIDs?: string[];
};

type SidebarDropdownProps = {
  title: string;
  currentValue: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const SidebarDropdown = ({ title, currentValue, isOpen, onToggle, children }: SidebarDropdownProps) => {
  return (
    <div className="border-b border-gray-600 py-2 relative">
      <div
        className="text-xs text-white flex justify-between hover:bg-gray-800 rounded-md pt-1 pb-1 pl-2 cursor-pointer"
        onClick={onToggle}
      >
        {title} <span className="text-gray-500 pr-2">⚙️</span>
      </div>
      <div className="text-gray-400 text-xs mt-2 pl-2 truncate">
        {currentValue}
      </div>
      {isOpen && children}
    </div>
  );
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
  
  // This function will be passed as a prop to the DescriptionEditor
  const handleDescriptionChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const description = root.getTextContent();
      updateDescription(description);
    });
  };

  // ... All other state and hooks remain unchanged ...
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAssignees, setSelectedAssignees] = useState<UserProfile[]>([]);
  const [createMore, setCreateMore] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { data: repositories = [] } = useQuery({
    queryKey: ["repositories"],
    queryFn: projectsApi.getAll,
  });

  const { data: repositoryUsers } = useQuery({
    queryKey: ["repository-users", formData.repositoryId],
    queryFn: () => projectsApi.getUsers(formData.repositoryId!),
    enabled: !!formData.repositoryId,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: tagsApi.getAll,
  });

  const filteredTags = tags.filter(tag =>
  typeof tag.name === "string" &&
  tag.name.toLowerCase().includes(labelFilter.toLowerCase())
);

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
    if (!formData.title.trim()) { newErrors.title = "Title is required"; }
    if (formData.title.trim().length < 2) { newErrors.title = "Title must be at least 2 characters"; }
    if (!formData.repositoryId) { newErrors.repositoryId = "Repository is required"; }
    if (formData.description && formData.description.trim().length < 2) { newErrors.description = "Description must be at least 2 characters"; }
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
        tagIDs: formData.tagIDs || []
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
    if (errors[field]) { setErrors(prev => ({ ...prev, [field]: "" })); }
    if (field === "repositoryId") { setSelectedAssignees([]); }
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

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIDs: prev.tagIDs?.includes(tagId)
        ? prev.tagIDs.filter((id) => id !== tagId)
        : [...(prev.tagIDs || []), tagId],
    }));
  };

  const toggleDropdown = (dropdownId: string) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  const selectDropdownItem = (field: keyof CreateIssueFormData, value: string) => {
    handleInputChange(field, value);
    setOpenDropdown(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white hover:bg-black/10 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card className="bg-grey border-0 backdrop-blur-sm flex flex-col">
                {/* Card Main Content */}
                <div className="p-8 space-y-6">
                  {/* --- Title Section --- */}
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
                      className={`bg-black border-slate-600 text-white placeholder:text-gray-400 text-lg py-3 px-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 ${errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                    />
                    {errors.title && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        {errors.title}
                      </div>
                    )}
                  </div>
                  
                  {/* --- NEW Description Section --- */}
                  <div className="space-y-3">
                    <Label className="text-white text-lg font-semibold flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                       Description
                    </Label>
                    <DescriptionEditor 
                      initialConfig={editorConfig(formData.description)}
                      onChange={handleDescriptionChange}
                    />
                  </div>
                </div>

                {/* --- NEW Card Footer for Buttons --- */}
                <div className="flex items-center justify-between p-4  mt-auto">
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" className="hidden" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setAttachments(files); }} />
                    <Button type="button" variant="ghost" className="text-gray-400 text-sm hover:text-black" onClick={() => fileInputRef.current?.click()}>
                      📎 Attach files
                    </Button>
                     {attachments.length > 0 && (
                        <div className="text-xs text-gray-400">
                           {attachments.length} file(s) selected
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="create-more" checked={createMore} onChange={(e) => setCreateMore(e.target.checked)} className="w-4 h-4 text-blue-600 bg-black border-slate-600 rounded focus:ring-blue-500 focus:ring-2" />
                      <Label htmlFor="create-more" className="text-sm text-gray-300">Create more</Label>
                    </div>
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isCreating} className="border-slate-600 bg-black text-gray-300 hover:text-white hover:bg-slate-800">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700 text-white">
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
              </Card>
            </div>

            {/* --- Sidebar --- */}
            <div className="lg:col-span-1">
              <Card ref={sidebarRef} className="bg-grey border-0 backdrop-blur-sm rounded-md">
                <div className="p-2 space-y-2">
                  <SidebarDropdown
                    title="Repository"
                    isOpen={openDropdown === 'repository'}
                    onToggle={() => toggleDropdown('repository')}
                    currentValue={repositories.find(r => r.id === formData.repositoryId)?.name || "No repository selected"}
                  >
                    <div className="absolute bg-black border border-slate-700 w-full mt-1 z-10 rounded-md shadow-lg">
                      <div className="max-h-60 overflow-y-auto">
                        {repositories.map(repo => (
                          <div
                            key={repo.id}
                            className="p-2 text-xs text-white hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-b-0"
                            onClick={(e) => { e.stopPropagation(); selectDropdownItem("repositoryId", repo.id); }}
                          >
                            {repo.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SidebarDropdown>

                  <SidebarDropdown
                    title="Priority"
                    isOpen={openDropdown === 'priority'}
                    onToggle={() => toggleDropdown('priority')}
                    currentValue={formData.priority || "No priority selected"}
                  >
                     <div className="absolute bg-black border border-slate-700 w-full mt-1 z-10 rounded-md shadow-lg">
                      <div className="max-h-60 overflow-y-auto">
                        {["LOW", "MEDIUM", "HIGH"].map(p => (
                          <div
                            key={p}
                            className="p-2 text-xs text-white hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-b-0"
                            onClick={(e) => { e.stopPropagation(); selectDropdownItem("priority", p); }}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SidebarDropdown>
                  
                   <SidebarDropdown
                    title="Status"
                    isOpen={openDropdown === 'status'}
                    onToggle={() => toggleDropdown('status')}
                    currentValue={formData.status || "No status selected"}
                  >
                     <div className="absolute bg-black border border-slate-700 w-full mt-1 z-10 rounded-md shadow-lg">
                      <div className="max-h-60 overflow-y-auto">
                        {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => (
                          <div
                            key={s}
                            className="p-2 text-xs text-white hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-b-0"
                            onClick={(e) => { e.stopPropagation(); selectDropdownItem("status", s); }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SidebarDropdown>

                  <SidebarDropdown
                    title="Labels"
                    isOpen={openDropdown === 'tags'}
                    onToggle={() => toggleDropdown('tags')}
                    currentValue={formData.tagIDs?.length > 0 ? tags.filter(tag => formData.tagIDs.includes(tag.id)).map(tag => tag.name).join(", ") : "No labels selected"}
                  >
                    <div className="absolute bg-black border border-slate-700 w-full mt-1 z-10 rounded-md shadow-lg">
                      <div className="bg-black p-2 border-b border-slate-700">
                        <Input type="text" placeholder="Filter labels" value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-[#0d1117] border-slate-600 text-white w-full h-8 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/30" />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredTags.map(tag => (
                          <div key={tag.id} className="text-white flex items-start gap-2 p-2 border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag.id); }}>
                            <input type="checkbox" readOnly checked={formData.tagIDs?.includes(tag.id)} className="flex-shrink-0 mt-0.5 h-4 w-4 bg-transparent border-slate-600 rounded" />
                            <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs leading-tight">{tag.name}</span>
                              {tag.description && <span className="text-xs text-gray-400">{tag.description}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SidebarDropdown>

                  <SidebarDropdown
                    title="Assignees"
                    isOpen={openDropdown === 'assignees'}
                    onToggle={() => toggleDropdown('assignees')}
                    currentValue={selectedAssignees.length > 0 ? selectedAssignees.map(u => u.name).join(", ") : "No one assigned"}
                  >
                    <div className="absolute bg-black border border-slate-700 w-full mt-1 z-10 rounded-md shadow-lg">
                      <div className="max-h-60 overflow-y-auto">
                        {availableUsers.map(user => (
                          <div key={user.id} className="text-white text-xs flex items-center gap-3 p-2 border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleAssigneeToggle(user); }}>
                            <input type="checkbox" readOnly checked={selectedAssignees.some(assignee => assignee.id === user.id)} className="flex-shrink-0 h-4 w-4 bg-transparent border-slate-600 rounded" />
                            <span>{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SidebarDropdown>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssue;