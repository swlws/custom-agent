# reflection 设计方案

重新设计方案：环境驱动的 Reflection

  ---
  核心问题诊断

  当前实现的根本缺陷：每次 runReActLoop 调用都是无状态的孤岛，模型无法看到上一阶段的真实输出，只能凭 prompt 描述去"想象"自己写了什么。

  现状（孤岛式）:
    Think  →  Draft  →  Audit  →  Revise
    [独立] →  [独立] →  [独立] →  [独立]
    模型无法真正"看到"自己的上一步输出

  目标（连续式）:
    Think  →  Draft  →  Audit  →  Revise
       ↑______messages[]____________________↑
    所有阶段共享同一 context，模型真正读到自己的历史

  ---
  新设计：三层架构

  第一层：共享上下文（借鉴 Claude Code 的工具输出注入）

  放弃 每阶段独立调用 runReActLoop，改为 所有阶段操作同一个 messages[]：

  messages[] 演化过程：

  [user: 原始需求]
      ↓ Think 阶段
  [user: 原始需求]
  [assistant: 思考内容]
      ↓ Draft 阶段
  [user: 原始需求]
  [assistant: 思考内容]
  [user: "基于上述思考，给出完整答案"]
  [assistant: 初稿内容]
      ↓ Audit 阶段
  [user: 原始需求]
  [assistant: 思考内容]
  [user: "基于上述思考，给出完整答案"]
  [assistant: 初稿内容]
  [user: "请审查你刚才的答案（↑ 模型真实看到初稿）"]
  [assistant: 审查结论（JSON）]
      ↓ Revise（如需）
  ... 继续追加

  第二层：结构化 Audit（借鉴 Claude Code 的可验证目标）

  当前 Audit 返回自由文本，判断逻辑是 includes("✅ 完成") ——脆弱且模糊。

  改为 强制 Audit 阶段输出结构化 JSON：

  interface AuditResult {
    status: "pass" | "fail";
    confidence: number;       // 0-1，模型对自身评分的置信度
    issues: Array<{
      severity: "critical" | "minor";
      description: string;
      suggestion: string;
    }>;
  }

  触发修正的条件改为：status === "fail" && issues.some(i => i.severity === "critical")

  minor 问题不触发重写，只在最终输出中附注。

  第三层：多轮上限 + 收敛检测（借鉴 Claude Code 的 course-correcting）

  MAX_ROUNDS = 3（可配置）

  Round 1: Draft → Audit → [pass?] → 结束
                         ↓ [fail]
  Round 2: Revise → Audit → [pass?] → 结束
                          ↓ [fail]
  Round 3: Revise → Audit → 强制结束（无论结果）

  新增收敛检测：若连续两轮 issues 内容高度重复（cosine 相似度 > 0.8 或完全相同），提前退出防止无效循环。

  ---
  流程图

  用户输入
      │
      ▼
  ┌─────────────────────────────────────────┐
  │  Phase 0: Decompose（可选）              │
  │  将复杂需求拆解为可验证的子目标列表      │  → Cot 卡片
  └─────────────────────────────────────────┘
      │
      ▼
  ┌─────────────────────────────────────────┐
  │  Phase 1: Think                          │
  │  深度分析，结果追加到 messages[]         │  → Cot 卡片
  └─────────────────────────────────────────┘
      │
      ▼
  ┌─────────────────────────────────────────┐
  │  Phase 2: Draft                          │
  │  基于完整 messages[] 生成初稿            │  → Markdown 卡片
  └─────────────────────────────────────────┘
      │
      ▼
  ┌─────────────────────────────────────────┐
  │  Phase 3: Audit（结构化 JSON 输出）      │
  │  对照 messages[] 中的初稿做审查          │  → Cot 卡片（折叠）
  │  返回 AuditResult                        │
  └─────────────────────────────────────────┘
      │
      ├── status=pass ──────────────────────────→ 结束
      │
      └── status=fail && has critical issues
                │
                ▼
           ┌──────────────────────┐
           │  Phase 4: Revise     │  → Markdown 卡片（覆盖前一稿）
           │  注入 issues 为上下文 │
           └──────────────────────┘
                │
                ▼
           回到 Phase 3（最多 MAX_ROUNDS 次）
                │
                ▼
           强制结束，输出最后一稿

  ---
  关键接口变更

  新增 runReflectionLoop 替代现有 runReActLoop 多次调用：

  // 新接口设计（伪代码，不修改现有文件）
  interface ReflectionOptions extends ReActOptions {
    maxRounds?: number;           // 默认 3
    auditTemperature?: number;    // Audit 阶段用低温 0.2，更稳定
    draftTemperature?: number;    // Draft 阶段用 0.7
  }

  async function runReflectionLoop(
    userContent: string,
    contextMessages: Message[],   // 历史对话注入
    onToken: OnTokenFn,
    options: ReflectionOptions,
  ): Promise<string>

  runReActLoop 需扩展，支持传入已有 messages[] 并返回完整追加后的数组：

  // 现有签名（只接受初始消息）
  runReActLoop(initialMessages, onToken, options)

  // 新增重载（接受可变的 messages[] 并追加）
  runReActLoop(messages: MessagesMutable, onToken, options)
  // 执行完毕后 messages[] 已包含本轮 assistant 输出

  ---
  与现有架构的兼容性

  ┌───────────────────────────┬────────────────────────┬──────────────────────────────────┐
  │          变更点           │      现有代码影响      │               说明               │
  ├───────────────────────────┼────────────────────────┼──────────────────────────────────┤
  │ reflectionRunner 内部重写 │ 仅 reflection/index.ts │ 不影响其他 runner                │
  ├───────────────────────────┼────────────────────────┼──────────────────────────────────┤
  │ runReActLoop 新增重载     │ react-core.ts 向后兼容 │ 保持现有调用不变                 │
  ├───────────────────────────┼────────────────────────┼──────────────────────────────────┤
  │ 新增 AuditResult 类型     │ type.ts 追加           │ 不影响现有 CardType / ModeRunner │
  ├───────────────────────────┼────────────────────────┼──────────────────────────────────┤
  │ MAX_ROUNDS 配置           │ 可挂在 AppSettings 下  │ 可选，默认值兜底                 │
  └───────────────────────────┴────────────────────────┴──────────────────────────────────┘

  ---
  设计总结

  ┌──────────────────────┬────────────────────────────────┬────────────────────────────────────┐
  │         维度         │            现有设计            │               新设计               │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 上下文               │ 4个孤岛，各自独立              │ 1个连续 messages[]，全程共享       │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 退出信号             │ 文本 includes("✅ 完成")       │ 结构化 AuditResult.status          │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 修正轮次             │ 硬编码最多 1 次                │ 可配置 MAX_ROUNDS，含收敛检测      │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 审查粒度             │ 通过/不通过，无细节            │ severity 分级，区分 critical/minor │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 修正触发             │ 任何非"完成"文本               │ 仅 critical 问题触发，minor 仅记录 │
  ├──────────────────────┼────────────────────────────────┼────────────────────────────────────┤
  │ 模型对自身输出的感知 │ 靠 prompt 描述"刚才生成的答案" │ 真实读取 messages[] 中的历史       │
  └──────────────────────┴────────────────────────────────┴────────────────────────────────────┘