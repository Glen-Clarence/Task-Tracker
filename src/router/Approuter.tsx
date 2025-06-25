import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "../pages/home/Home";
import { Kanban } from "../components/kanban/Kanban";
import Layout from "./Layout";
import IssuesOutlet from "./outlets/IssuesOutlet";
import Projects from "../components/projects/Projects";
import ProjectsOutlet from "./outlets/ProjectsOutlet";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { CardStack } from "@/components/stack/Stack";
import AdminOutlet from "./outlets/AdminOutlet";
import FoldersOutlet from "./outlets/FolderOutlet";
// import Editor from "@/components/notes/Editor";
import Doodler from "@/components/notes/Doodler";
const Dashboard = lazy(() => import("../components/dashboard/Dashboard"));
const LoginForm = lazy(() => import("../components/login/Login"));

// Lazy load new components
const Notes = lazy(() => import("../components/notes/Notes"));
const Issues = lazy(() => import("../components/issues/Issues"));

export const Approuter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/home",
          element: <Home />,
        },
        {
          path: "/dashboard",
          element: <Dashboard />,
        },
        {
          path: "/tasks",
          element: <Kanban />,
        },
        {
          path: "/folders",
          element: <FoldersOutlet />,
          children: [
            {
              path: "/folders/notes",
              element: <Notes />,
            },
            // {
            //   path: "/folders/notes/editor/:id",
            //   element: <Editor />,
            // },
            {
              path: "/folders/doodles/editor/:id",
              element: <Doodler />,
            },
          ],
        },

        {
          path: "/admin",
          element: <AdminOutlet />,
          children: [
            {
              path: "/admin",
              element: <AdminDashboard />,
            },
            {
              path: "/admin/tasks",
              element: <CardStack />,
            },
          ],
        },
        {
          path: "/issues",
          element: <IssuesOutlet />,
          children: [
            {
              path: "/issues",
              element: <Issues />,
            },
          ],
        },
        {
          path: "/repositories",
          element: <ProjectsOutlet />,
          children: [
            {
              path: "/repositories",
              element: <Projects />,
            },
            {
              path: "/repositories/:id",
              element: <Issues />,
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: <LoginForm />,
    },
  ]);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default Approuter;
