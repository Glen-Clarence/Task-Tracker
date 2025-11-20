import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, Project } from "@/api/projects.api";
import {
  FolderOpenDot,
  User,
  UsersRound,
  Calendar,
  MoreVertical,
  BarChart3,
  Clock,
  CheckCircle2,
  TrendingUp,
  Folder,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Dropdown, MenuProps } from "antd";
import { UserProfile, usersApi, UserAnalyticsData } from "@/api/users.api";

const ProjectDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<
    "tasks" | "issues" | "analytics" | "repositories"
  >("tasks");

  const { data: users } = useQuery({
    queryKey: ["users", id],
    queryFn: () => projectsApi.getUsers(id as string),
  });

  const { data: project } = useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getRepo(id as string),
  });

  const { data: analyticsData } = useQuery<UserAnalyticsData[]>({
    queryKey: ["analytics", id],
    queryFn: () => usersApi.getAnalytics(id as string),
    enabled:
      !!id && (activeTab === "analytics" || activeTab === "repositories"),
  });

  // Combine members and lead for user lookup
  const allUsers = useMemo(() => {
    const usersList: UserProfile[] = [];

    // Add members from users query
    if (users?.members) {
      usersList.push(...users.members);
    }

    // Add lead from users query
    if (users?.lead) {
      usersList.push(users.lead);
    }

    // Add members from project data
    if (project?.members) {
      project.members.forEach((member) => {
        if (!usersList.find((u) => u.id === member.id)) {
          usersList.push(member);
        }
      });
    }

    // Add lead from project data
    if (project?.lead) {
      if (!usersList.find((u) => u.id === project.lead!.id)) {
        usersList.push(project.lead);
      }
    }

    // Add user from project data
    if (project?.user) {
      if (!usersList.find((u) => u.id === project.user!.id)) {
        usersList.push(project.user);
      }
    }

    return usersList;
  }, [users, project]);

  const getUserById = (userId: string) => {
    return allUsers.find((u) => u.id === userId);
  };

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "?";
    return fullName.split(" ")[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "DONE":
        return "bg-green-500 text-white";
      case "IN_PROGRESS":
        return "bg-orange-500 text-white";
      case "TO_DO":
      case "NOT_STARTED":
      case "PENDING":
        return "bg-blue-500 text-white";
      case "BLOCKED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "Done";
      case "IN_PROGRESS":
        return "In Progress";
      case "TO_DO":
      case "NOT_STARTED":
        return "To Do";
      case "BLOCKED":
        return "Blocked";
      default:
        return status?.replace("_", " ") || "Unknown";
    }
  };

  const getTaskMenuItems = (): MenuProps["items"] => [
    {
      key: "view",
      label: "View Details",
    },
    {
      key: "edit",
      label: "Edit",
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
    },
  ];

  const getIssueMenuItems = (): MenuProps["items"] => [
    {
      key: "view",
      label: "View Details",
    },
    {
      key: "edit",
      label: "Edit",
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
    },
  ];

  const tasks = project?.tasks || [];
  const issues = project?.issues || [];

  // Calculate analytics summary
  const analyticsSummary = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        totalHours: 0,
        totalTasks: 0,
        activeUsers: 0,
        averageHoursPerUser: 0,
      };
    }

    const totalHours = analyticsData.reduce((sum, user) => {
      const userHours = user.repositories.reduce(
        (repoSum, repo) => repoSum + repo.totalHours,
        0
      );
      return sum + userHours;
    }, 0);

    const totalTasks = analyticsData.reduce((sum, user) => {
      const userTasks = user.repositories.reduce(
        (repoSum, repo) => repoSum + repo.tasksCount,
        0
      );
      return sum + userTasks;
    }, 0);

    const activeUsers = analyticsData.filter(
      (user) => user.tasks.length > 0 || user.analytics.length > 0
    ).length;

    const averageHoursPerUser = activeUsers > 0 ? totalHours / activeUsers : 0;

    return {
      totalHours: Math.round(totalHours),
      totalTasks,
      activeUsers,
      averageHoursPerUser: Math.round(averageHoursPerUser * 10) / 10,
    };
  }, [analyticsData]);

  // Get daily analytics aggregated
  const dailyAnalytics = useMemo(() => {
    if (!analyticsData) return [];

    const dailyMap = new Map<string, { hours: number; tasks: number }>();

    analyticsData.forEach((user) => {
      user.analytics.forEach((analytics) => {
        const existing = dailyMap.get(analytics.date) || {
          hours: 0,
          tasks: 0,
        };
        dailyMap.set(analytics.date, {
          hours: existing.hours + analytics.hoursWorked,
          tasks: existing.tasks + analytics.tasksCount,
        });
      });
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [analyticsData]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Project Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FolderOpenDot className="text-gray-400" size={24} />
            <h1 className="text-3xl font-bold text-white">{project?.name}</h1>
          </div>
          {project?.description && (
            <p className="text-gray-400 mb-4">{project.description}</p>
          )}
          <div className="flex gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="font-medium">Lead:</span>
              <span>
                {users?.lead?.name ||
                  project?.lead?.name ||
                  project?.user?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UsersRound size={16} />
              <span className="font-medium">Members:</span>
              <span>
                {users?.members?.map((m) => m.name).join(", ") ||
                  project?.members?.map((m) => m.name).join(", ") ||
                  "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`pb-3 px-1 font-medium text-base transition-colors relative ${
                activeTab === "tasks"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Tasks
              {activeTab === "tasks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`pb-3 px-1 font-medium text-base transition-colors relative ${
                activeTab === "issues"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Issues
              {activeTab === "issues" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 px-1 font-medium text-base transition-colors relative ${
                activeTab === "analytics"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Analytics
              {activeTab === "analytics" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("repositories")}
              className={`pb-3 px-1 font-medium text-base transition-colors relative ${
                activeTab === "repositories"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Repositories
              {activeTab === "repositories" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No tasks found for this project.
              </div>
            ) : (
              tasks.map((task) => {
                const assignee = getUserById(task.userId);
                return (
                  <div
                    key={task.id}
                    className="bg-[#1a1a1a] rounded-lg p-4 shadow-sm border border-gray-800 hover:border-gray-700 transition-colors flex flex-col"
                  >
                    {/* Header with menu */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-white text-base flex-1 pr-2">
                        {task.title}
                      </h3>
                      <Dropdown
                        menu={{ items: getTaskMenuItems() }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <button className="text-gray-400 hover:text-white p-1">
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">
                      {task.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300">
                          {assignee ? getFirstName(assignee.name) : "?"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={14} />
                            <span>{formatDate(task.date)}</span>
                          </div>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "issues" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {issues.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No issues found for this project.
              </div>
            ) : (
              issues.map((issue) => {
                const assignees =
                  issue.assignedToIds
                    ?.map((id) => getUserById(id))
                    .filter(Boolean) || [];
                const primaryAssignee = assignees[0];

                return (
                  <div
                    key={issue.id}
                    className="bg-[#1a1a1a] rounded-lg p-4 shadow-sm border border-gray-800 hover:border-gray-700 transition-colors flex flex-col"
                  >
                    {/* Header with menu */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-white text-base flex-1 pr-2">
                        {issue.title}
                      </h3>
                      <Dropdown
                        menu={{ items: getIssueMenuItems() }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <button className="text-gray-400 hover:text-white p-1">
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>

                    {/* Description */}
                    {issue.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">
                        {issue.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300">
                          {primaryAssignee
                            ? getFirstName(primaryAssignee.name)
                            : "?"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {issue.createdAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={14} />
                            <span>{formatDate(issue.createdAt)}</span>
                          </div>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            issue.status
                          )}`}
                        >
                          {getStatusLabel(issue.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Hours</span>
                  <Clock className="text-blue-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white">
                  {analyticsSummary.totalHours}
                </div>
                <div className="text-xs text-gray-500 mt-1">hours worked</div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Tasks</span>
                  <CheckCircle2 className="text-green-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white">
                  {analyticsSummary.totalTasks}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  tasks completed
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Active Users</span>
                  <UsersRound className="text-purple-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white">
                  {analyticsSummary.activeUsers}
                </div>
                <div className="text-xs text-gray-500 mt-1">contributors</div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Avg Hours/User</span>
                  <TrendingUp className="text-orange-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-white">
                  {analyticsSummary.averageHoursPerUser}
                </div>
                <div className="text-xs text-gray-500 mt-1">per user</div>
              </div>
            </div>

            {/* Daily Analytics Chart */}
            {dailyAnalytics.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-400" />
                  Last 7 Days Activity
                </h3>
                <div className="space-y-4">
                  {dailyAnalytics.map((day) => {
                    const maxHours = Math.max(
                      ...dailyAnalytics.map((d) => d.hours),
                      1
                    );
                    const hoursPercentage = (day.hours / maxHours) * 100;

                    return (
                      <div key={day.date} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            {formatDate(day.date)}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">{day.hours}h</span>
                            <span className="text-gray-400">
                              {day.tasks} tasks
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${hoursPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Performance */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-400" />
                User Performance
              </h3>
              <div className="space-y-4">
                {analyticsData && analyticsData.length > 0 ? (
                  analyticsData
                    .filter((user) => user.tasks.length > 0)
                    .map((user) => {
                      const userHours = user.repositories.reduce(
                        (sum, repo) => sum + repo.totalHours,
                        0
                      );
                      const userTasks = user.repositories.reduce(
                        (sum, repo) => sum + repo.tasksCount,
                        0
                      );
                      const completedTasks = user.tasks.filter(
                        (task) => task.status === "COMPLETED"
                      ).length;

                      return (
                        <div
                          key={user.id}
                          className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-white font-medium">
                                {getFirstName(user.name)}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                {userHours}h
                              </div>
                              <div className="text-xs text-gray-400">
                                {userTasks} tasks
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                Completed Tasks
                              </span>
                              <span className="text-white">
                                {completedTasks} / {userTasks}
                              </span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{
                                  width: `${
                                    userTasks > 0
                                      ? (completedTasks / userTasks) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No analytics data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "repositories" && (
          <div className="space-y-6">
            {/* Repository Summary */}
            {(() => {
              // Group repositories by repositoryId
              const repoMap = new Map<
                string,
                {
                  repositoryId: string;
                  repositoryName: string;
                  totalHours: number;
                  totalTasks: number;
                  users: Array<{
                    userId: string;
                    userName: string;
                    userEmail: string;
                    hours: number;
                    tasks: number;
                  }>;
                }
              >();

              analyticsData?.forEach((user) => {
                user.repositories.forEach((repo) => {
                  const existing = repoMap.get(repo.repositoryId);
                  if (existing) {
                    existing.totalHours += repo.totalHours;
                    existing.totalTasks += repo.tasksCount;
                    existing.users.push({
                      userId: user.id,
                      userName: user.name || user.email,
                      userEmail: user.email,
                      hours: repo.totalHours,
                      tasks: repo.tasksCount,
                    });
                  } else {
                    repoMap.set(repo.repositoryId, {
                      repositoryId: repo.repositoryId,
                      repositoryName: repo.repositoryName,
                      totalHours: repo.totalHours,
                      totalTasks: repo.tasksCount,
                      users: [
                        {
                          userId: user.id,
                          userName: user.name || user.email,
                          userEmail: user.email,
                          hours: repo.totalHours,
                          tasks: repo.tasksCount,
                        },
                      ],
                    });
                  }
                });
              });

              const repositories = Array.from(repoMap.values()).sort(
                (a, b) => b.totalHours - a.totalHours
              );

              return repositories.length > 0 ? (
                repositories.map((repo) => (
                  <div
                    key={repo.repositoryId}
                    className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Folder className="text-blue-400" size={24} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {repo.repositoryName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Repository ID: {repo.repositoryId}
                        </p>
                      </div>
                    </div>

                    {/* Repository Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="text-blue-400" size={18} />
                          <span className="text-gray-400 text-sm">
                            Total Hours
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {repo.totalHours}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="text-green-400" size={18} />
                          <span className="text-gray-400 text-sm">
                            Total Tasks
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {repo.totalTasks}
                        </div>
                      </div>
                    </div>

                    {/* Users working on this repository */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <UsersRound size={16} />
                        Contributors ({repo.users.length})
                      </h4>
                      <div className="space-y-3">
                        {repo.users.map((user) => (
                          <div
                            key={user.userId}
                            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white font-medium">
                                  {getFirstName(user.userName)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.userEmail}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-white">
                                  {user.hours}h
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.tasks} tasks
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  Contribution
                                </span>
                                <span className="text-gray-400">
                                  {repo.totalHours > 0
                                    ? Math.round(
                                        (user.hours / repo.totalHours) * 100
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      repo.totalHours > 0
                                        ? (user.hours / repo.totalHours) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No repository data available
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
