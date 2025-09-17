import ChatUserAvatar from "./ChatUserAvatar";
import ChatTag from "./ChatTag";

const ChatSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white p-4 border-l border-gray-300 flex flex-col">
      <div className="flex space-x-2 overflow-x-auto pb-4">
        {/* Render user avatars */}
        {["Luna", "Jason", "Alisha"].map((user) => (
          <ChatUserAvatar key={user} name={user} />
        ))}
      </div>

      <div className="flex flex-col space-y-2 mt-4">
        {["Travel", "Design", "Cash Money", "Marketing"].map((tag) => (
          <ChatTag key={tag} label={tag} />
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
