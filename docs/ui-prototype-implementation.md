# C1 桌面 UI 原型实现说明

> 状态：可运行原型
> 日期：2026-07-27

## 已实现

`apps/desktop-ui` 已把 C1 产品设计系统落为可运行界面：

- 窗口顶栏、主导航、工作区与可收起 Activity Rail；
- Home、Task Detail、Inbox、Automations、Artifacts、Integrations 入口；
- Task 状态、执行进度、Provider 标识与四阶段 Step Timeline；
- 高风险外部操作的批准、拒绝和撤销状态；
- 暂停/继续任务；
- Live Artifact；
- 支持提交状态反馈的 Composer；
- 860px 紧凑导航与 650px 移动/窄窗口布局；
- `prefers-reduced-motion`；
- `OneClient` 领域适配层与 mock snapshot。
- 一级 Workspace Switcher 与显式工作目录；
- Human Access Role 与 One Work Role 分离；
- Research / Build / Operate / Coordinate 工作角色；
- System / Lunar Light / Obsidian Dark 双主题；
- Geist + Noto Sans SC + JetBrains Mono 可变字体系统；
- Governed 状态与 Unterm/Unzoo 强制执行策略入口。

## 本地运行

```powershell
cd apps/desktop-ui
npm install
npm run dev
```

质量检查：

```powershell
npm run lint
npm run build
```

## 目录

```text
apps/desktop-ui/
  public/brand/             C1 运行时品牌资产
  src/
    adapters/               OneClient 的环境实现
    domain/                 UI 消费的稳定领域契约
    App.tsx                 当前交互原型
    App.css                 产品布局与组件样式
    index.css               C1 全局 Token
```

## 从原型到产品的 Backlog

### P0：接入真实运行时

- 从 JSON Schema 生成 `domain` 类型，删除手写重复定义；
- 实现 Tauri/local IPC `OneClient`；
- Snapshot + Event Stream 合并器；
- Task Pause/Resume/Cancel 幂等命令；
- Approval 详情、内容预览与权限范围；
- Artifact 打开、导出、版本和来源证据；
- Provider 离线、重连、未知结果与 reconcile 状态。

### P0：补全 Private Alpha 页面

- First-run 与 Unterm/Unzoo 自检；
- Inbox 列表与批量处理；
- Automation Builder 与运行历史；
- Integrations 授权、Scope 和健康状态；
- Settings、Diagnostics 与审计导出；
- 全局 Command Palette；
- 完整键盘导航和屏幕阅读器复核。

### P1：组件工程化

- 将 App 中组件拆到 `components/` 和 `features/`；
- 建立独立 Component Lab；
- 视觉回归测试；
- 单元测试、交互测试和契约测试；
- 中英文文案资源与本地化；
- 浅色主题可行性验证。

## 验收边界

本原型验证产品结构、品牌气质和关键交互，不代表：

- 已连接真实 Unterm/Unzoo；
- 审批已产生安全授权；
- Task 状态可持久化或恢复；
- 已满足桌面发布、安全签名或自动更新要求。
