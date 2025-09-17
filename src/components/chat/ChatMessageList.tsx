import { format } from "date-fns";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  name: string;
  time: string;
  date: string;
  isRead?: boolean;
}

const dummyMessages: Message[] = [
  {
    id: 1,
    text: "Hello there! How are you doing today? I was just checking in to see how you're doing.",
    sender: "other",
    name: "Luna Rodriguez",
    time: "7:04 AM",
    date: "2025-09-15",
    isRead: true
  },
  {
    id: 2,
    text: "Hi! I'm doing great, thanks for asking. Just working on some projects. How about you?",
    sender: "me",
    name: "Ram Manohar",
    time: "7:05 AM",
    date: "2025-09-15",
    isRead: true
  },
  {
    id: 3,
    text: "I'm good too! Just finished a big project and taking it easy today. What kind of projects are you working on?",
    sender: "other",
    name: "Luna Rodriguez",
    time: "7:06 AM",
    date: "2025-09-15",
    isRead: true
  },
  {
    id: 4,
    text: "I'm building a chat application with React and TypeScript. It's coming along nicely!",
    sender: "me",
    name: "Ram Manohar",
    time: "7:07 AM",
    date: "2025-09-15",
    isRead: true
  },
  {
    id: 5,
    text: "That sounds interesting! Let me know if you need any help with it.",
    sender: "other",
    name: "Luna Rodriguez",
    time: "7:08 AM",
    date: "2025-09-15",
    isRead: true
  },
  {
    id: 6,
    text: "Thanks! I'll definitely reach out if I need any assistance. 😊",
    sender: "me",
    name: "Ram Manohar",
    time: "7:09 AM",
    date: "2025-09-15",
    isRead: false
  },
];

const formatMessageTime = (timeString: string) => {
  return format(new Date(`2000-01-01 ${timeString}`), 'h:mm a');
};

const ChatMessageList: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Date separator */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative px-4 bg-white text-sm text-gray-500">
          {format(new Date('2025-09-15'), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-6">
        {dummyMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'other' && (
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                  {message.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              </div>
            )}
            <div className="max-w-[70%]">
              {message.sender === 'other' && (
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 mr-2">{message.name}</span>
                  <span className="text-xs text-gray-500">{formatMessageTime(message.time)}</span>
                </div>
              )}
              <div
                className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                  message.sender === 'me'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}
              >
                <p>{message.text}</p>
              </div>
              {message.sender === 'me' && (
                <div className="flex items-center justify-end mt-1">
                  <span className="text-xs text-gray-500 mr-2">{formatMessageTime(message.time)}</span>
                  {message.isRead ? (
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatMessageList;
