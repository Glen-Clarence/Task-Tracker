import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageSquare, Send, User as Edit, Plus, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DescriptionEditor } from "./DescriptionEditor";
import { $getRoot, EditorState } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import ExampleTheme from "../ui/themes/ExpTheme";
import { issuesApi, Issue, statusDisplayMap } from "@/api/issues.api";
import { IssueSidebar, IssueFormData } from './IssueSidebar';
import { usersApi } from "@/api/users.api";

// Reusable Confirmation Dialog Component
type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isPending: boolean;
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, description, isPending }: ConfirmDialogProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// The Main Component
const IssueDetail = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch the main issue details
  const { data: issue, isLoading, isError } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => issuesApi.getById(id!),
    enabled: !!id,
  });
  
  // Fetch comments for the issue
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => issuesApi.getComments(id!),
    enabled: !!id,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: usersApi.getProfile,
  });

  // Mutation for creating a new comment
  const createCommentMutation = useMutation({
    mutationFn: (commentMessage: string) => issuesApi.createComment({issueId: id!, content: commentMessage}),
    onSuccess: () => {
      // When a comment is successfully created, refetch the comments list
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setNewComment("");
    },
    onError: (error) => {
      console.error("Failed to create comment:", error);
    },
  });


  const methods = useForm<IssueFormData>();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = methods;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  const getStatusInfo = (status: Issue["status"]) => {
    const info = statusDisplayMap[status];
    return { label: info?.label ?? status, color: info?.color ?? "bg-slate-600" };
  };

  const shortIssueId = (issueId?: string) => (issueId ? issueId.slice(0, 8) : "");

  const getInitials = (fullName?: string) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const getLexicalEditorState = (description?: string) => {
    if (description && description.trim().length > 0) {
      try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === 'object' && 'root' in parsed) {
          return description; // Already a serialized Lexical state
        }
      } catch {
        // Not a JSON object, treat as plain text
      }
      return JSON.stringify({
        root: {
          children: [
            {
              type: "paragraph",
              children: [
                { type: "text", text: description, version: 1 }
              ],
              direction: null, format: "", indent: 0, version: 1,
            },
          ],
          direction: null, format: "", indent: 0, type: "root", version: 1,
        },
      });
    }
    return JSON.stringify({
      root: {
        children: [
          {
            children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1,
          },
        ],
        direction: null, format: "", indent: 0, type: "root", version: 1,
      },
    });
  };

  const editorConfig = (initialDescription?: string) => ({
    namespace: "IssueDescriptionEditor",
    theme: ExampleTheme,
    onError(error: Error) {
      console.error(error);
    },
    editorState: getLexicalEditorState(initialDescription),
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

  const handleDescriptionChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const description = root.getTextContent();
      // Update react-hook-form value
      methods.setValue("description", description, { shouldDirty: true });
    });
  };

  useEffect(() => {
    if (issue) {
      reset({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        repositoryId: issue.repository.id,
        assignedTo: issue.assignedTo,
        tags: issue.tags,
      });
    }
  }, [issue, reset]);

  const updateIssueMutation = useMutation({
    mutationFn: (updates: Partial<Issue> & { repositoryId?: string; assignedToIds?: string[]; tagIDs?: string[] }) =>
      issuesApi.update({ id: issue!.id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setIsEditing(false);
    },
    onError: (error) => console.error("Failed to update issue:", error),
  });

  const deleteIssueMutation = useMutation({
    mutationFn: () => issuesApi.delete(issue!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      navigate("/issues");
    },
    onError: (error) => console.error("Failed to delete issue:", error),
  });

  const onSaveTitleAndDescription = (data: IssueFormData) => {
    const payload: Partial<Issue> & { repositoryId?: string; assignedToIds?: string[]; tagIDs?: string[] } = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      repositoryId: data.repositoryId,
      assignedToIds: (data.assignedTo || []).map((u) => u.id),
      tagIDs: (data.tags || []).map((t) => t.id),
    };
    updateIssueMutation.mutate(payload);
  };

  const onCancelEdit = () => {
    if (issue) {
      reset({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        repositoryId: issue.repository.id,
        assignedTo: issue.assignedTo,
        tags: issue.tags,
      });
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = () => deleteIssueMutation.mutate();
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || createCommentMutation.isPending) return;
    createCommentMutation.mutate(newComment);
  };

  if (isLoading) return <div className="text-center p-8 text-white">Loading issue...</div>;
  if (isError || !issue) return <div className="text-center p-8 text-white">Issue not found</div>;

  return (
    <FormProvider {...methods}>
      <>
        <div className="min-h-screen">
          <div className="max-w-6xl space-y-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white hover:bg-black/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Issues
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 w-full">
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <Input
                      {...register("title", { required: true })}
                      className="text-3xl font-semibold text-white bg-black border-slate-600 h-auto"
                    />
                  ) : (
                    <>
                      <h1 className="text-3xl text-white truncate">{issue.title}</h1>
                      <span className="text-white text-3xl">#{shortIssueId(issue.id)}</span>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="mt-1 text-sm text-gray-400 truncate">
                    <Badge className={`text-white ${getStatusInfo(issue.status).color}`}>
                      {getStatusInfo(issue.status).label}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      form="issue-edit-form"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-800 text-white hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate("/issues/new")}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" /> New issue
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLink}
                      title="Copy link"
                      className="text-gray-400 hover:bg-slate-900"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <hr className="border-slate-700" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <form id="issue-edit-form" onSubmit={handleSubmit(onSaveTitleAndDescription)}>
                  <Card className="bg-grey border-0 backdrop-blur-sm p-6">
                    {/* Description block */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {getInitials(issue.createdBy?.name)}
                      </div>
                      <div className="flex-1 border border-blue-900/40 rounded-lg overflow-hidden bg-slate-900/40">
                        <div className="px-4 py-2 border-b border-blue-900/40">
                          <div className="text-sm text-gray-300">
                            <span className="font-semibold text-white">{issue.createdBy?.name ?? 'Unknown'}</span>
                            {" "}opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="p-4">
                          {isEditing ? (
                            <>
                              <DescriptionEditor
                                initialConfig={editorConfig(issue.description)}
                                onChange={handleDescriptionChange}
                              />
                              <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>Cancel</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700" size="sm" disabled={isSubmitting}>
                                  {isSubmitting ? "Saving..." : "Save changes"}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-300 whitespace-pre-wrap">{issue.description || 'No description provided.'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </form>

                {/* Comments Section - Moved outside the main form */}
                {!isEditing && (
                  <Card className="bg-grey border-0 backdrop-blur-sm p-6">
                    <div className="pt-6 border-slate-700">
                      <h3 className="font-medium mb-4 flex items-center text-white">
                        <MessageSquare className="h-5 w-5 mr-2" /> Comments
                      </h3>
                      <div className="space-y-4 mb-6">
                        {isLoadingComments && (
                          <div className="text-gray-400">Loading comments...</div>
                        )}
                        
                        {(comments || []).map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {getInitials(comment.user.name)}
                            </div>
                            <div className="flex-1">
                              <div className="bg- rounded-lg border border-slate-700">
                                <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-white">{comment.user.name || 'Anonymous'}</span>
                                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                  </div>
                                  {issue.createdBy?.id === comment.user.id && (
                                    <span className="text-xs px-2 py-0.5 bg-black text-white rounded-full font-medium">
                                      Author
                                    </span>
                                  )}
                                </div>
                                <div className="px-3 py-2">
                                  <p className="text-sm text-gray-300">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!isLoadingComments && (comments || []).length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="h-9 w-9 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                           {getInitials(currentUser?.name)}
                         </div>
                        <form onSubmit={handleAddComment} className="flex gap-2 flex-1">
                          <Input 
                            placeholder="Add a comment..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            className="flex-1 bg-black border-slate-600 text-white" 
                            disabled={createCommentMutation.isPending}
                          />
                          <Button type="submit" disabled={!newComment.trim() || createCommentMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white w-32">
                            {createCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <><Send className="h-4 w-4 mr-2" /> Comment</>}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* --- SIDEBAR --- */}
              <div className="space-y-4">
                <IssueSidebar
                  issueId={issue.id}
                  onDelete={() => setIsDeleteDialogOpen(true)}
                  isDeleting={deleteIssueMutation.isPending}
                  initialRepositoryName={issue.repository.name}
                />
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete issue?"
          description="This action cannot be undone. This will permanently delete the issue."
          isPending={deleteIssueMutation.isPending}
        />
      </>
    </FormProvider>
  );
};

export default IssueDetail;