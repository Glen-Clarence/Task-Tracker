import { Spin, Button } from "antd";
import useProjects from "./useProjects";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi, UserAnalyticsData } from "@/api/users.api";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  TrendingUp,
  UsersRound,
  User,
  Folder,
} from "lucide-react";

const Projects: React.FC = () => {
  const { projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "repositories" | "analytics" | "repositories-list"
  >("repositories");

  // Fetch analytics data for all users (without repositoryId filter)
  const { data: analyticsData } = useQuery<UserAnalyticsData[]>({
    queryKey: ["all-analytics"],
    queryFn: () => usersApi.getAnalytics(),
    enabled: activeTab === "analytics" || activeTab === "repositories-list",
  });

  const getFirstName = (fullName: string | undefined | null) => {
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
      if (!user.repositories) return sum;
      const userHours = user.repositories.reduce(
        (repoSum, repo) => repoSum + (repo.totalHours || 0),
        0
      );
      return sum + userHours;
    }, 0);

    const totalTasks = analyticsData.reduce((sum, user) => {
      if (!user.repositories) return sum;
      const userTasks = user.repositories.reduce(
        (repoSum, repo) => repoSum + (repo.tasksCount || 0),
        0
      );
      return sum + userTasks;
    }, 0);

    const activeUsers = analyticsData.filter((user) => {
      const hasTasks = user.tasks && user.tasks.length > 0;
      const hasAnalytics = user.analytics && user.analytics.length > 0;
      return hasTasks || hasAnalytics;
    }).length;

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
    if (!analyticsData || analyticsData.length === 0) return [];

    const dailyMap = new Map<string, { hours: number; tasks: number }>();

    analyticsData.forEach((user) => {
      if (!user.analytics || user.analytics.length === 0) return;
      user.analytics.forEach((analytics) => {
        if (!analytics.date) return;
        const existing = dailyMap.get(analytics.date) || {
          hours: 0,
          tasks: 0,
        };
        dailyMap.set(analytics.date, {
          hours: existing.hours + (analytics.hoursWorked || 0),
          tasks: existing.tasks + (analytics.tasksCount || 0),
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Repositories</h2>
          <Button className={clsx("mt-4")}>Create Project</Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-8">
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
              onClick={() => setActiveTab("repositories-list")}
              className={`pb-3 px-1 font-medium text-base transition-colors relative ${
                activeTab === "repositories-list"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Repository Details
              {activeTab === "repositories-list" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "repositories" && (
          <Spin spinning={isLoading}>
            <div className="flex flex-wrap gap-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/repositories/${project.id}`)}
                  className="flex items-center gap-2 relative cursor-pointer group transition-transform duration-200 hover:scale-105"
                >
                  <svg
                    key={project.id}
                    width="256"
                    height="192"
                    viewBox="0 0 128 96"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-all duration-200 group-hover:drop-shadow-lg"
                  >
                    <rect x="0" y="0" width="128" height="96" fill="none" />
                    <path
                      d="M0 24C0 17.3726 5.37258 12 12 12H48L60 24H116C122.627 24 128 29.3726 128 36V84C128 90.6274 122.627 96 116 96H12C5.37258 96 0 90.6274 0 84V24Z"
                      fill="#2E2E2E"
                      className="transition-colors duration-200 group-hover:fill-[#3a3a3a]"
                    />
                    <path
                      d="M0 24C0 17.3726 5.37258 12 12 12H48L60 24H0V24Z"
                      fill="#B0B0B0"
                      className="transition-colors duration-200 group-hover:fill-[#c4c4c4]"
                    />
                  </svg>
                  <p className="absolute bottom-4 text-2xl left-6 text-white capitalize font-medium transition-all duration-200 group-hover:text-opacity-90">
                    {project.name}
                  </p>
                </div>
              ))}
            </div>
          </Spin>
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
                    .filter((user) => {
                      const hasRepositories =
                        user.repositories && user.repositories.length > 0;
                      const hasAnalytics =
                        user.analytics && user.analytics.length > 0;
                      return hasRepositories || hasAnalytics;
                    })
                    .map((user) => {
                      const userHours = (user.repositories || []).reduce(
                        (sum, repo) => sum + (repo.totalHours || 0),
                        0
                      );
                      const userTasks = (user.repositories || []).reduce(
                        (sum, repo) => sum + (repo.tasksCount || 0),
                        0
                      );
                      const completedTasks = (user.tasks || []).filter(
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

                          {/* Repositories */}
                          {user.repositories &&
                            user.repositories.length > 0 && (
                              <div className="mb-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                                  <Folder size={12} />
                                  Repositories ({user.repositories.length})
                                </div>
                                <div className="space-y-1.5">
                                  {user.repositories.map((repo) => (
                                    <div
                                      key={repo.repositoryId}
                                      className="bg-gray-800/50 rounded p-2 border border-gray-700/50"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm text-white font-medium truncate">
                                            {repo.repositoryName}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {repo.repositoryId}
                                          </div>
                                        </div>
                                        <div className="text-right ml-3">
                                          <div className="text-sm font-bold text-blue-400">
                                            {repo.totalHours}h
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {repo.tasksCount} tasks
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {user.tasks && user.tasks.length > 0 && (
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
                          )}
                          {(!user.tasks || user.tasks.length === 0) &&
                            userTasks > 0 && (
                              <div className="text-xs text-gray-500 mt-2">
                                {userTasks} total tasks across repositories
                              </div>
                            )}
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

        {activeTab === "repositories-list" && (
          <div className="space-y-6">
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
                if (!user.repositories || user.repositories.length === 0)
                  return;
                user.repositories.forEach((repo) => {
                  if (!repo.repositoryId) return;
                  const existing = repoMap.get(repo.repositoryId);
                  if (existing) {
                    existing.totalHours += repo.totalHours || 0;
                    existing.totalTasks += repo.tasksCount || 0;
                    existing.users.push({
                      userId: user.id,
                      userName: user.name || user.email,
                      userEmail: user.email,
                      hours: repo.totalHours || 0,
                      tasks: repo.tasksCount || 0,
                    });
                  } else {
                    repoMap.set(repo.repositoryId, {
                      repositoryId: repo.repositoryId,
                      repositoryName: repo.repositoryName || "Unknown",
                      totalHours: repo.totalHours || 0,
                      totalTasks: repo.tasksCount || 0,
                      users: [
                        {
                          userId: user.id,
                          userName: user.name || user.email,
                          userEmail: user.email,
                          hours: repo.totalHours || 0,
                          tasks: repo.tasksCount || 0,
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

export default Projects;
