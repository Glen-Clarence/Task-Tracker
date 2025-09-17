interface Props {
  label: string;
}

const ChatTag: React.FC<Props> = ({ label }) => {
  return (
    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm cursor-pointer">
      {label}
    </span>
  );
};

export default ChatTag;
