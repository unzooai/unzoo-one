# Unzoo One C1 产品设计系统

> 版本：Product UI v0.1
> 依赖：[C1 / Flow One 品牌识别系统](c1-brand-identity-system.md)
> 目的：把品牌语言转化为前端可以直接实现、测试和验收的桌面产品规则。

## 1. 产品设计原则

### 1.1 One Intent

任何时刻，界面都应让用户回答三个问题：

1. 当前目标是什么？
2. One 正在做什么？
3. 下一次需要我介入的是什么？

Provider、Brain、工具调用和系统日志不能取代任务目标成为页面视觉中心。

### 1.2 Evidence Before Spectacle

运行态优先显示：

- 计划。
- 当前动作。
- 证据。
- Artifact。
- 审批边界。

模型逐字输出、虚构思考过程和装饰性动效默认折叠。

### 1.3 Calm by Default

- 空闲状态不持续呼吸或旋转。
- 一屏只保留一个高对比主动作。
- Signal Gradient 可见面积通常低于 4%。
- 卡片主要靠表面层级和边框区分，不给每张卡片投影。
- 高风险操作不使用品牌渐变诱导点击。

### 1.4 Recoverable Work

所有失败状态必须同时说明：

- 已经完成什么。
- 是否产生外部或本地修改。
- 当前是否安全。
- 可以从哪里继续。

## 2. 桌面窗口与信息架构

### 2.1 支持尺寸

| 模式 | 尺寸 |
| --- | --- |
| 最小窗口 | `1024 × 720` |
| 推荐窗口 | `1440 × 900` |
| 大屏基准 | `1728 × 1117` |
| 紧凑侧栏阈值 | `< 1180px` |
| 隐藏 Activity Rail 阈值 | `< 1280px` |

低于最小窗口时，不继续压缩 Task 内容；进入单列 Scroll 模式。

### 2.2 全局框架

```text
┌─────────────────────────────────────────────────────────────┐
│ Window Bar / Global Search / Emergency Stop          48px   │
├──────────────┬───────────────────────────┬──────────────────┤
│ Primary Nav  │ Main Workspace            │ Activity Rail    │
│ 216 / 72px   │ min 720px                 │ 320px optional   │
│              │                           │                  │
└──────────────┴───────────────────────────┴──────────────────┘
```

标准列宽：

- Primary Nav：216px。
- Compact Nav：72px。
- Main Workspace：`minmax(720px, 1fr)`。
- Activity Rail：320px，可扩展到 380px。
- 列分隔线：1px。

### 2.3 全局导航

顺序固定：

1. Home
2. Tasks
3. Inbox
4. Automations
5. Artifacts
6. Integrations
7. Memory
8. Settings

规则：

- 一级导航高度 40px。
- 图标 18px，圆角线性，描边 1.5px。
- 选中项不使用大面积 Signal；使用浅表面 + 2px 左侧 Signal。
- Inbox 数字只显示未处理且需要注意的项目。
- `99+` 为数量上限。
- Settings 固定在底部。

## 3. 设计令牌

### 3.1 四点网格

所有尺寸以 4px 为基本单位。

| Token | 值 |
| --- | --- |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

页面水平 Padding：

- 推荐窗口：32px。
- 大屏：40px。
- 紧凑窗口：24px。
- 单列最小窗口：20px。

### 3.2 表面

| Token | 色值 | 用途 |
| --- | --- | --- |
| `canvas` | `#0B0C0E` | 应用背景 |
| `surface-1` | `#101215` | 导航、Activity Rail |
| `surface-2` | `#15181D` | 卡片、Composer |
| `surface-3` | `#1B1F25` | Hover、展开内容 |
| `surface-float` | `#22262D` | 浮层与命令面板 |
| `border-subtle` | `rgba(255,255,255,.08)` | 默认边框 |
| `border-strong` | `rgba(255,255,255,.15)` | 强分隔和选中 |

### 3.3 文字

| Token | 色值 |
| --- | --- |
| `text-primary` | `#F2F1ED` |
| `text-secondary` | `#B0B1B2` |
| `text-tertiary` | `#767A82` |
| `text-disabled` | `#555D6D` |
| `text-on-signal` | `#FFFFFF` |

### 3.4 品牌与语义

| Token | 色值 | 使用 |
| --- | --- | --- |
| `signal` | `#7C86E8` | 当前智能活动、焦点 |
| `aqua` | `#94BCC6` | 感知与新输入 |
| `cobalt` | `#7C86E8` | 协调与执行 |
| `iris` | `#9C8DB8` | Brain 与生成 |
| `success` | `#64C89B` | 已验证完成 |
| `attention` | `#D8AA62` | 等待用户 |
| `danger` | `#E36F74` | 失败、不可逆、高风险 |
| `info` | `#69A7FF` | 中性说明 |

颜色永远不是唯一状态通道。必须同时使用文字、图标或形状。

### 3.5 双主题

主题是超级工作台能力，提供 `System / Lunar Light / Obsidian Dark` 三种模式。Light 不是 Dark 的自动反色，必须使用同一组语义 Token 分别定义：

| Token | Lunar Light |
| --- | --- |
| `canvas` | `#F3F2EE` |
| `surface-1` | `#EBEAE5` |
| `surface-2` | `#FCFBF8` |
| `surface-3` | `#E5E4DF` |
| `text-primary` | `#202226` |
| `text-secondary` | `#555A62` |
| `text-tertiary` | `#7B8088` |
| `signal` | `#626DD9` |

主题偏好默认为 System，可由用户全局设置。后续允许 Workspace 覆盖，但权限和风险色语义不能随自定义主题改变。

### 3.6 圆角

| Token | 值 | 用途 |
| --- | --- | --- |
| `radius-control` | 10px | 输入框、按钮 |
| `radius-card` | 16px | 普通卡片 |
| `radius-panel` | 22px | Composer、主面板 |
| `radius-dialog` | 24px | Modal、Command Palette |
| `radius-pill` | 999px | 状态和短标签 |

### 3.7 阴影

- 普通卡片：无阴影。
- Composer 聚焦：`0 0 0 1px rgba(107,112,246,.40), 0 20px 70px rgba(0,0,0,.22)`。
- 浮层：`0 24px 80px rgba(0,0,0,.36)`。
- Modal：`0 40px 140px rgba(0,0,0,.52)`。

## 4. 排版

### 4.1 字体角色

| 层级 | 字体 | 用途 |
| --- | --- | --- |
| UI Sans | Geist Variable | 拉丁字母、数字、界面骨架 |
| CJK Sans | Noto Sans SC Variable | 简体中文与中英混排 |
| Mono | JetBrains Mono Variable | 路径、命令、ID、时间、日志 |
| Brand | C1 custom lockup | 品牌字标，不作为 UI 字体 |

三套产品字体随桌面应用打包，使用 `font-display: swap` 和 Unicode Range 按需加载，不依赖操作系统字体。均采用 SIL Open Font License 1.1。

| 角色 | 字号/行高 | 字重 |
| --- | --- | --- |
| Display | 40/48 | 520 |
| Page title | 28/36 | 560 |
| Section title | 18/26 | 560 |
| Card title | 14/20 | 560 |
| Body | 14/21 | 420 |
| Compact body | 12/18 | 440 |
| Label | 11/15 | 600 |
| Micro | 10/14 | 520 |
| Mono | 11/16 | 450 |

### 4.2 文本宽度

- 长正文最大 720px。
- 审批影响说明最大 620px。
- 单行任务标题超过 72 个中文字符或 110 个拉丁字符截断。
- 终端和证据内容不受正文宽度限制，使用独立 Scroll 容器。

## 5. 交互密度

提供两种密度：

| 模式 | 行高 | 控件高度 | 适用 |
| --- | --- | --- | --- |
| Comfortable | 40–44px | 40px | 默认 |
| Compact | 32–36px | 32px | 高级用户、大量任务 |

密度只改变间距和高度，不改变字体到不可读程度。正文不得小于 12px。

## 6. Window Bar

高度 48px，包含：

- 左侧：侧栏切换。
- 中间：Global Search / Command Palette 入口。
- 右侧：同步状态、通知、Emergency Stop、窗口控制。

### 6.1 Emergency Stop

- 默认仅显示 Stop 图标与 Tooltip。
- 有运行任务时显示红色轮廓。
- 点击后弹出轻量确认层，列出将停止的 Task 数量。
- 键盘：`Ctrl/Cmd + Shift + Esc`。
- 触发后 2 秒内显示 Provider 停止结果。
- 不能被普通 Toast 替代。

## 7. Command Composer

### 7.1 三种形态

| 形态 | 高度 | 场景 |
| --- | --- | --- |
| Hero | 168px 最小 | Home 空状态 |
| Active | 64–120px | Task 页面追加要求 |
| Compact | 48px | Command Palette 和快捷创建 |

### 7.2 结构

```text
┌─────────────────────────────────────────────┐
│ Natural language input                     │
│                                             │
├─────────────────────────────────────────────┤
│ Mode · Workspace · Attach · Access   Submit │
└─────────────────────────────────────────────┘
```

底部动作：

- Mode：Ask / Research / Work / Code / Automate。
- Workspace。
- Attach。
- Access Preview。
- Submit。

规则：

- Enter 提交，Shift+Enter 换行。
- IME 组合输入时 Enter 不提交。
- 输入超过 12 行后内部滚动。
- 提交按钮只有一个高对比面。
- 无法连接 Brain 时按钮变为“选择 Brain”，而不是 Disabled。

### 7.3 Access Preview

提交前可展开：

- 本地目录。
- Browser Profile。
- Connector 账户。
- 预计写操作。
- 预算和模型。

Access Preview 是可编辑摘要，不展示底层 Capability JSON。

## 8. Buttons

### 8.1 层级

| 层级 | 用途 |
| --- | --- |
| Primary | 页面唯一主动作 |
| Secondary | 普通操作 |
| Ghost | 工具栏与低权重操作 |
| Attention | 审批与需要注意 |
| Danger | 删除、付款、不可逆 |

### 8.2 尺寸

- Default：36px。
- Compact：30px。
- Large：44px。
- Icon：32px 或 36px。
- 最小点击区域：40 × 40px。

Primary 可以使用 Signal 纯色，不使用大面积渐变。Approval 的批准按钮使用风险语义色。

## 9. Task 组件

### 9.1 Task Header

高度自适应，最小 72px，包含：

- 标题。
- 状态。
- 创建时间与运行时长。
- 模式。
- Workspace。
- Brain 与 Provider 摘要。
- Pause / Resume / Stop。
- More。

标题下只显示影响决策的信息，不显示所有 ID。

### 9.2 Step Row

默认最小高度 56px：

- 状态节点 14px。
- 标题 14px。
- 摘要 12px。
- Provider Badge。
- 时间。
- Evidence 数量。

状态：

| 状态 | 表现 |
| --- | --- |
| Pending | 空心中性节点 |
| Running | Signal 描边 + 单次路径流动 |
| Waiting | Attention 缺口节点 |
| Completed | Success 实心节点 |
| Failed | Danger 菱形 |
| Skipped | 虚线节点 |
| Needs review | Attention 方形节点 |

Running 动画仅作用于节点，不让整行闪烁。

### 9.3 Step Detail

展开后最多四个标签：

- Summary。
- Evidence。
- Changes。
- Raw。

默认打开 Summary。Raw 只有高级模式显示。

### 9.4 Provider Badge

- 高度 22px。
- 图标 12px。
- 名称最长 18 字符。
- 中性底色。
- 健康异常通过小状态点表示。

Provider 不能用整块品牌色占据 Task 行。

## 10. Approval 组件

### 10.1 卡片结构

```text
Risk icon  Action title                          Risk tier
           Object · Target · Scope
           What changes / Can it be undone?
           Requested by · Evidence
           [Reject] [Edit scope] [Approve once]
```

### 10.2 风险等级

| 等级 | 示例 | 默认按钮 |
| --- | --- | --- |
| Review | 本地可撤销修改 | Approve once |
| Attention | 外部发送、发布 | Approve once |
| High | 删除、凭据、付款 | Hold to approve |
| Critical | 批量删除、不可逆财务 | 输入确认短语 |

### 10.3 交互规则

- Reject 与 Approve 的键盘焦点权重相同。
- 不默认勾选长期授权。
- Scope 修改后必须重新计算风险。
- 审批失效显示原因，不静默重新请求。
- High/Critical 不支持快捷键直接批准。
- 批量审批只允许同对象、同动作、同风险策略。

## 11. Artifact 组件

### 11.1 Artifact Card

标准尺寸：

- Grid：最小 240 × 200px。
- List：高度 64px。

内容：

- Preview。
- 文件名或对象名。
- 类型。
- 版本。
- 验证状态。
- 来源 Task。
- 打开、比较、导出。

### 11.2 Artifact Viewer

三列：

- 左：版本与关联 Task，240px。
- 中：Artifact 内容。
- 右：来源、引用、Diff、操作，320px。

用户查看 Artifact 时，聊天记录不占据主视区。

## 12. Activity Rail

宽度 320px，展示用户可理解的关键事件：

- 时间。
- 动作。
- Provider。
- 结果摘要。
- Evidence。

模式：

- Key：默认。
- Detailed：每个 Action。
- Raw：事件 JSON，仅高级模式。

当前事件与 Step 双向定位。写操作展示 Before / After。

## 13. Inbox

### 13.1 分组

- Needs approval。
- Needs input。
- Needs review。
- Failed。
- Completed notifications。

默认只展开前三组。Completed 七天后自动折叠。

### 13.2 Inbox Row

高度 72px，包含：

- 类型图标。
- 一句话请求。
- 影响对象。
- Task。
- 截止时间。
- 主动作。

过期项目不允许继续使用旧 Approval，必须重新请求。

## 14. Automation 组件

### 14.1 Automation Card

显示：

- 名称与状态。
- 下次运行。
- Trigger。
- 最近成功率。
- 最近 Artifact。
- 等待审批数量。

### 14.2 Builder

四段式：

1. Trigger。
2. Goal。
3. Access。
4. Delivery。

高级条件和循环默认折叠。创建前必须运行 Simulation，展示：

- 将访问什么。
- 预计产生什么。
- 哪些情况进入 Inbox。
- 重试是否会重复写入。

## 15. Integrations

统一卡片结构：

- 品牌图标。
- 类型：Brain / Provider / Connector / Skill。
- 账户。
- Health。
- Capability 摘要。
- 最近使用。
- Manage。

连接器安装与授权是两个步骤。安装不等于获得账户访问权。

## 16. Memory

Memory Row 显示：

- 记忆内容摘要。
- 来源。
- 类型：Preference / Fact / Procedure。
- 适用 Scope。
- 最近使用。
- Edit / Forget。

不显示“AI 记住了你”之类拟人文案。用户可以一次性清空某个 Scope。

## 17. Feedback

### 17.1 Toast

- 位置：右下角。
- 宽度：320px。
- 自动消失：普通 5 秒，重要 10 秒。
- 错误和审批不依赖 Toast。
- 同类 Toast 合并。

### 17.2 Banner

用于：

- Provider 降级。
- 离线。
- Safe Mode。
- 更新等待。
- 数据库只读。

Banner 必须包含影响和恢复入口。

### 17.3 Skeleton

只在首次数据获取使用。Task 运行状态使用真实 Step，不使用无限 Skeleton。

## 18. 空状态

每个空状态包含：

- 一句状态说明。
- 一句价值或下一步。
- 一个主动作。
- 最多两个示例。

不使用机器人插画。可以使用低透明度 Flow Line。

示例：

```text
还没有自动化
把重复工作交给 One，并保留每次运行的证据。
[创建自动化]
```

## 19. 键盘与命令

| 快捷键 | 动作 |
| --- | --- |
| `Ctrl/Cmd + K` | Command Palette |
| `Ctrl/Cmd + N` | 新任务 |
| `Ctrl/Cmd + Shift + A` | Inbox |
| `Ctrl/Cmd + .` | Pause 当前 Task |
| `Ctrl/Cmd + Shift + Esc` | Emergency Stop |
| `G then H` | Home |
| `G then T` | Tasks |
| `G then I` | Inbox |
| `/` | 聚焦当前页面搜索 |
| `?` | 快捷键帮助 |

快捷键必须可修改；输入框内不触发 `G then …` 导航。

## 20. 焦点与可访问性

- 焦点环：2px Signal + 2px Canvas 间隔。
- Tab 顺序与视觉顺序一致。
- 所有 Icon Button 有可读 Label。
- 动画遵循 `prefers-reduced-motion`。
- 支持 Windows High Contrast。
- 100%、125%、150%、200% 缩放均可用。
- 中文正文不小于 13px。
- 不能用 Hover 作为唯一信息入口。

## 21. Motion

| 动作 | 时长 |
| --- | --- |
| Hover / Press | 100–120ms |
| 控件状态切换 | 160ms |
| 面板展开 | 220ms |
| 页面进入 | 240ms |
| C1 路径首次绘制 | 900–1200ms |

Waiting Approval 时停止所有运行暗示。Emergency Stop 不等待动画。

## 22. 组件工程契约

每个核心组件至少提供：

- `size`
- `density`
- `state`
- `risk`
- `disabledReason`
- `loading`
- `error`
- `keyboardHint`
- `ariaLabel`
- `testId`

状态必须来自领域模型，不允许前端根据颜色或文案反推。

示例：

```ts
type StepVisualState =
  | "pending"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "skipped"
  | "needs_review";
```

## 23. 设计验收

- 1024px 宽度下关键 Task 操作仍可见。
- Activity Rail 隐藏后可通过 Drawer 打开。
- 一屏最多一个 Primary Button。
- Approval 清楚显示对象、目标、范围和不可逆性。
- Task 失败后能判断是否发生修改。
- 16px C1 标志仍能区分 U 与 1。
- Signal 面积没有掩盖内容层级。
- 所有 Provider 徽标在灰度下可区分名称。
- 键盘可完成新建任务、查看 Inbox、拒绝审批和停止任务。
