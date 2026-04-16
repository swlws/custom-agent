interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}

export function InputBar({ value, onChange, onSend, onKeyDown, disabled }: InputBarProps) {
  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-[#3f3f46] dark:bg-[#212121] sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-gray-300 bg-white p-2 shadow-sm transition-colors focus-within:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:focus-within:border-[#666]">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message ChatGPT"
          disabled={disabled}
          className="max-h-48 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-500 disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-full bg-[#202123] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200"
        >
          Send
        </button>
      </div>
    </div>
  );
}
