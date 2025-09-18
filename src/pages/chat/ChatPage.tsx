import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatMessageInput from "@/components/chat/ChatMessageInput";

const ChatPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar (left) */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <ChatSidebar />
      </div>

      {/* Chat area (right) */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatMessageList />
        </div>
        <ChatMessageInput />
      </div>
    </div>
  );
};

export default ChatPage;
