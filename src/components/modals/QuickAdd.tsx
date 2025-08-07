import { ConfigProvider, Tabs } from "antd";
import type { TabsProps } from "antd";

import AddTask from "./AddTask";
import QuickTask from "./QuickTask";
import Canvas from "./Canvas";
import AddIssue from "./AddIssue";
import AddRepo from "./AddRepo";
import useUserStore from "../../store/useUserStore";

const QuickAdd: React.FC<{
  setIsModalOpen: React.Dispatch<
    React.SetStateAction<{
      task?: boolean;
      issue?: boolean;
    }>
  >;
}> = ({ setIsModalOpen }) => {
  const { profile } = useUserStore();
  const isAdmin = profile?.role === "admin";

  const baseItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Task",
      children: <AddTask setIsModalOpen={setIsModalOpen} />,
    },
    {
      key: "2",
      label: "Quick Task",
      children: <QuickTask setIsModalOpen={setIsModalOpen} />,
    },
    {
      key: "3",
      label: "Issue",
      children: <AddIssue />,
    },
    {
      key: "5",
      label: "Note",
      children: <Canvas />,
      disabled: true,
    },
  ];

  // Add Repository tab only for admin users
  const items: TabsProps["items"] = isAdmin
    ? [
        ...baseItems.slice(0, 3),
        {
          key: "4",
          label: "Repository",
          children: <AddRepo />,
        },
        ...baseItems.slice(3),
      ]
    : baseItems;

  return (
    <div className="-mt-4">
      <ConfigProvider
        theme={{
          components: {
            Input: {
              colorBorder: "transparent",
              activeBorderColor: "transparent",
              activeShadow: "none",
              hoverBg: "#f2f2f2",
              hoverBorderColor: "transparent",
              activeBg: "#f2f2f2",
            },
            Form: {
              itemMarginBottom: 0,
            },
          },
          token: {
            fontSize: 12,
          },
        }}
      >
        <Tabs defaultActiveKey="1" items={items} />
      </ConfigProvider>
    </div>
  );
};

export default QuickAdd;
