# Unzoo One 核心领域模型与协议契约

> 状态：Draft
> 日期：2026-07-26
> 目标：作为 `contracts/v0` JSON Schema 的文字规范

## 1. 设计规则

1. Unterm Core 是 Task、Approval、Grant、Event、Artifact 的唯一事实来源。
2. Unzoo One UI 不自行推导权威状态。
3. Provider 只拥有自身 Action 的执行状态。
4. Brain 不直接获得凭证，也不能签发 Grant。
5. 每个副作用调用必须具备稳定 Idempotency Key。
6. 所有对象使用不可变 ID。
7. 所有时间使用 RFC 3339 UTC，UI 本地化显示。
8. 所有 API 对象包含 `schema_version`。

## 2. ID 规范

建议格式：

```text
task_01J...
run_01J...
step_01J...
thread_01J...
call_01J...
approval_01J...
grant_01J...
action_01J...
artifact_01J...
event_01J...
automation_01J...
inbox_01J...
provider_unzoo_local
client_unzoo_one_desktop
```

要求：

- 使用 ULID 或 UUIDv7，具备时间排序能力。
- ID 不携带用户隐私。
- 外部 Provider ID 与内部对象 ID 分开保存。

## 3. Task

Task 表示用户目标。

核心字段：

```json
{
  "schema_version": "task.v0",
  "task_id": "task_...",
  "title": "调研竞品并生成报告",
  "goal": "完整用户输入",
  "mode": "work",
  "state": "running",
  "created_by": "user_local",
  "workspace_refs": ["workspace_..."],
  "profile_refs": ["profile_work"],
  "preferred_brain": "auto",
  "permission_mode": "interactive",
  "budget": {},
  "created_at": "...",
  "updated_at": "..."
}
```

Task 状态机：

```text
draft
  → queued
  → planning
  → running
  → waiting_approval
  → waiting_human
  → waiting_provider
  → paused
  → succeeded
  → failed
  → cancelling
  → cancelled
  → interrupted
```

规则：

- `succeeded/failed/cancelled` 为终态。
- `interrupted` 可创建恢复 Run。
- Task 状态由活动 Run 和 Pending Inbox Item 聚合，但聚合逻辑只在 Core。
- Task 不能从终态返回 running；继续工作创建新 Run。

## 4. Run

Run 是 Task 的一次执行尝试。

字段：

```json
{
  "schema_version": "run.v0",
  "run_id": "run_...",
  "task_id": "task_...",
  "attempt": 1,
  "trigger": {
    "type": "user",
    "ref": null
  },
  "state": "running",
  "brain_thread_ids": ["thread_..."],
  "started_at": "...",
  "finished_at": null,
  "result_summary": null,
  "error": null
}
```

Run 状态：

```text
queued → running
running ↔ waiting_approval
running ↔ waiting_human
running ↔ waiting_provider
running ↔ paused
running → succeeded | failed | cancelling | interrupted
cancelling → cancelled | cancel_failed
```

规则：

- 同一 Task 可有多个 Run。
- 同一 Task 默认最多一个 active Run。
- Automation 可以按 concurrency policy 允许多个 Run。

## 5. Step

Step 是用户可理解的工作阶段。

字段：

```json
{
  "schema_version": "step.v0",
  "step_id": "step_...",
  "run_id": "run_...",
  "sequence": 2,
  "title": "读取竞品价格页面",
  "description": "...",
  "state": "running",
  "provider_hint": "unzoo",
  "depends_on": ["step_..."],
  "retry_policy": {},
  "started_at": "...",
  "finished_at": null
}
```

规则：

- Step 标题必须面向用户。
- ToolCall 不等于 Step；一个 Step 可以有多个 ToolCall。
- 计划变化通过 Step supersede 表达，不覆写历史。

## 6. BrainThread 与 BrainTurn

BrainThread 对应某个 Adapter 的持久上下文。

```json
{
  "schema_version": "brain_thread.v0",
  "thread_id": "thread_...",
  "run_id": "run_...",
  "adapter": "codex_sdk",
  "provider": "openai",
  "model": "gpt-...",
  "external_thread_id": "...",
  "state": "active",
  "snapshot_ref": "artifact_...",
  "usage": {}
}
```

BrainTurn：

```json
{
  "turn_id": "turn_...",
  "thread_id": "thread_...",
  "input_ref": "...",
  "state": "completed",
  "summary": "...",
  "started_at": "...",
  "finished_at": "..."
}
```

规则：

- 原始隐藏推理不进入产品数据库。
- 保存用户消息、模型可见消息、reasoning summary 和工具事件。
- Brain 切换创建新 Thread，可引用前一 Thread 的 Summary/Artifact。

## 7. ToolCall

```json
{
  "schema_version": "tool_call.v0",
  "tool_call_id": "call_...",
  "run_id": "run_...",
  "step_id": "step_...",
  "brain_thread_id": "thread_...",
  "provider_id": "provider_unzoo_local",
  "tool": "browser.navigate",
  "arguments": {},
  "risk": "local_mutation",
  "resource_request": {},
  "state": "requested",
  "idempotency_key": "task_.../step_.../logical-op-1",
  "approval_id": null,
  "grant_id": null,
  "action_id": null
}
```

状态机：

```text
requested
  → policy_checking
  → waiting_approval
  → authorized
  → dispatched
  → executing
  → verifying
  → succeeded
  → failed
  → denied
  → cancelled
  → unknown
```

`unknown` 表示 Provider 连接丢失，无法确认动作是否发生。涉及副作用时不得自动重试，必须先 reconcile。

## 8. Approval

```json
{
  "schema_version": "approval.v0",
  "approval_id": "approval_...",
  "tool_call_id": "call_...",
  "task_id": "task_...",
  "kind": "external_side_effect",
  "title": "发送 Slack 消息？",
  "summary": "...",
  "resource_preview": {},
  "content_preview": {},
  "allowed_decisions": ["allow_once", "allow_for_automation", "deny"],
  "state": "pending",
  "expires_at": "...",
  "resolved_by": null,
  "resolution": null
}
```

状态：

```text
pending → allowed | denied | expired | cancelled
```

规则：

- 只能解决一次。
- 第一响应者胜出。
- `allowed` 不等于已执行。
- Approval 只能授权请求中已展示的具体动作。

## 9. CapabilityGrant

```json
{
  "schema_version": "grant.v0",
  "grant_id": "grant_...",
  "subject": "brain:thread_...",
  "task_id": "task_...",
  "provider_id": "provider_unzoo_local",
  "capabilities": ["browser.read", "browser.act"],
  "resources": {
    "profiles": ["profile_work"],
    "domains": ["github.com"],
    "paths": [],
    "windows": []
  },
  "constraints": {
    "max_calls": 20,
    "external_commit": false
  },
  "issued_from_approval": "approval_...",
  "issued_at": "...",
  "expires_at": "...",
  "revoked_at": null
}
```

规则：

- 默认 Task-scoped。
- Provider 必须独立校验 Grant。
- Grant 不能扩大 Approval 范围。
- Financial/Destructive 不签发长期 Grant。
- Automation Standing Grant 绑定 exact tool + target。

## 10. Provider 与 Action

Provider Manifest：

```json
{
  "schema_version": "provider_manifest.v0",
  "provider_id": "provider_unzoo_local",
  "name": "Unzoo",
  "version": "2.x",
  "protocol_versions": ["provider.v0"],
  "endpoint": {},
  "capabilities": [],
  "health": {},
  "identity": {}
}
```

Action Result：

```json
{
  "schema_version": "action_result.v0",
  "action_id": "action_...",
  "tool_call_id": "call_...",
  "ok": true,
  "state": "verified",
  "error_code": null,
  "retry_hint": null,
  "result": {},
  "evidence": {
    "before": ["artifact_..."],
    "after": ["artifact_..."],
    "diff": {}
  },
  "started_at": "...",
  "finished_at": "..."
}
```

Provider 要求：

- `invoke` 接受 idempotency key。
- `get_action` 可 reconcile。
- `cancel_action` 幂等。
- Event 至少一次投递，Core 去重。

## 11. Artifact

```json
{
  "schema_version": "artifact.v0",
  "artifact_id": "artifact_...",
  "task_id": "task_...",
  "run_id": "run_...",
  "step_id": "step_...",
  "kind": "document",
  "name": "competitive-report.md",
  "uri": "artifact://...",
  "mime_type": "text/markdown",
  "size": 20480,
  "sha256": "...",
  "sensitivity": "internal",
  "created_by": "tool_call:call_...",
  "validation": {
    "state": "passed",
    "checks": []
  },
  "retention": {},
  "created_at": "..."
}
```

规则：

- 数据与元数据分离。
- Artifact URI 不能直接暴露任意文件系统路径。
- 打开时重新校验访问权限。
- Evidence 是 Artifact 的一种。

## 12. Automation

```json
{
  "schema_version": "automation.v0",
  "automation_id": "automation_...",
  "title": "Daily brief",
  "instructions": "...",
  "trigger": {},
  "brain_policy": {},
  "workspace_refs": [],
  "profile_refs": [],
  "standing_grants": [],
  "notification_route": {},
  "budget": {},
  "concurrency_policy": "skip_if_running",
  "misfire_policy": "run_once",
  "enabled": true
}
```

每次触发创建新 Task 或新 Run，取决于产品设置；默认同一 Automation 对应一个长期 Task，每次触发产生独立 Run。

## 13. InboxItem

```json
{
  "schema_version": "inbox_item.v0",
  "inbox_item_id": "inbox_...",
  "task_id": "task_...",
  "run_id": "run_...",
  "kind": "approval",
  "source_ref": "approval_...",
  "state": "pending",
  "attention_route": "default",
  "created_at": "...",
  "resolved_at": null
}
```

规则：

- Approval 本身与 Inbox 展示分离。
- 同一 Approval 只有一个 InboxItem。
- Transport delivery 状态单独记录。
- Transport 不保存另一份 Resolution。

## 14. Memory

```json
{
  "schema_version": "memory.v0",
  "memory_id": "memory_...",
  "type": "preference",
  "scope": "user",
  "content": "...",
  "source_refs": ["task_..."],
  "confidence": 0.9,
  "sensitivity": "private",
  "created_by": "user|brain|system",
  "retention": {},
  "created_at": "...",
  "last_used_at": "..."
}
```

规则：

- Brain 创建永久 Memory 需要 Policy。
- 敏感 Memory 读取产生审计。
- 用户可修改和删除。
- 删除后检索索引同步清理。

## 15. Event Envelope

```json
{
  "schema_version": "event.v0",
  "event_id": "event_...",
  "sequence": 1042,
  "type": "tool_call.succeeded",
  "aggregate_type": "tool_call",
  "aggregate_id": "call_...",
  "task_id": "task_...",
  "run_id": "run_...",
  "actor": {
    "type": "provider",
    "id": "provider_unzoo_local"
  },
  "timestamp": "...",
  "data": {}
}
```

要求：

- Core 为每个 Task 提供单调 sequence。
- Client 通过 `event_id` 去重。
- WebSocket/SSE 断线后可使用 cursor 补事件。
- 大 Payload 使用 Artifact ref。

核心事件：

```text
task.created
task.state_changed
run.started
run.completed
step.created
step.state_changed
brain.message_delta
brain.summary
tool_call.requested
tool_call.authorized
tool_call.dispatched
tool_call.succeeded
tool_call.failed
approval.requested
approval.resolved
provider.state_changed
artifact.created
inbox.created
inbox.resolved
```

## 16. API Surface v0

### Task

```text
POST   /v0/tasks
GET    /v0/tasks
GET    /v0/tasks/{task_id}
POST   /v0/tasks/{task_id}/start
POST   /v0/tasks/{task_id}/pause
POST   /v0/tasks/{task_id}/resume
POST   /v0/tasks/{task_id}/cancel
POST   /v0/tasks/{task_id}/continue
GET    /v0/tasks/{task_id}/events
```

### Approval / Inbox

```text
GET    /v0/inbox
GET    /v0/approvals/{approval_id}
POST   /v0/approvals/{approval_id}/resolve
```

### Artifact

```text
GET    /v0/artifacts
GET    /v0/artifacts/{artifact_id}
GET    /v0/artifacts/{artifact_id}/content
DELETE /v0/artifacts/{artifact_id}
POST   /v0/tasks/{task_id}/export
```

### Integration

```text
GET    /v0/brains
GET    /v0/providers
POST   /v0/providers/{provider_id}/bind
POST   /v0/providers/{provider_id}/test
GET    /v0/connectors
POST   /v0/connectors/{connector_id}/connect
POST   /v0/connectors/{connector_id}/disconnect
```

### Automation

```text
POST   /v0/automations
GET    /v0/automations
GET    /v0/automations/{automation_id}
PATCH  /v0/automations/{automation_id}
DELETE /v0/automations/{automation_id}
POST   /v0/automations/{automation_id}/run
GET    /v0/automations/{automation_id}/runs
```

## 17. 并发与幂等

- 创建对象可接受 `Idempotency-Key` Header。
- ToolCall 的 key 由 Task Engine 生成，不由 Brain 任意生成。
- Provider 保存最近 Action key/result 直到 Task retention 到期。
- Core 收到超时后先 `get_action`，再决定是否重试。
- External/Financial/Destructive 的 unknown 状态必须人工 reconcile。
- Approval resolution 使用 compare-and-set。

## 18. 错误规范

```json
{
  "error": {
    "code": "provider.offline",
    "message": "Unzoo is offline",
    "user_message": "浏览器组件已离线，任务会在连接恢复后继续。",
    "retryable": true,
    "retry_after_ms": 5000,
    "details": {},
    "correlation_id": "..."
  }
}
```

错误 code 稳定，message 可变化。

分类：

```text
validation.*
auth.*
policy.*
approval.*
provider.*
brain.*
task.*
artifact.*
storage.*
internal.*
```

## 19. 契约交付物

下一步生成：

```text
contracts/v0/
  task/
  brain/
  provider/
  security/
  artifact/
  automation/
  events/
```

每个目录包含：

- JSON Schema。
- 示例。
- Invalid fixtures。
- Compatibility tests。
- Changelog。
