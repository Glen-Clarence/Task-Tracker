interface Props {
  name: string;
}

const ChatUserAvatar: React.FC<Props> = ({ name }) => {
  const avatarText = name.slice(0, 2).toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
      {avatarText}
    </div>
  );
};

export default ChatUserAvatar;
