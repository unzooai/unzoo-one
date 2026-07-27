# ADR-0001：桌面 UI 技术栈与运行时边界

> 状态：Accepted
> 日期：2026-07-27

## 决策

Unzoo One 桌面界面采用：

- React + TypeScript：产品界面和交互状态；
- Vite：开发服务器、生产构建与静态资源管线；
- Tauri 2：正式桌面发行壳，但在 UI/协议验证阶段延后接入；
- `OneClient`：UI 与本地 Supervisor 之间唯一的应用层接口；
- C1 Token：视觉层唯一设计令牌来源。

代码位于 `apps/desktop-ui`。UI 不直接调用 Unterm CLI、Unzoo MCP、模型 SDK 或本地数据库。

## 原因

1. 产品的 Task、Approval、Artifact 与 Provider 契约仍在冻结过程中，先隔离接口可避免桌面视图绑定某个暂时实现。
2. 浏览器内运行可更快验证信息架构、密度、响应式和交互状态。
3. React + TypeScript 适合实现长生命周期任务、流式事件和复杂审批状态。
4. Vite 与 Tauri 2 的 SPA 集成路径直接，后续不需要重写 UI。
5. Unzoo One 的常驻执行责任属于 Headless Core，不属于 WebView 或窗口生命周期。

## 运行时边界

```text
React UI
  ↓ OneClient
Tauri command / local IPC adapter
  ↓ versioned contracts
Unterm Headless Core / One Supervisor
  ├─ Brain adapters
  ├─ Unzoo Browser provider
  ├─ Unterm execution provider
  └─ Audit / Artifact / Policy stores
```

当前 `mockOneClient` 只用于产品原型。真实接入时替换 adapter，不改页面组件。

## 不在本决策中的内容

- 不决定 Supervisor 的最终进程模型；
- 不决定 IPC 使用 Tauri command、WebSocket 还是本地 gRPC；
- 不允许 UI 成为 Task 状态的事实来源；
- 不在 UI 中保存 Provider 凭证。

## 进入 Tauri 阶段的门槛

- `contracts/v0` 的 Task、Event、Approval、Artifact schema 可验证；
- Headless Core 可返回 snapshot 并持续推送 event；
- Pause、Resume、Cancel 和 Approval 已具备幂等语义；
- UI 原型的 Task Detail、Inbox 与 Artifact 主路径通过可用性验证。
