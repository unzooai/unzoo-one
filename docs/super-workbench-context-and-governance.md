# Unzoo One 超级工作台：Context、角色与执行治理

> 状态：Current product direction
> 日期：2026-07-27

## 1. 产品定义

Unzoo One 是 AI 驱动的超级工作台，不是一个附带工具的聊天机器人。

工作台的一级对象是：

1. Workspace：工作边界；
2. Task / Run：目标与执行；
3. Inbox：需要人的决策；
4. Artifact：可交付成果；
5. Automation：可持续运行的流程；
6. Provider：经过治理的执行能力。

对话只是向工作台下达目标和修订计划的一种方式。

## 2. Workspace Context

Workspace 不能只等同于工作目录。它必须同时绑定：

```text
Workspace
├─ filesystem roots
├─ Unzoo browser profiles
├─ connectors and accounts
├─ memory namespace
├─ artifacts and audit history
├─ environment variables and secrets references
├─ trust level
├─ default human access policy
└─ default One work role
```

### 2.1 最低字段

```json
{
  "workspace_id": "workspace_unzoo_one",
  "name": "unzoo-one",
  "filesystem_roots": ["D:\\code\\unzoo-one"],
  "browser_profile_refs": ["profile_work"],
  "memory_namespace": "workspace_unzoo_one",
  "trust": "trusted",
  "owner_id": "user_alex",
  "default_work_role": "build",
  "execution_policy_ref": "policy_governed_local"
}
```

### 2.2 工作目录规则

- 每个 Work / Build / Operate Task 必须有显式 Workspace。
- Task 可引用 Workspace 下一个或多个目录，但不能默认获得父目录权限。
- 空 Workspace 可以执行 Ask，但不能执行文件修改、命令或浏览器登录动作。
- 新目录默认为 Restricted，用户确认后才进入 Trusted。
- Artifact 的来源 Workspace 不可丢失。

VS Code 的 Workspace Trust 证明了“打开目录”和“允许执行代码”必须分离；Unzoo One 应把相同原则扩展到 AI、终端和浏览器 Provider。

## 3. 两套角色，严格分离

### 3.1 Human Access Role

决定谁可以授权和管理：

| 角色 | 能力 |
| --- | --- |
| Owner | 管理 Workspace、凭证、策略、成员和高风险授权 |
| Admin | 管理 Task、Automation、Provider 和普通成员 |
| Member | 创建任务，使用已授权能力 |
| Reviewer | 查看并处理指定 Approval |
| Viewer | 只读 Task、Artifact 与 Audit |

Personal Alpha 只有 Owner，但数据模型从第一天保留 `principal_id` 和 `role`。

### 3.2 One Work Role

决定 AI 如何组织工作，不授予额外权限：

| 工作角色 | 默认行为 |
| --- | --- |
| Research | 多来源检索、引用、证据优先 |
| Build | 修改代码与文件、运行验证、形成可交付结果 |
| Operate | 操作系统和业务工具、强调副作用与确认 |
| Coordinate | 拆分任务、调度 Brain/Provider、汇总进度 |

Work Role 是可见、可切换的执行预设。切换角色不会提升 Workspace 权限，也不会绕过 Approval。

## 4. 强制执行路由

### 4.1 唯一路由

```text
Codex / Claude / Other Brain
            │ capability request
            ▼
One Supervisor
  ├─ Context Resolver
  ├─ Policy Engine
  ├─ Provider Router
  └─ Audit / Evidence
       ├─ terminal.*  → Unterm only
       └─ browser.*   → Unzoo only
```

### 4.2 禁止路径

- Brain 直接创建本地 shell；
- Brain 直接启动系统浏览器；
- 安装或调用 Playwright、Puppeteer、Selenium、WebDriverIO；
- 直接连接 Chrome CDP 绕过 Unzoo；
- Provider 在没有 Workspace Lease 时执行 mutation；
- 通过脚本间接启动上述禁用运行时。

### 4.3 Playwright 兼容处理

当 Skill、代码样例或 Brain 提出 Playwright 操作时：

1. 解析为抽象 Browser Intent；
2. 映射到 Unzoo Browser capability；
3. 重新进行 Workspace、Profile、Risk 和 Approval 检查；
4. 无等价能力时返回稳定错误 `provider_capability_missing`；
5. 不允许自动安装 Playwright 作为 fallback。

约束必须同时存在于：

- Agent instruction；
- Tool allowlist；
- Package/process denylist；
- Supervisor Provider Router；
- Workspace Policy；
- Audit 检测与告警。

Prompt 规则只能改善模型行为，不能作为安全边界。

## 5. 超级工作台视觉参考

不是复制某个产品，而是组合成熟工作习惯：

- Notion：安静内容层、清晰 Workspace、浅色阅读体验；
- Linear：高密度任务、状态与快速操作；
- Raycast：Command-first、键盘优先、紧凑/展开密度；
- VS Code：Workspace Trust、目录边界与长时工作主题。

### 5.1 双主题

必须提供：

- System；
- Lunar Light；
- Obsidian Dark；
- 后续支持 High Contrast。

双主题共用语义 Token，禁止用简单反色生成。品牌色只用于：

- 当前焦点；
- 运行进度；
- 选中状态；
- One 的实时活动；
- 少量品牌标记。

大面积内容、Artifact 和长文本以中性色为主。风险色只表达风险，不能承担品牌装饰。

## 6. 界面呈现

全局侧栏顶部固定显示 Workspace Switcher：

- 名称；
- 主工作目录；
- Trust 状态；
- 浏览器/终端/连接器健康；
- 当前 Human Access Role。

Composer 显示：

- One Work Role；
- Brain；
- Permission Mode；
- 当前 Workspace；
- 提交动作。

Task Header 必须显示 Workspace 与 Work Role，防止使用者不知道 AI 正在哪个上下文工作。
