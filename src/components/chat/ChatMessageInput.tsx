import { useState } from "react";

const ChatMessageInput: React.FC = () => {
  const [message, setMessage] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log("Send:", message);
    setMessage("");
  };

  return (
    <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-200 bg-white">
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-500 px-3 py-1"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={`ml-2 rounded-full p-1.5 ${
            message.trim()
              ? "bg-blue-600 text-white"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatMessageInput;
