import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useIssues } from "./useIssues";
import useIssuesStore, { filterIssues, sortIssues } from "./useIssuesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  CircleDot,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Plus,
  ArrowUpDown,
  XCircle,
  Play,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { Issue, IssueStatus, statusDisplayMap, issuesApi } from "@/api/issues.api";
import { tagsApi, Tag } from "@/api/tags.api";
import { projectsApi, Project } from "@/api/projects.api";
import { UserProfile } from "@/api/users.api";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";

const Issues = () => {
  const navigate = useNavigate();
  const { issues, isLoading, updateIssue } = useIssues();

  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const {
    activeFilter,
    searchQuery,
    sortBy,
    setActiveFilter,
    setSearchQuery,
    setSortBy,
    selectedIssue,
    selectedIssues,
  } = useIssuesStore();

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: tagsApi.getAll });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.getAll });
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(undefined);
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>(undefined);
  const { data: currentUser } = useQuery({ queryKey: ["current-user"], queryFn: usersApi.getProfile });

  const { data: repoIssues = [] } = useQuery({
    queryKey: ["issues", selectedProjectId],
    queryFn: () => issuesApi.getAll(selectedProjectId),
    enabled: !!selectedProjectId,
  });
  const baseIssues: Issue[] = selectedProjectId ? repoIssues : issues;

  const extraFiltered = useMemo(() => {
    let arr: Issue[] = baseIssues;
    if (selectedTagId) {
      arr = arr.filter((i: Issue) => (i.tagIDs || []).includes(selectedTagId));
    }
    if (selectedAssigneeId && currentUser?.id) {
      arr = arr.filter(
        (i: Issue) => (i.assignedToIds || []).includes(currentUser.id as string) && (i.assignedToIds || []).includes(selectedAssigneeId)
      );
    }
    return arr;
  }, [baseIssues, selectedTagId, selectedAssigneeId, currentUser?.id]);

  const processedIssues = useMemo(() => {
    const filtered = filterIssues(extraFiltered, activeFilter, searchQuery);
    return sortIssues(filtered, sortBy);
  }, [extraFiltered, activeFilter, searchQuery, sortBy]);

  const headerCbRef = useRef<HTMLInputElement>(null);

  const { data: projectUsers } = useQuery({
    queryKey: ["project-users", selectedProjectId],
    queryFn: () => projectsApi.getUsers(selectedProjectId!),
    enabled: !!selectedProjectId,
  });
  const availableUsers: UserProfile[] = projectUsers
    ? ([...projectUsers.members, projectUsers.lead].filter(Boolean) as UserProfile[])
    : [];
  const availableUsersFiltered: UserProfile[] = useMemo(
    () => availableUsers.filter((u) => u.id !== currentUser?.id),
    [availableUsers, currentUser?.id]
  );
  const allVisibleIds = useMemo(() => processedIssues.map((i) => i.id), [processedIssues]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIssues.includes(id));
  const someSelected = selectedIssues.some((id) => allVisibleIds.includes(id)) && !allSelected;
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const getStatusIcon = (status: IssueStatus) => {
    switch (status) {
      case "NOT_STARTED":
        return <CircleDot className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CircleDot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: Issue["priority"]) => {
    const variants = {
      LOW: "bg-green-100 text-green-800 border-green-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
      HIGH: "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority.toLowerCase()}
      </Badge>
    );
  };

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await updateIssue(issueId, { status: newStatus });
    } catch (error) {
      console.error("Failed to update issue status:", error);
      throw error;
    }
  };

  const openCount = extraFiltered.filter(issue =>
    issue.status === "NOT_STARTED" || issue.status === "IN_PROGRESS"
  ).length;
  const closedCount = extraFiltered.filter(issue =>
    issue.status === "COMPLETED" || issue.status === "CANCELLED"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-white">Issues</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CircleDot className="h-4 w-4" />
            <span>{openCount} Open</span>
            <CheckCircle2 className="h-4 w-4" />
            <span>{closedCount} Closed</span>
          </div>
        </div>

        <Button onClick={() => navigate("new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 flex-wrap">

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 text-white bg-gray-800">
            <ArrowUpDown className="h-4 w-4 mr-2 text-white" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            <SelectItem value="newest" className="text-white">
              Newest
            </SelectItem>
            <SelectItem value="oldest" className="text-white">
              Oldest
            </SelectItem>
            <SelectItem value="updated" className="text-white">
              Recently Updated
            </SelectItem>
            <SelectItem value="priority" className="text-white">
              Priority
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex items-center rounded-lg bg-gray-800 p-1">
          <div
            className={`absolute h-6 w-6 rounded-md bg-gray-600 transition-transform duration-300 ease-in-out ${viewMode === 'card' ? 'translate-x-full' : 'translate-x-0'
              }`}
          />
          {/* List Button */}
          <button
            onClick={() => setViewMode('list')}
            className="relative z-10 flex h-6 w-6 items-center justify-center"
            aria-label="List view"
          >
            <List className={`h-4 w-4 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-400'}`} />
          </button>
          {/* Grid Button */}
          <button
            onClick={() => setViewMode('card')}
            className="relative z-10 flex h-6 w-6 items-center justify-center"
            aria-label="Grid view"
          >
            <LayoutGrid className={`h-4 w-4 transition-colors ${viewMode === 'card' ? 'text-white' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Issues List / Grid */}
      <div>
        {viewMode === 'list' ? (
          // --- List View ---
          <div className="space-y-0 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Button
                  variant={activeFilter === "open" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("open")}
                  className="text-xs"
                >
                  <CircleDot className="h-3 w-3 mr-1" />
                  {openCount} Open
                </Button>
                <Button
                  variant={activeFilter === "closed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("closed")}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {closedCount} Closed
                </Button>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-auto">
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger className="h-8 text-white bg-gray-800">
                    <SelectValue placeholder="Labels" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white max-h-72 overflow-y-auto">
                    {tags.map((t: Tag) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedProjectId} onValueChange={(val) => { setSelectedProjectId(val); setSelectedAssigneeId(undefined); }}>
                  <SelectTrigger className="h-8 text-white bg-gray-800">
                    <SelectValue placeholder="Projects" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white max-h-72 overflow-y-auto">
                    {projects.map((p: Project) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                  <SelectTrigger className="text-white bg-gray-800" disabled={!selectedProjectId}>
                    <SelectValue placeholder={selectedProjectId ? "Assignees" : "Select a project first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white max-h-72 overflow-y-auto">
                    {availableUsersFiltered.length > 0 ? (
                      availableUsersFiltered.map((u: UserProfile) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400">{selectedProjectId ? "No users found" : "Select a project"}</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {processedIssues.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {searchQuery ? "No issues match your search." : "No issues found."}
              </div>
            ) : (
              processedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50 transition-colors cursor-pointer ${selectedIssue === issue.id ? "bg-blue-900/20" : ""}`}
                  onClick={(e) => { e.stopPropagation(); navigate(`/issues/${issue.id}`); }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(issue.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-white hover:text-blue-400">{issue.title}</h3>
                            <div className="flex items-center gap-2">{getPriorityBadge(issue.priority)}</div>
                          </div>
                          {issue.tagIDs && issue.tagIDs.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                              {tags
                                .filter((t) => issue.tagIDs?.includes(t.id))
                                .map((t) => (
                                  <Badge
                                    key={t.id}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0.5 bg-gray-800/40 border-gray-700 text-gray-200"
                                  >
                                    {t.name}
                                  </Badge>
                                ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                            <span>#{issue.id.slice(0, 8)}</span>
                            {issue.createdBy && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{issue.createdBy.name?.split(" ")[0] || "Unknown"}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>opened {format(new Date(issue.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={issue.status} onValueChange={async (value: IssueStatus) => { try { await handleStatusChange(issue.id, value); } catch (error) { console.error('Failed to update status:', error); } }}>
                            <SelectTrigger className="w-36 h-8 text-white">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(issue.status)}
                                <span>{statusDisplayMap[issue.status]?.label || issue.status}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-white">
                              <SelectItem value="NOT_STARTED" className="cursor-pointer hover:bg-gray-700"><div className="flex items-center gap-2"><CircleDot className="h-3 w-3 text-green-500" />Not Started</div></SelectItem>
                              <SelectItem value="IN_PROGRESS" className="cursor-pointer hover:bg-gray-700"><div className="flex items-center gap-2"><Play className="h-3 w-3 text-blue-500" />In Progress</div></SelectItem>
                              <SelectItem value="COMPLETED" className="cursor-pointer hover:bg-gray-700"><div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-purple-500" />Completed</div></SelectItem>
                              <SelectItem value="CANCELLED" className="cursor-pointer hover:bg-gray-700"><div className="flex items-center gap-2"><X className="h-3 w-3 text-red-500" />Cancelled</div></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // --- Card View ---
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedIssues.length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-400 border border-gray-700 rounded-lg">
                {searchQuery ? "No issues match your search." : "No issues found."}
              </div>
            ) : (
              processedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer flex flex-col gap-3 ${selectedIssue === issue.id ? "bg-blue-900/20 ring-2 ring-blue-500" : ""}`}
                  onClick={(e) => { e.stopPropagation(); navigate(`/issues/${issue.id}`); }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(issue.status)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white hover:text-blue-400">{issue.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-3 mt-auto border-t border-gray-700/60">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {getPriorityBadge(issue.priority)}
                      <span>#{issue.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{issue.createdBy?.name?.split(" ")[0] || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(issue.createdAt), "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {processedIssues.length > 0 && (
        <div className="text-sm text-gray-400 text-center">
          Showing {processedIssues.length} of {issues.length} issues
        </div>
      )}
    </div>
  );
};

export default Issues;