"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/fe/components/Dialog";
import { Button } from "@/fe/components/Button";
import { TrashIcon, RefreshIcon } from "@/fe/components/icons";
import {
  getMcpServers,
  addMcpServer,
  deleteMcpServer,
  stopMcpServer,
  startMcpServer,
  type McpServerStatus,
  type McpServerConfig,
} from "@/fe/apis/mcp";

interface McpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransportType = "stdio" | "sse";

const STATUS_LABELS: Record<McpServerStatus["status"], string> = {
  connected: "已连接",
  failed: "连接失败",
  disconnected: "已断开",
};

const STATUS_COLORS: Record<McpServerStatus["status"], string> = {
  connected: "bg-green-400",
  failed: "bg-red-400",
  disconnected: "bg-gray-400",
};

export function McpPanel({ isOpen, onClose }: McpPanelProps) {
  const [servers, setServers] = useState<McpServerStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formTransport, setFormTransport] = useState<TransportType>("stdio");
  const [formCommand, setFormCommand] = useState("");
  const [formArgs, setFormArgs] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMcpServers();
      setServers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  function resetForm() {
    setFormName("");
    setFormTransport("stdio");
    setFormCommand("");
    setFormArgs("");
    setFormUrl("");
    setFormError("");
  }

  async function handleAdd() {
    const name = formName.trim();
    if (!name) {
      setFormError("请输入服务名称");
      return;
    }

    let config: McpServerConfig;
    if (formTransport === "stdio") {
      const command = formCommand.trim();
      if (!command) {
        setFormError("请输入启动命令");
        return;
      }
      const args = formArgs
        .trim()
        .split(/\s+/)
        .filter((s) => s);
      config = { transport: "stdio", command, args };
    } else {
      const url = formUrl.trim();
      if (!url) {
        setFormError("请输入 SSE URL");
        return;
      }
      config = { transport: "sse", url };
    }

    setAdding(true);
    setFormError("");
    try {
      const res = await addMcpServer(name, config);
      if (!res.ok) {
        setFormError(res.error ?? "添加失败");
        return;
      }
      resetForm();
      setShowForm(false);
      await refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(name: string) {
    await deleteMcpServer(name);
    await refresh();
  }

  async function handleStop(name: string) {
    await stopMcpServer(name);
    await refresh();
  }

  async function handleStart(name: string) {
    await startMcpServer(name);
    await refresh();
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="MCP 服务"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-between px-5 py-4">
          <Button
            variant="ghost"
            onClick={refresh}
            disabled={loading}
          >
            <span className="flex items-center gap-1">
              <RefreshIcon size={14} />
              刷新
            </span>
          </Button>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
        {/* Server List */}
        {servers.length === 0 && !loading && (
          <p className="py-4 text-center text-sm text-gray-400">
            暂无 MCP 服务
          </p>
        )}
        {loading && servers.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">加载中…</p>
        )}

        <div className="space-y-2">
          {servers.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-gray-200 dark:border-[#3f3f46]"
            >
              {/* Server Header */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[s.status]}`}
                  title={STATUS_LABELS[s.status]}
                />
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    setExpandedServer(
                      expandedServer === s.name ? null : s.name,
                    )
                  }
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {s.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {s.config.transport} · {STATUS_LABELS[s.status]}
                    {s.tools.length > 0 && ` · ${s.tools.length} 工具`}
                  </span>
                </button>
                {s.status === "connected" ? (
                  <button
                    onClick={() => handleStop(s.name)}
                    title="停止"
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-[#3a3a3a]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(s.name)}
                    title="启动"
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-500 dark:hover:bg-[#3a3a3a]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(s.name)}
                  title="删除"
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-[#3a3a3a]"
                >
                  <TrashIcon />
                </button>
              </div>

              {/* Expanded Details */}
              {expandedServer === s.name && (
                <div className="border-t border-gray-100 px-3 py-2 dark:border-[#3f3f46]">
                  {s.error && (
                    <p className="mb-1 text-xs text-red-400">{s.error}</p>
                  )}
                  {s.tools.length > 0 ? (
                    <div>
                      <p className="mb-1 text-xs text-gray-400">可用工具：</p>
                      <div className="flex flex-wrap gap-1">
                        {s.tools.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-[#2f2f2f] dark:text-gray-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">无可用工具</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Form Toggle */}
        <div className="mt-4">
          {!showForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              + 添加 MCP 服务
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-[#3f3f46]">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  服务名称
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如 duckduckgo-search"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  传输方式
                </label>
                <div className="flex gap-2">
                  {(["stdio", "sse"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormTransport(t)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        formTransport === t
                          ? "bg-[#202123] text-white dark:bg-white dark:text-[#202123]"
                          : "border border-gray-300 text-gray-600 dark:border-[#4a4a4a] dark:text-gray-300"
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {formTransport === "stdio" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      启动命令
                    </label>
                    <input
                      value={formCommand}
                      onChange={(e) => setFormCommand(e.target.value)}
                      placeholder="例如 npx"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      参数（空格分隔）
                    </label>
                    <input
                      value={formArgs}
                      onChange={(e) => setFormArgs(e.target.value)}
                      placeholder="例如 -y duckduckgo-mcp-server"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    SSE URL
                  </label>
                  <input
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com/sse"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100"
                  />
                </div>
              )}

              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAdd}
                  disabled={adding}
                >
                  {adding ? "连接中…" : "添加"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
