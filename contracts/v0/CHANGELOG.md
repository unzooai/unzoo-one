# `contracts/v0` 变更记录

版本策略：新增可选字段、新增事件类型、放宽约束 —— 向后兼容，记在这里即可。
删字段、改语义、收窄枚举、改必填 —— 破坏兼容，必须升 major 并开新目录。

## 2026-11-10 — `approval.decided_by` 新增 `policy`，并带 `rule_id`（向后兼容：新增）

托管会话的审批可以由工作区里一条预先定下的规则直接答复，不打扰任何人：允许
`cargo test`、永远拒绝 `git push --force` 之类。每次都问会把人训练成不看就点
「允许」，规则把注意力留给真正需要判断的那几次。

- `decided_by` 增加 `policy`
- 新增 `rule_id`；`decided_by` 为 `policy` 时必填——自动决定没有人在场，能追溯的
  只有规则本身（反例 `invalid/brain-approval-policy-without-rule.json`）
- `examples/brain-events.json` 增加一条由规则放行的问答

实现（unterm `agent_policy`）：规则只能由人定——控制台 REST，或答复时带
`remember`；没有任何 MCP 方法能加规则，否则 agent 就能自己批准自己。带命令前缀
的放行规则绝不匹配拼接命令（`&&`、`;`、`|`、重定向、命令替换），拒绝规则则连
拼接命令的各段一起看。真实 Claude Code 实测：控制台勾「记住」批准一次，同一工作区
再跑同一条命令时以 `decided_by: policy` 自动放行、不进收件箱；拒绝规则命中则拒绝
并结束本轮。导出事件按本目录 schema 校验全部通过。

## 2026-11-09 — Brain 事件新增 `approval.requested` / `approval.resolved`（向后兼容：新增）

无头运行的 agent 不再只能「预先放行或跳过权限」：Brain 在执行某个工具前停下来问宿主，
宿主答复后才继续。这两个事件把这次问答放进同一条事件流。

- `approval.requested`：必须带 `approval.request_id` 和 `approval.tool_call{tool, arguments}`。
  只说「有东西想执行」而不说是什么，就不是审批，是盲签（反例
  `invalid/brain-approval-requested-without-tool.json`）
- `approval.resolved`：必须带 `request_id` 和 `decision`（`allow_once` / `deny`，沿用
  task/approval 的词——这里只答复这一次调用，不授予更大范围）。`deny` 必须带 `message`，
  它会作为工具错误交给模型（反例 `invalid/brain-approval-denied-without-message.json`）
- `interrupt`：拒绝时一并结束本轮。实测 Claude 被拒后会立刻换一个命令再问，一次拒绝
  不够；带上它，本轮以 `interrupted` 结束
- `decided_by`：`caller` 或 `unterm`（会话关闭时仍未答复，由宿主代为拒绝）
- `examples/brain-events.json` 增加一问一答

实现：unterm 的托管会话（`agent_session.start` 带 `hosted: true`，答复用
`agent_session.decide`）。真实 Claude Code 2.1.319 端到端：放行写文件 → 文件写出；
同一进程追问一轮；拒绝并中断 → 文件未写、本轮 100ms 内以 interrupted 结束。
两段会话共 23 条事件用本目录的 schema 校验全部通过。

OpenCode 走 ACP（`opencode acp`，unterm 把 bash/edit/webfetch 设为询问——OpenCode 默认全放行，
不改就永远不会来问）。经无头 Core + MCP 桥接实测：放行写文件、追问一轮、拒绝并中断
（0.31s 以 interrupted 结束）、未答复即关闭（代拒并中断），55 条事件校验全部通过。
ACP 的答复只是选项、不带文字，所以对 OpenCode 来说 `deny` 的 `message` 只记录在案、到不了模型。

## 2026-11-09 — `turn.started` 的 `model` 改为可选（向后兼容：放宽）

`codex exec --json` 的 `turn.started` 不带模型名，有的 CLI 要到这一轮后面才报。
原来要求 `model` 必填，实现只能填 `"unknown"` 之类的假值，比缺省更糟——它看起来像
真的。现在 `turn.started` 只要求 `turn_id`；`model` 出现时仍须是字符串。

unterm 的会话层（`unterm/unterm-services/src/agent_session.rs`）已按 v0 输出：
`schema_version: "brain_event.v0"`、生成 `turn_…` id 并贯穿整轮、
`tool_call.requested` 用嵌套的 `tool_call`、`turn.completed` / `session.closed`
用契约的 `state`、`error` 带结构化 `error`。一次真实会话的 10 条事件已用本目录
的 schema 逐条校验通过。

## 2026-11-09 — Brain 事件 `output.delta` 改用 `stream` + `text`（**破坏兼容，冻结前**）

对应 `unzoo-one#15`，来自 `zhitongblog/unterm#30` 第 3 项。unterm 源码已并入本仓库
`unterm/`，契约以 unterm 的实际输出为准。

- `output.delta` 新增必填 `stream`，取值 `assistant` / `reasoning`
- 增量文本字段 `message` 改名为 `text`，与 unterm 的输出、以及 Core 事件信封
  `brain.message_delta` 的 `data.text` 一致；`output.delta` 现在要求 `stream` 和 `text`
- 从 `brain_event_type` 移除 `reasoning.summary`：推理和回答是同一条流的增量、在一个
  turn 内交错到达，拆成两种事件会丢掉它们的相对顺序。推理改走 `output.delta` +
  `stream: reasoning`，不想展示就按 `stream` 过滤
- 新增反例 `invalid/brain-output-delta-without-stream.json`、
  `invalid/brain-reasoning-summary-event.json`

按版本策略，收窄枚举和改字段名都属于破坏兼容，本应升 major。这次直接改 v0，
**只因为 v0 还没冻结**（M0 的三仓库评审尚未发生）。冻结之后同类改动必须开 `contracts/v1`。

`brain/adapter.schema.json` 的能力位 `reasoning_summary` 保留不动：它描述的是
「Adapter 能否提供可展示的推理文本」，和事件类型叫什么无关。

## 2026-09-08 — timestamp 接受 `+00:00`（向后兼容：放宽）

`common/primitives.schema.json` 的 `timestamp` 原来只收字面 `Z`。unterm 用
`chrono::Utc::now().to_rfc3339()`，产出的是 `+00:00` 结尾——两种写法都是合法的
RFC 3339 UTC，语义相同。规则本来就是「必须是 UTC」，不是「必须字面写成 Z」，
所以是这条 pattern 表述错了，不该让实现去迁就。

对应 `unzoo-one#14`，来自 `zhitongblog/unterm#30` 第 6 项。

- 接受 `Z` 和 `+00:00`
- 继续拒绝一切非零偏移（`+08:00`、`-05:00`）
- **`-00:00` 仍然拒绝**：RFC 3339 里它表示「偏移未知」而不是 UTC，正是这条规则
  要挡的东西。新增反例 `invalid/timestamp-unknown-offset.json` 守着
- `examples/brain-events.json` 全部改成 `+00:00`——它对应的就是 unterm 的真实输出
- 已有的 `invalid/task-local-time.json`（`+08:00`）仍被拒绝，用来证明没有放宽过头

Core 侧不受影响：`one-core` 无论 pattern 怎么放宽都只产出 `Z`，存储层只留一种写法，
比较和排序就不用考虑两种形式。

## 2026-09-03 — 初版

建立 22 个 schema、24 个示例、29 个反例固件，全部通过
`npm run test:contracts`。对应 ONE-C001 / `unzoo-one#3`。

新增：

- `common/` — primitives（ID/时间/哈希/Actor/敏感度/预算/保留期）、error
- `task/` — task、run、step、tool-call、approval、inbox-item
- `brain/` — adapter、thread（含 turn）、events
- `provider/` — manifest、invoke、action-result
- `security/` — risk、capability-grant、policy-decision
- `workspace/` — workspace、capability-scope
- `artifact/` — artifact
- `automation/` — automation
- `events/` — envelope

与文字规范的三处出入，以 schema 为准，文档已同步：

1. `approval.allowed_decisions` 的取值采用安全模型 §11 的四个
   （`allow_once` / `allow_for_task` / `allow_exact_for_automation` / `deny`）。
   领域模型 §8 的示例里写的是 `allow_for_automation`，已改。
2. `grant.resources` 采用安全模型 §10 的分类型范围（files / terminal / browser /
   desktop / connector），不是领域模型 §9 示例里的扁平结构。同一份定义由 Grant、
   Approval 的 canonical payload 和 Provider 校验共用——分开写就没法判断有没有越界。
3. 目录布局采用领域模型 §19 的 `contracts/v0/<域>/`，不是交付路线图 §4 的
   `contracts/<域>/v0/`。路线图已同步。

尚未纳入 v0（M5 之前不需要，避免冻结用不上的东西）：

- Memory（领域模型 §14）
- Connector 自身的配置与凭证声明
- Model Router 的路由策略
