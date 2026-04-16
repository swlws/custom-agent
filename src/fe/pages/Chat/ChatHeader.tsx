interface ChatHeaderProps {
  onLoadHistory: () => void;
  onNewChat: () => void;
}

export function ChatHeader({ onLoadHistory, onNewChat }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-[#3f3f46]">
      <button
        onClick={onLoadHistory}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        title="加载历史对话"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      <button
        onClick={onNewChat}
        className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
      >
        新对话
      </button>
    </div>
  );
}
