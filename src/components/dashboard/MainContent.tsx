import { Button, Tabs } from "antd";
import { getTimeOfDay } from "../../utils/greeting";
import useUserStore from "../../store/useUserStore";
import { CardStack } from "../stack/Stack";

import type { TabsProps } from "antd";
import { Kanban } from "../kanban/Kanban";
import AdminDashboard from "../admin/AdminDashboard";
import { TestimonialCarousel } from "./slide";
import useKanbanStore, { Task } from "../kanban/useKanbanStore";
import Streak from "../streak/Streak";

const MainContent = () => {
  const { logout, profile } = useUserStore();
  const tasks = useKanbanStore((state) => state.tasks);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "All Tasks",
      children: <CardStack />,
      disabled: profile?.role === "USER",
    },
    {
      key: "3",
      label: "Admin Dashboard",
      children: <AdminDashboard />,
      disabled: profile?.role === "USER",
    },
    // {
    //   key: "4",
    //   label: "Slide",
    //   children: <TestimonialCarousel testimonials={tasks as Task[]} />,
    //   disabled: profile?.role === "USER",
    // },
  ];

  return (
    <div className="flex-1 bg-white p-4 rounded-md shadow-sm">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold m-0">Good {getTimeOfDay()} </h1>
        <Button type="primary" onClick={() => logout()}>
          Logout
        </Button>
      </div>
      <Tabs
        defaultActiveKey={profile?.role === "ADMIN" ? "1" : "2"}
        items={items}
      />
    </div>
  );
};

export default MainContent;
