# Unzoo One Connector、MCP、Skill 与 Persona 规范

> 状态：Draft
> 日期：2026-07-26

## 1. 概念边界

| 类型 | 定义 | 示例 |
|---|---|---|
| Brain | 推理和规划运行时 | Codex、Claude |
| Provider | 本机执行能力服务 | Unterm、Unzoo |
| Connector | 外部账户和 SaaS 能力 | GitHub、Slack、Gmail |
| MCP Server | 标准协议扩展 | 任意第三方 MCP |
| Skill | 专用知识和工作流说明 | PR Review、周报 |
| Persona | 一组身份、Skill、工具和默认策略 | Developer、Ops |
| Automation | 有 Trigger 的长期任务 | Daily brief |

这些对象不能在 UI 中统称“插件”，否则用户无法理解权限差异。

## 2. Connector Runtime 目标

统一处理：

- Descriptor。
- OAuth / Token / App Password。
- Account discovery。
- Tool registration。
- Risk metadata。
- Health check。
- Webhook/Polling。
- Rate limit。
- Retry。
- Audit。
- Disconnect/revoke。

Connector 业务逻辑只实现服务特有部分。

## 3. Connector Descriptor

```yaml
schema_version: connector.v0
id: slack
name: Slack
publisher: unzooai
auth:
  methods:
    - managed_oauth
    - manual_oauth
capabilities:
  - messages.read
  - messages.send
  - files.upload
accounts:
  kind: workspace
inbound:
  supported: true
  transport: websocket
health:
  test_tool: auth.test
risk_summary:
  - read
  - external_side_effect
links:
  privacy: ...
  docs: ...
```

Descriptor 不能包含 Secret。

## 4. Connector Tool

每个 Tool 声明：

```yaml
name: slack.send_message
description: Send a message to a Slack channel
risk: external_side_effect
side_effect: send_message
target_arg: channel_id
account_scope: workspace_id
idempotency: supported
reversible: false
sensitive_inputs:
  - text
evidence:
  - remote_message_id
  - permalink
```

要求：

- Tool name 全局稳定。
- 参数 JSON Schema 严格。
- Read/Write 分开。
- Batch 工具不能掩盖子动作风险。
- 返回远端 object ID。

## 5. Authentication

支持：

### Managed OAuth

- Unzoo One Cloud 只代理 OAuth handshake。
- Token 最终保存在本地 Vault。
- Cloud 不长期保存 Access Token。

### Manual OAuth

- 用户自己的 Client ID/Secret。
- 本地 callback。

### API Token

- 用户粘贴 Token。
- 立即写 Vault。
- UI 后续只显示 masked。

### App Password

- IMAP/SMTP。
- 明确提示不是账户主密码。

### Browser Session

- 只对无法提供 API 的服务。
- 绑定具体 Unzoo Profile。
- 权限按域名和动作限制。

## 6. Account Model

同一 Connector 可有多个 Account：

```text
connector: github
  account: personal
  account: work

connector: slack
  workspace: company-a
  workspace: community
```

ToolCall 必须解析到唯一 Account；模糊时请求用户选择，不使用最近账户猜测高风险动作。

## 7. Health

状态：

```text
disconnected
connecting
connected
degraded
reauth_required
rate_limited
paused
error
```

Health 包含：

- Last success。
- Last error。
- Token expiry。
- Rate limit。
- Webhook/listener status。

Connector 离线不能让整个 Core 离线。

## 8. Inbound Messaging

消息入口支持：

- 创建 Task。
- 继续已有 Task。
- 回答 Question。
- 解决 Approval。
- 接收 Result/Artifact。

安全规则：

- Sender allowlist。
- Approval Owner。
- Thread/Conversation mapping。
- 伪造回复防护。
- Attachments 扫描和大小限制。
- Inbound 文本标记为 untrusted。

统一地址：

```text
slack:workspace/channel
telegram:bot/chat
feishu:tenant/chat
wecom:corp/chat
```

## 9. Approval Transport

Transport 只传递 Inbox Item：

- 不自行决定权限。
- Resolution 回 Core compare-and-set。
- 卡片携带 short-lived signed action token。
- 超时后按钮失效。
- 已解决卡片显示最终结果。

## 10. MCP Import

MCP Server 来源：

- Local command。
- Streamable HTTP。
- Marketplace manifest。
- Project config。

导入流程：

1. 解析 Server。
2. 沙箱中 `tools/list`。
3. 展示 Tool 和风险。
4. 用户设置默认风险或逐工具配置。
5. 生成 Client Identity。
6. Test。
7. Disabled → Enabled。

默认：

- 第三方 MCP Mutation 按 external 风险。
- OAuth 只在用户主动连接时打开浏览器。
- 后台任务不能触发新的交互 OAuth。

## 11. Connector 覆盖策略

### Tier 0：系统能力

- Unterm。
- Unzoo。
- Files。
- Local Artifact。

### Tier 1：V1 原生

- GitHub。
- Slack。
- Gmail。
- Outlook。
- IMAP/SMTP。
- Google Calendar。
- Outlook Calendar。
- Notion。
- Google Drive。
- Dropbox。
- Telegram。

### Tier 1 中国生态

- 飞书。
- 企业微信。
- 钉钉。

微信个人号：

- 仅在合法、稳定、明确授权的能力边界内评估。
- 不承诺绕过平台限制。
- 优先官方 API、企业微信或用户可见接管。

### Tier 2

- Jira、Linear、GitLab、Confluence。
- HubSpot、Salesforce、Attio。
- Stripe、QuickBooks。
- Figma、Canva。
- Datadog、PagerDuty。

### Tier 3

- 通过 MCP 优先覆盖长尾。
- 使用量达到阈值后升级原生 Connector。

## 12. Connector 产品验收

每个原生 Connector 必须：

- [ ] 完成连接和断开。
- [ ] 支持多账户。
- [ ] 有 health test。
- [ ] Read/Write 风险正确。
- [ ] Secret 不进入日志。
- [ ] 429 有 backoff。
- [ ] 401 进入 reauth_required。
- [ ] Write 有 idempotency 或 reconcile。
- [ ] 有 hermetic E2E。
- [ ] 有 live smoke test。
- [ ] 有权限最小化文档。

## 13. Skill

Skill 是说明和工作流，不是权限。

Manifest：

```yaml
schema_version: skill.v0
id: weekly-product-report
name: Weekly Product Report
publisher: unzooai
version: 1.0.0
instructions: SKILL.md
requires:
  capabilities:
    - files.read
    - artifact.write
  connectors:
    - github
optional:
  connectors:
    - slack
recommended_mode: interactive
```

Skill 不得：

- 内嵌 Secret。
- 自行扩大 Grant。
- 隐藏 Tool 风险。
- 静默安装其他 Skill。

## 14. Persona

Persona 组合：

- Name/role。
- System behavior。
- Skills。
- Capabilities。
- Connector。
- Brain policy。
- Default mode。
- Inbox route。

内置 Persona：

- General Coworker。
- Developer。
- Researcher。
- Content Operator。
- Ops Assistant。

安装/启用前展示权限摘要。

## 15. Marketplace

对象：

- Skill。
- Persona。
- MCP Server。
- Connector package。
- Automation template。

信任标识：

- Built-in。
- Verified publisher。
- Community。
- Local unsigned。

详情页：

- Publisher。
- Source。
- Version。
- Last update。
- Permissions。
- Data destinations。
- Risk。
- Reviews/usage（后期）。

安装不等于启用；启用不等于授权。

## 16. Package Security

- Manifest hash。
- Package signature。
- Locked dependencies。
- No post-install arbitrary code 默认。
- Native code 需要额外警告。
- Network domains 声明。
- Filesystem scopes 声明。
- Update permission diff。

如果更新扩大权限：

- 暂停扩展。
- 展示 diff。
- 用户重新同意。

## 17. Developer SDK

目标语言：

- TypeScript。
- Python。
- Rust（Provider）。

SDK 提供：

- Descriptor types。
- Tool schema。
- Risk helpers。
- Auth adapters。
- Health helpers。
- Idempotency helpers。
- Test harness。
- Mock Core。

CLI：

```text
unzoo-one dev init connector
unzoo-one dev validate
unzoo-one dev test
unzoo-one dev pack
unzoo-one dev sign
```

## 18. Connector 测试场景

### Read

- List。
- Search。
- Pagination。
- Empty。
- Rate limit。

### Write

- Approval。
- Exact target。
- Idempotency。
- Timeout then reconcile。
- Remote validation error。

### Auth

- Success。
- Expired。
- Revoked。
- Wrong account。
- Multi-account ambiguity。

### Inbound

- Allowed sender。
- Unknown sender。
- Duplicate event。
- Out-of-order event。
- Approval resolution race。

## 19. Skill/Persona 测试

- Manifest validation。
- Missing capability。
- Permission summary。
- Disabled by default。
- Prompt Injection corpus。
- Version update permission diff。
- Uninstall and data cleanup。

## 20. V1 完成定义

- 任意 MCP Server 可安全导入。
- 至少 10 个原生 Connector 达到验收标准。
- 至少 3 个中国生态入口可用。
- Approval Inbox 支持至少 2 个远程 Transport。
- Skill/Persona 安装前权限可见。
- Marketplace 更新不能静默扩大权限。
