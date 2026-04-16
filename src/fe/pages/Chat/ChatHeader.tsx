interface ChatHeaderProps {
  onNewChat: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-end border-b border-gray-200 px-4 py-2 dark:border-[#3f3f46]">
      <button
        onClick={onNewChat}
        className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
      >
        New Chat
      </button>
    </div>
  );
}
