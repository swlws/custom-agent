interface SelectProps<T extends string | number> {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  format,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        // 若原始值是数字类型则转回数字，否则直接传字符串
        const next = (typeof value === "number" ? Number(raw) : raw) as T;
        onChange(next);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition-colors focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100 dark:focus:border-[#666]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {format ? format(o) : o}
        </option>
      ))}
    </select>
  );
}
