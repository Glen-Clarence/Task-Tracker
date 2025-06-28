import { useLocation, useNavigate } from "react-router";
import {
  Home,
  ListTodo,
  StickyNote,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Folder,
  ChevronDown,
  SquarePen,
  ShieldUser,
  LogOut,
  BookDashed,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { Dropdown, Modal } from "antd";
import useUserStore from "../../store/useUserStore";
import QuickAdd from "../modals/QuickAdd";
import { Button } from "../ui/button";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const profile = useUserStore((state) => state.profile);
  const logout = useUserStore((state) => state.logout);

  const [isModalOpen, setIsModalOpen] = useState<{
    task?: boolean;
    issue?: boolean;
  }>({
    task: false,
    issue: false,
  });

  const navItems = [
    { key: "/", icon: Home, label: "Home" },
    { key: "/dashboard", icon: BookDashed, label: "Dashboard" },
    { key: "/tasks", icon: ListTodo, label: "Tasks" },
    { key: "/issues", icon: AlertCircle, label: "Issues" },
    { key: "/repositories", icon: Folder, label: "Repositories" },
    { key: "/folders/notes", icon: StickyNote, label: "Notes" },
    { key: "/pulseboard", icon: HeartPulse, label: "Pulseboard" },
    { key: "/admin", icon: ShieldUser, label: "Admin" },
  ];

  return (
    <div
      className={clsx(
        "h-[calc(100vh-1rem)]  transition-all transition-discrete duration-300",
        isCollapsed
          ? "fixed -left-48 w-52 z-50 bg-black hover:left-0 opacity-0 hover:opacity-100 transition-all duration-300"
          : "relative w-44"
      )}
      // onMouseEnter={() => setIsCollapsed(false)}
      // onMouseLeave={() => setIsCollapsed(true)}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={clsx(
          "absolute -right-4 top-96 p-1.5 rounded-full bg-white/10",
          "hover:bg-white/20 transition-colors duration-200",
          "border border-white/20 backdrop-blur-sm"
        )}
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-white" />
        ) : (
          <ChevronLeft size={16} className="text-white" />
        )}
      </button>
      <div className="text-white ml-6 mt-6 mr-2 flex items-center justify-between">
        <Dropdown
          menu={{
            items: [
              {
                key: "logout",
                label: "Logout",
                icon: <LogOut size={14} />,
                onClick: () => logout(),
              },
            ],
          }}
          trigger={["click"]}
        >
          <span className="flex items-center gap-2 cursor-pointer">
            <span>{profile && profile?.name?.split(" ")[0]}</span>
            <ChevronDown size={16} />
          </span>
        </Dropdown>
        <span
          className="px-1 py-1 hover:bg-white/10 rounded-md cursor-pointer"
          onClick={() => setIsModalOpen({ ...isModalOpen, task: true })}
        >
          <SquarePen size={16} />
        </span>
      </div>
      <nav className={clsx("p-2 space-y-1")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.key;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg transition-all duration-200 px-2 py-2",
                "hover:bg-white/10 active:bg-white/20",
                isActive && "bg-white/10"
              )}
              title={item.label}
            >
              <Icon size={16} className="text-white flex-shrink-0" />

              <span className="text-white text-[13px] whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
        <Button onClick={() => logout()} className="absolute bottom-9">
          <LogOut size={8} />
          Logout
        </Button>
      </nav>
      <Modal
        open={isModalOpen.task}
        onCancel={() => setIsModalOpen({ ...isModalOpen, task: false })}
        footer={null}
        width={800}
      >
        <QuickAdd setIsModalOpen={setIsModalOpen} />
      </Modal>
    </div>
  );
};

export default Sidebar;
