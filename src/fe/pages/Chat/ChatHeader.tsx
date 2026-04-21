import { SidebarToggleIcon } from "@/fe/components/icons";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({ sidebarOpen, onToggleSidebar }: ChatHeaderProps) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center border-b border-gray-200 px-3 dark:border-[#2f2f2f]">
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
      >
        <SidebarToggleIcon />
      </button>
    </div>
  );
}
