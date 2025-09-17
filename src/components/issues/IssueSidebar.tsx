import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { projectsApi } from "@/api/projects.api";
import { tagsApi, Tag } from "@/api/tags.api";
import { UserProfile } from "@/api/users.api";
import { issuesApi, IssueStatus, statusDisplayMap, IssuePriority, IssueDetailData } from '@/api/issues.api';

// --- Type Definitions ---
export type IssueFormData = {
    title: string;
    description: string;
    priority: IssuePriority;
    status: IssueStatus;
    repositoryId: string;
    assignedTo: UserProfile[];
    tags: Tag[];
};

type SidebarDropdownProps = {
    title: string;
    currentValue: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
};

type IssueSidebarProps = {
    issueId: string;
    onDelete: () => void;
    isDeleting: boolean;
};

// --- Reusable Dropdown Component ---
const SidebarDropdown = ({ title, currentValue, isOpen, onToggle, children }: SidebarDropdownProps) => {
    return (
        <div className="border-b border-gray-600 py-2 relative">
            <div className="text-xs text-white flex justify-between hover:bg-gray-800 rounded-md pt-1 pb-1 pl-2 pr-2 cursor-pointer" onClick={onToggle}>
                {title} <span className="text-gray-500">⚙️</span>
            </div>
            {!isOpen && <div className="text-gray-400 text-xs mt-2 pl-2 truncate">{currentValue}</div>}
            {isOpen && children}
        </div>
    );
};

// --- The Main Sidebar Component ---
export const IssueSidebar = ({ issueId, onDelete, isDeleting }: IssueSidebarProps) => {
    const { watch, setValue, getValues } = useFormContext<IssueFormData>();
    const watchedValues = watch();
    const queryClient = useQueryClient();

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [labelFilter, setLabelFilter] = useState("");
    const sidebarRef = useRef<HTMLDivElement>(null);

    const { data: repositories = [] } = useQuery({ queryKey: ["repositories"], queryFn: projectsApi.getAll });
    const { data: allTags = [] } = useQuery<Tag[]>({ queryKey: ["tags"], queryFn: tagsApi.getAll });
    const { data: repositoryUsers } = useQuery({
        queryKey: ["repository-users", watchedValues.repositoryId],
        queryFn: () => projectsApi.getUsers(watchedValues.repositoryId!),
        enabled: !!watchedValues.repositoryId,
    });

    const updateIssueMutation = useMutation({
        mutationFn: (updates: Partial<IssueDetailData>) => issuesApi.update({ id: issueId, updates }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issue", issueId] }),
        onError: (error) => console.error("Failed to update issue:", error),
    });

    const availableUsers = repositoryUsers ? [...repositoryUsers.members, repositoryUsers.lead] : [];
    const filteredTags = allTags.filter(tag =>
        typeof tag.name === 'string' && tag.name.toLowerCase().includes(labelFilter.toLowerCase())
    );

    const handleDropdownChange = (field: keyof IssueDetailData, value: any) => {
        updateIssueMutation.mutate({ [field]: value });
        setOpenDropdown(null);
    };

    const handleAssigneeToggle = (user: UserProfile) => {
        const currentAssignees = getValues("assignedTo") || [];
        const newAssignees = currentAssignees.some(a => a.id === user.id) ? currentAssignees.filter(a => a.id !== user.id) : [...currentAssignees, user];
        setValue("assignedTo", newAssignees);
        updateIssueMutation.mutate({ assignedToIds: newAssignees.map(a => a.id) });
    };

    const handleTagToggle = (tag: Tag) => {
        const currentTags = getValues("tags") || [];
        const newTags = currentTags.some(t => t.id === tag.id) ? currentTags.filter(t => t.id !== tag.id) : [...currentTags, tag];
        setValue("tags", newTags);
        updateIssueMutation.mutate({ tagIDs: newTags.map(t => t.id) });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        if (openDropdown) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdown]);

    const statusInfo = statusDisplayMap[watchedValues.status] || { label: watchedValues.status, color: 'bg-gray-500' };

    return (
        <div ref={sidebarRef} className="space-y-4">
            <Card className="bg-grey border-0 backdrop-blur-sm rounded-md p-2">
                <SidebarDropdown
                    title="Repository"
                    isOpen={openDropdown === 'repository'}
                    onToggle={() => setOpenDropdown(openDropdown === 'repository' ? null : 'repository')}
                    currentValue={repositories.find(r => r.id === watchedValues.repositoryId)?.name || "No repository"}
                >
                    <div className="absolute top-full left-0 bg-black border border-slate-700 w-full z-20 rounded-md shadow-lg">
                        {repositories.map(repo => (
                            <div key={repo.id} className="p-2 text-xs hover:bg-slate-800 cursor-pointer text-white" onClick={(e) => { e.stopPropagation(); handleDropdownChange("repositoryId", repo.id); }}>
                                {repo.name}
                            </div>
                        ))}
                    </div>
                </SidebarDropdown>
                <SidebarDropdown
                    title="Priority"
                    isOpen={openDropdown === 'priority'}
                    onToggle={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                    currentValue={watchedValues.priority || 'Not set'}
                >
                    <div className="absolute top-full left-0 bg-black border border-slate-700 w-full z-20 rounded-md shadow-lg">
                        {["LOW", "MEDIUM", "HIGH"].map(p => (
                            <div key={p} className="p-2 text-xs hover:bg-slate-800 cursor-pointer text-white" onClick={(e) => { e.stopPropagation(); handleDropdownChange("priority", p as IssuePriority); }}>
                                {p}
                            </div>
                        ))}
                    </div>
                </SidebarDropdown>
                <SidebarDropdown
                    title="Status"
                    isOpen={openDropdown === 'status'}
                    onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    currentValue={<Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>}
                >
                    <div className="absolute top-full left-0 bg-black border border-slate-700 w-full z-20 rounded-md shadow-lg">
                        {Object.keys(statusDisplayMap).map((statusKey) => (
                            <div key={statusKey} className="p-2 text-xs hover:bg-slate-800 cursor-pointer text-white" onClick={(e) => { e.stopPropagation(); handleDropdownChange("status", statusKey as IssueStatus); }}>
                                {statusDisplayMap[statusKey as IssueStatus].label}
                            </div>
                        ))}
                    </div>
                </SidebarDropdown>
                <SidebarDropdown
                    title="Labels"
                    isOpen={openDropdown === 'tags'}
                    onToggle={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                    currentValue={(watchedValues.tags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {(watchedValues.tags || []).map((tag: Tag) => <Badge key={tag.id} className="border-0 text-white" style={{ backgroundColor: tag.color }}>{tag.name}</Badge>)}
                        </div>
                    ) : "None yet"}
                >
                    <div className="absolute top-full left-0 bg-[#161b22] border border-slate-700 w-full z-20 rounded-md shadow-lg">
                        <div className="p-2 border-b border-slate-700"><Input type="text" placeholder="Filter labels" value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-[#0d1117] border-slate-600 text-white w-full h-8 text-xs" /></div>
                        <div className="max-h-60 overflow-y-auto">
                            {filteredTags.map(tag => (
                                <div key={tag.id} className="text-white flex items-start gap-2 p-2 border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}>
                                    <input type="checkbox" readOnly checked={(watchedValues.tags || []).some((t: Tag) => t.id === tag.id)} className="flex-shrink-0 mt-0.5 h-4 w-4 bg-transparent border-slate-600 rounded" />
                                    <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                    <div className="flex flex-col"><span className="font-semibold text-sm leading-tight">{tag.name}</span>{tag.description && <span className="text-xs text-gray-400">{tag.description}</span>}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SidebarDropdown>
                <SidebarDropdown
                    title="Assignees"
                    isOpen={openDropdown === 'assignees'}
                    onToggle={() => setOpenDropdown(openDropdown === 'assignees' ? null : 'assignees')}
                    currentValue={(watchedValues.assignedTo || []).length > 0 ? (watchedValues.assignedTo || []).map((user: UserProfile) => user.name).join(", ") : "No one"}
                >
                    <div className="absolute top-full left-0 bg-[#161b22] border border-slate-700 w-full z-20 rounded-md shadow-lg">
                        <div className="max-h-60 overflow-y-auto">
                            {availableUsers.map(user => (
                                <div key={user.id} className="text-white flex items-center gap-3 p-2 border-b border-slate-800 last:border-b-0 hover:bg-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleAssigneeToggle(user); }}>
                                    <input type="checkbox" readOnly checked={(watchedValues.assignedTo || []).some((a: UserProfile) => a.id === user.id)} className="flex-shrink-0 h-4 w-4 bg-transparent border-slate-600 rounded" />
                                    <span>{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SidebarDropdown>
            </Card>

            <Card className="bg-grey border-0 backdrop-blur-sm rounded-md p-4">
                <Button variant="ghost" className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={onDelete} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Issue'}
                </Button>
            </Card>
        </div>
    );
};