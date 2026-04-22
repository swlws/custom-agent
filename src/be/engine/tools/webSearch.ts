import type { Tool } from "./index";

export const webSearchTool: Tool = {
  name: "web_search",
  description: "搜索互联网上的最新信息，返回相关结果摘要",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索关键词或问题",
      },
    },
    required: ["query"],
  },
  async execute(args, signal) {
    const query = args.query as string;

    const apiKey = process.env.SWLWS_SEARCH_API_KEY;
    const baseUrl = process.env.SWLWS_SEARCH_BASE_URL;

    if (!apiKey || !baseUrl) {
      return `[搜索功能未配置，无法执行搜索：${query}。请设置 SWLWS_SEARCH_API_KEY 和 SWLWS_SEARCH_BASE_URL 环境变量。]`;
    }

    const url = `${baseUrl}?q=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url, { signal });

    if (!res.ok) {
      return `[搜索请求失败：HTTP ${res.status}]`;
    }

    const data = (await res.json()) as { results?: { title: string; snippet: string }[] };
    const results = data.results ?? [];

    if (results.length === 0) {
      return `[未找到关于"${query}"的搜索结果]`;
    }

    return results
      .slice(0, 5)
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}`)
      .join("\n\n");
  },
};
