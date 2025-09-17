import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageSquare, Send, User as UserIcon, GitBranch, Flag, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { issuesApi, IssueStatus, statusDisplayMap, IssueDetailData } from "@/api/issues.api";
import useUserStore from "@/store/useUserStore";

// Type for the editable form fields
type IssueUpdateFormData = {
  title: string;
  description: string;
  status: IssueStatus;
};

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
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      {/* Dialog */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white" 
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// The Component
const IssueDetail = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useUserStore();

  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // New state for dialog

  // --- Data Fetching ---
  const { data: issue, isLoading, isError } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => issuesApi.getById(id!),
    enabled: !!id,
  });

  // --- Form Management ---
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<IssueUpdateFormData>();

  useEffect(() => {
    if (issue) {
      reset({
        title: issue.title,
        description: issue.description,
        status: issue.status,
      });
    }
  }, [issue, reset]);

  // --- Data Mutations ---
  const updateIssueMutation = useMutation({
    mutationFn: (updates: Partial<IssueDetailData>) => issuesApi.update({ id: issue!.id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
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

  // --- Handlers ---
  const onSave = (data: Pick<IssueUpdateFormData, 'title' | 'description'>) => {
    updateIssueMutation.mutate(data);
  };

  const onCancel = () => {
    reset({ title: issue?.title, description: issue?.description });
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: IssueStatus) => {
    updateIssueMutation.mutate({ status: newStatus });
    setOpenDropdown(null);
  };
  
  // This handler now triggers the mutation and closes the dialog
  const handleConfirmDelete = () => {
    deleteIssueMutation.mutate();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;
    console.log("Adding comment:", newComment);
    setNewComment("");
  };

  if (isLoading) {
    return <div className="text-center p-8 text-white">Loading issue...</div>;
  }

  if (isError || !issue) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Issue not found</h2>
        <Button onClick={() => navigate('/issues')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Button>
      </div>
    );
  }

  const statusInfo = statusDisplayMap[issue.status] || { label: issue.status, color: 'bg-gray-500' };

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-6xl space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white hover:bg-black/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit(onSave)}>
                <Card className="bg-grey border-0 backdrop-blur-sm p-6">
                  <div className="pb-4 border-b border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      {isEditing ? (
                        <Input 
                          {...register("title", { required: true })}
                          className="text-2xl font-bold text-white bg-slate-800 border-slate-600 h-auto"
                        />
                      ) : (
                        <h1 className="text-2xl font-bold text-white">{issue.title}</h1>
                      )}
                      
                      {!isEditing ? (
                        <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2"/> Edit
                        </Button>
                      ) : (
                        <Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      Opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="py-6">
                    {isEditing ? (
                      <Textarea 
                        {...register("description")}
                        className="text-gray-300 bg-slate-800 border-slate-600 min-h-[120px]"
                        rows={5}
                      />
                    ) : (
                      <p className="text-gray-300 whitespace-pre-wrap">{issue.description || 'No description provided.'}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                  
                  {!isEditing && (
                    <div className="pt-6 border-t border-slate-700">
                      <h3 className="font-medium mb-4 flex items-center text-white">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Comments
                      </h3>
                      <div className="space-y-4 mb-6">
                        {(issue.comments || []).map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center mt-1 flex-shrink-0">
                              {comment.user.picture ? (
                                <img src={comment.user.picture} alt={comment.user.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                <UserIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 bg-slate-800 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm text-white">{comment.user.name || 'Anonymous'}</span>
                                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                              </div>
                              <p className="text-sm text-gray-300">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {(issue.comments || []).length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                      </div>
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <Input placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-black border-slate-600 text-white" />
                        <Button type="submit" disabled={!newComment.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                          <Send className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                      </form>
                    </div>
                  )}
                </Card>
              </form>
            </div>

            {/* --- Sidebar --- */}
            <div className="space-y-4">
              <Card className="bg-grey border-0 backdrop-blur-sm rounded-md p-4">
                <div className="space-y-4 text-sm">
                  
                  <div>
                    <p className="text-xs text-gray-400 flex justify-between items-center mb-2">Assignees <span>⚙️</span></p>
                    {(issue.assignedTo || []).length > 0 ? issue.assignedTo.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="text-white">{a.name}</span>
                      </div>
                    )) : <p className="text-gray-500">Not assigned</p>}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 flex justify-between items-center mb-2">Labels <span>⚙️</span></p>
                    {(issue.tags || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {issue.tags.map(t => (
                          <Badge key={t.id} className="border-0 text-white" style={{ backgroundColor: t.color }}>{t.name}</Badge>
                        ))}
                      </div>
                    ) : <p className="text-gray-500">None yet</p>}
                  </div>

                  <div className="relative">
                    <p className="text-xs text-gray-400 flex justify-between items-center mb-2">Status <span>⚙️</span></p>
                    <div className="cursor-pointer" onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
                       <Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>
                    </div>
                    {openDropdown === 'status' && (
                      <div className="absolute top-full left-0 mt-2 bg-black border border-slate-700 w-full z-10 rounded-md shadow-lg">
                        {Object.keys(statusDisplayMap).map((statusKey) => (
                          <div key={statusKey} className="p-2 text-xs hover:bg-slate-800 cursor-pointer text-white" onClick={() => handleStatusChange(statusKey as IssueStatus)}>
                            {statusDisplayMap[statusKey as IssueStatus].label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 flex justify-between items-center mb-2">Priority <span>⚙️</span></p>
                    <p className="capitalize text-white flex items-center gap-2"><Flag className="h-4 w-4"/> {issue.priority?.toLowerCase() || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 flex justify-between items-center mb-2">Repository <span>⚙️</span></p>
                    <p className="text-white flex items-center gap-2"><GitBranch className="h-4 w-4"/> {issue.repository.name}</p>
                  </div>

                </div>
              </Card>
              <Card className="bg-grey border-0 backdrop-blur-sm rounded-md p-4">
                <Button variant="ghost" className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={() => setIsDeleteDialogOpen(true)} disabled={deleteIssueMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-2"/>
                  {deleteIssueMutation.isPending ? 'Deleting...' : 'Delete Issue'}
                </Button>
              </Card>
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
  );
};

export default IssueDetail;