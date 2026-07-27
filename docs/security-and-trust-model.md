# Unzoo One 安全与信任模型

> 状态：Draft
> 日期：2026-07-26
> 原则：Agent 可以提出动作，但不能给自己授权

## 1. 安全目标

1. 一个 Brain 被 Prompt Injection 影响后，仍不能越过用户授权范围。
2. 一个本地低权限进程不能默认控制 Unterm 或 Unzoo。
3. 一个 Provider 被攻破后，不能访问其他 Provider 的凭证。
4. 重试、断线和恢复不能重复产生外部副作用。
5. 日志、Prompt、截图和 Artifact 不泄露凭证。
6. 用户可以随时查看、撤销和停止。
7. 高风险动作的授权内容与最终执行内容一致。

## 2. 非目标

- 不承诺抵御已获得用户系统管理员权限的恶意软件。
- 不绕过操作系统 Secure Desktop、UAC、DRM 或受保护内容。
- 不把模型输出视为可信代码或可信策略。
- 不声称所有 Connector 第三方服务本身安全。

## 3. 资产

高价值资产：

- API Key、OAuth Token、Cookie、Password。
- Browser Profile 和登录态。
- 用户文件和代码仓库。
- Terminal/PTY 控制。
- 桌面输入控制。
- 邮件、日历、消息和 CRM。
- Task、Memory、Artifact 和 Audit。
- Software Update signing key。

## 4. 参与者

| Actor | 信任级别 |
|---|---|
| Local user | 最终授权者 |
| Unzoo One Desktop | 受信 UI Client，不是策略权威 |
| Unterm Core | 控制平面和策略权威 |
| Brain Adapter | 不可信建议者 |
| Brain/Model | 不可信内容处理器 |
| Unzoo Provider | 受限执行器 |
| Connector Provider | 受限执行器 |
| Skill/Persona | 不可信扩展声明 |
| Local process | 默认不可信 |
| Web content | 不可信数据 |
| Remote service | 外部信任边界 |

## 5. 信任边界

```text
User
  │
  ▼
Unzoo One Desktop
  │ authenticated client
  ▼
Unterm Core / Policy Engine
  │ capability grant
  ├──────── Brain Adapter ─────── Cloud/Local Model
  │
  ├──────── Unzoo Provider ───── Browser/Desktop
  │
  └──────── Connector Runtime ── SaaS/Messaging
```

规则：

- UI 不能直接调用 Provider 绕过 Core。
- Brain 不能直接调用 Provider。
- Provider 不接受没有 Grant 的 Mutation。
- Secret 由 Vault 注入 Provider，不进入 Brain context。

## 6. 威胁模型

## 6.1 Prompt Injection

来源：

- 网页。
- 邮件。
- 文档。
- Issue/PR。
- Tool output。
- Connector message。

控制：

- 外部内容标记为 untrusted。
- Prompt 中明确区分 user instruction 与 retrieved data。
- 权限由 Policy Engine 决定，不由模型判断。
- Credential、External、Financial、Destructive 每次重新判断。
- Tool 参数进行 schema validation。
- 域名、路径、账户和窗口进行 scope 校验。

## 6.2 Confused Deputy

场景：

Brain 合法拥有读取 GitHub 权限，却试图借 Connector 向外发送读取到的秘密。

控制：

- Grant 同时限制 capability 和 destination。
- Data sensitivity 参与外发决策。
- 跨边界数据流需要 Data Egress Policy。
- Secret 和 high-sensitivity Artifact 默认不能发送。

## 6.3 本地未授权调用

场景：

本地进程访问 localhost REST/MCP。

控制：

- localhost 默认认证。
- 每个 Client 独立 Identity。
- 短期 Access Token。
- OS 用户权限限制 endpoint/token 文件。
- 支持 revoke 和 rotation。
- Origin/CORS 不能代替认证。

## 6.4 重放与重复副作用

控制：

- Idempotency Key。
- Nonce/expiry。
- Provider Action reconciliation。
- Approval 与具体 ToolCall hash 绑定。
- 重试前查询 Action 状态。

## 6.5 Approval TOCTOU

场景：

用户批准后参数被修改，或窗口/页面已经变化。

控制：

- Approval 保存 canonical request hash。
- Grant 绑定 request/resource。
- Provider 执行前验证 hash。
- Browser/Desktop 使用 frame_id 和 foreground window。
- 参数变化重新审批。

## 6.6 凭证泄露

控制：

- OS Keychain/Credential Manager。
- Secret reference 而非 secret value。
- 日志字段级脱敏。
- Browser type 默认把文本标记为敏感。
- Crash dump 和 support bundle 二次扫描。
- Clipboard Secret 有短 TTL。

## 6.7 Skill/Connector 供应链

控制：

- Manifest 签名和来源。
- 安装前权限摘要。
- 新安装默认 disabled。
- 版本锁定。
- 包哈希。
- 自动更新不自动扩大权限。
- Native plugin 与 MCP Server 隔离。

## 6.8 软件更新

控制：

- 签名更新清单。
- TLS。
- 包哈希验证。
- 分阶段 rollout。
- 自动回滚。
- Core/Provider 协议兼容检查。
- 禁止降级到已撤销版本。

## 7. 风险分类

| Risk | 例子 | 默认 |
|---|---|---|
| `read` | 读取公开网页 | 自动 |
| `local_mutation` | 写工作区文件 | 首次/范围审批 |
| `exec` | 运行测试 | 精确命令审批或安全规则 |
| `external_side_effect` | 发消息、提交表单 | 提交前审批 |
| `credential_access` | 读取 Cookie/Token | 每次明确审批 |
| `financial` | 购买、支付 | 每次二次确认 |
| `destructive` | 删除、覆盖、撤销 | 每次二次确认 |

工具必须声明：

```text
risk
side_effect
resource_scopes
sensitive_inputs
reversible
approval_mode
evidence_policy
```

未声明：

- Read 工具不能自行假定 Read。
- 第三方工具默认 `external_side_effect`。
- 用户可降低风险前必须看到明确警告。

## 8. Policy 决策流程

```text
Tool requested
  → Validate schema
  → Resolve declared risk
  → Resolve requested resources
  → Apply hard deny rules
  → Find matching active Grant
  → Apply task/user policy
  → Allow / Deny / Ask
  → If Ask, create Approval + InboxItem
  → On allow, issue least-privilege Grant
  → Provider validates Grant
  → Execute + verify + audit
```

Hard deny 优先于任何 Allow：

- Secure Desktop。
- Blocked path/domain/account。
- Revoked Client。
- Expired Grant。
- Invalid signature。
- Unknown destructive tool。

## 9. 权限模式

### Ask

- Read-only。
- 不允许 Mutation。

### Plan

- Read-only。
- 可以生成 Plan 和 Access Preview。
- Plan approval 后切换到其他 Mode。

### Interactive

- Read 自动。
- Mutation 按风险审批。

### Scoped Auto

- 只在显式 Grant scope 内自动。
- 超范围进入审批。
- 不等于全局 Auto。

### Custom

- 用户自定义规则。
- 必须能预览和测试决策。

不提供无边界 Full Auto 作为默认产品入口。开发设置可以开启，但持续显示警告。

## 10. Capability Scope

### Files

- Root。
- Read/write。
- Glob。
- Max bytes。
- Symlink policy。

路径校验：

- Canonicalize。
- 防目录穿越。
- 防符号链接逃逸。
- 写入前复查。

### Terminal

- Exact argv。
- Working directory。
- Environment allowlist。
- Timeout。
- Network access。
- Elevation。

禁止把 Shell command 当普通字符串前缀授权。

### Browser

- Profile。
- Domain/origin。
- Tab。
- Read/act/download/upload。
- Cookie access。

### Desktop

- Application。
- Process。
- Window。
- Display。
- Input types。
- Frame ID。

### Connector

- Account。
- Organization/workspace。
- Object type。
- Read/write。
- Exact target。

## 11. Approval 绑定

Approval canonical payload：

```text
tool
arguments hash
risk
resources
content preview hash
task/run/step
expires_at
```

UI 展示内容必须由 canonical payload 生成，不能使用 Brain 自己写的描述替代真实参数。

Resolution：

- `allow_once`
- `allow_for_task`
- `allow_exact_for_automation`
- `deny`

Financial/Destructive/Credential 不支持长期 Allow。

## 12. Data Egress Policy

数据级别：

| Level | 含义 |
|---|---|
| Public | 可公开 |
| Internal | 默认不向外发送 |
| Private | 个人敏感 |
| Secret | 凭证和密钥 |

规则：

- Secret 永不进入 Brain Prompt。
- Private 发送到云模型时显示 Provider。
- Internal/Private 发送到外部 Connector 需要目标审批。
- Browser upload 显示文件名、类型、大小和目标域名。
- 截图可能包含敏感信息，默认 Private。

## 13. Secret Vault

Secret 类型：

- Model API Key。
- OAuth Token。
- Connector Token。
- Proxy Secret。
- Browser Profile key。
- Client credential。

存储：

- Windows Credential Manager。
- macOS Keychain。
- Linux Secret Service。

数据库只保存 Secret Ref：

```text
secret://connector/slack/workspace-1
```

Provider 请求 Secret：

- 通过受认证 IPC。
- 只对指定 operation。
- 不返回给 UI/Brain。
- 使用后清除内存 buffer（尽力）。

## 14. Browser 安全

- Profile 由用户显式选择。
- Work/Personal Profile 不自动混用。
- Cookie 工具属于 credential access。
- 下载限制到批准目录。
- 上传需要展示目标域和文件。
- 页面 Prompt Injection 不改变 Policy。
- Before/after evidence 脱敏密码字段。

## 15. Desktop 安全

- 默认不开启 Computer Input。
- 开启时必须有 foreground window lease。
- 使用 frame_id 防过期坐标。
- 用户输入立即暂停。
- 密码框不回传文本。
- Secure Desktop 拒绝。
- 多显示器坐标包含 display_id。
- Emergency stop 释放所有按键。

## 16. Audit

必须记录：

- Identity。
- Task/Run/Step。
- Tool/Provider。
- Policy decision。
- Approval/Grant。
- Requested resource。
- Execution and verification。
- Error/cancel/reconcile。

不能记录：

- 完整 Secret。
- 密码框文本。
- 完整 Cookie。
- 未经用户允许的私人正文。

完整性：

- Append-only logical event。
- Hash-chain。
- 定期 checkpoint。
- 导出时附 manifest 和 hash。

## 17. 数据保留

默认建议：

| 数据 | 默认 |
|---|---|
| Task metadata | 保留 |
| Transcript | 90 天 |
| Audit | 180 天 |
| Screenshot evidence | 30 天 |
| Downloads | 用户控制 |
| Crash logs | 14 天 |
| Secrets | 直到断开 |

用户可修改，受法律/企业策略约束时显示原因。

## 18. 安全事件模式

### Safe Mode

触发：

- Audit 写入失败。
- Policy 数据损坏。
- Client Identity 异常。
- Provider 版本被撤销。

行为：

- Read-only。
- 停止新 Mutation。
- 保留查看和导出能力。

### Lockdown

用户主动触发：

- 撤销全部临时 Grant。
- 中断全部 Task。
- 停止 Provider。
- 清理 Clipboard Secret。
- 要求重新认证。

## 19. 发布安全门槛

Private Alpha：

- [ ] #16 PTY 旁路修复。
- [ ] Localhost 强制认证。
- [ ] Grant TTL/revoke。
- [ ] Secret 脱敏测试。
- [ ] Idempotency 测试。
- [ ] Prompt Injection 越权测试。

Computer Use Preview：

- [ ] Foreground lease。
- [ ] Stale frame。
- [ ] User interrupt。
- [ ] Secure Desktop deny。
- [ ] Password redaction。

GA：

- [ ] 威胁模型评审。
- [ ] Update signing。
- [ ] Dependency scanning。
- [ ] 安全响应流程。
- [ ] 数据删除验证。
- [ ] 第三方渗透测试。
