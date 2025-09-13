import { useMemo } from "react";
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
  X
} from "lucide-react";
import { format } from "date-fns";
import { Issue, IssueStatus, statusDisplayMap } from "@/api/issues.api";

const Issues = () => {
  const navigate = useNavigate();
  const { issues, isLoading, updateIssue } = useIssues();

  const {
    activeFilter,
    searchQuery,
    sortBy,
    setActiveFilter,
    setSearchQuery,
    setSortBy,
    selectedIssue,
    setSelectedIssue
  } = useIssuesStore();

  // Process issues with filters and sorting
  const processedIssues = useMemo(() => {
    const filtered = filterIssues(issues, activeFilter, searchQuery);
    return sortIssues(filtered, sortBy);
  }, [issues, activeFilter, searchQuery, sortBy]);

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
      // Make the API call - this will trigger the optimistic update via the mutation
      await updateIssue(issueId, { status: newStatus });
      
      // The mutation's onMutate will handle the optimistic update
      // and onSettled will invalidate the queries to refresh the data
    } catch (error) {
      console.error("Failed to update issue status:", error);
      // The mutation's onError will handle rolling back the optimistic update
      throw error; // Re-throw to show error in the UI
    }
  };

  const openCount = issues.filter(issue =>
    issue.status === "NOT_STARTED" || issue.status === "IN_PROGRESS"
  ).length;
  const closedCount = issues.filter(issue =>
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
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="text-xs"
          >
            All
          </Button>
        </div>

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
      </div>

      {/* Issues List */}
      <div className="space-y-0 border border-gray-700 rounded-lg overflow-hidden">
        {processedIssues.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {searchQuery ? "No issues match your search." : "No issues found."}
          </div>
        ) : (
          processedIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50 transition-colors cursor-pointer ${selectedIssue === issue.id ? "bg-blue-900/20" : ""
                }`}
              onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getStatusIcon(issue.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-white hover:text-blue-400">
                          {issue.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(issue.priority)}
                        </div>
                      </div>

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

                      {issue.description && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {issue.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={issue.status}
                        onValueChange={async (value: IssueStatus) => {
                          try {
                            await handleStatusChange(issue.id, value);
                          } catch (error) {
                            console.error('Failed to update status:', error);
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-white">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(issue.status)}
                            <span>{statusDisplayMap[issue.status]?.label || issue.status}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white">
                          <SelectItem value="NOT_STARTED" className="cursor-pointer hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <CircleDot className="h-3 w-3 text-green-500" />
                              Not Started
                            </div>
                          </SelectItem>
                          <SelectItem value="IN_PROGRESS" className="cursor-pointer hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <Play className="h-3 w-3 text-blue-500" />
                              In Progress
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPLETED" className="cursor-pointer hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-purple-500" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="CANCELLED" className="cursor-pointer hover:bg-gray-700">
                            <div className="flex items-center gap-2">
                              <X className="h-3 w-3 text-red-500" />
                              Cancelled
                            </div>
                          </SelectItem>
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

      {processedIssues.length > 0 && (
        <div className="text-sm text-gray-400 text-center">
          Showing {processedIssues.length} of {issues.length} issues
        </div>
      )}
    </div>
  );
};

export default Issues;
