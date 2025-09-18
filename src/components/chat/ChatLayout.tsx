import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const ChatLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex h-screen bg-white">
      {/* Chat area */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {children}
      </div>
      {/* Sidebar will be rendered by the parent component */}
    </div>
  );
};

export default ChatLayout;
