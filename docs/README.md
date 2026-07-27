# Unzoo One 产品文档索引

> 本目录是 Unzoo One 当前产品定义的事实来源。发生冲突时，领域契约与安全规范优先于页面文案；已批准的 ADR 将优先于早期探索结论。

## 推荐阅读顺序

### 快速理解产品

1. [整体产品架构与能力审计](product-architecture.md)
2. [OpenWorker 参考分析与能力覆盖策略](openworker-reference-analysis.md)
3. [MVP 产品规格](mvp-product-spec.md)
4. [产品体验与页面规格](product-experience-spec.md)
5. [品牌家族与 UI 系统](brand-and-ui-system.md)

### 开始工程实现

1. [核心领域模型与协议契约](domain-model-and-contracts.md)
2. [安全与信任模型](security-and-trust-model.md)
3. [Connector、Skill 与生态规范](connectors-skills-and-ecosystem.md)
4. [分发、数据与运行保障](distribution-data-and-operations.md)
5. [交付路线图与开发 Backlog](delivery-roadmap.md)
6. [桌面 UI 技术栈 ADR](adr/0001-desktop-ui-stack.md)
7. [C1 桌面 UI 原型实现说明](ui-prototype-implementation.md)
8. [超级工作台 Context、角色与执行治理](super-workbench-context-and-governance.md)

### 验证产品是否成立

1. [产品指标与验证计划](product-metrics-and-validation.md)
2. [MVP 产品规格](mvp-product-spec.md)
3. [产品体验与页面规格](product-experience-spec.md)

## 文档地图

| 文档 | 回答的问题 | 状态 |
| --- | --- | --- |
| [product-architecture.md](product-architecture.md) | One、Unterm、Unzoo 和 Brain 如何分工，当前缺什么 | 草案 |
| [openworker-reference-analysis.md](openworker-reference-analysis.md) | 向 OpenWorker 学什么，如何覆盖并超越 | 草案 |
| [mvp-product-spec.md](mvp-product-spec.md) | Private Alpha 首版给谁用、解决什么、做哪些功能 | 草案 |
| [product-experience-spec.md](product-experience-spec.md) | 页面、交互、审批、异常和恢复如何表现 | 草案 |
| [brand-and-ui-system.md](brand-and-ui-system.md) | Unzoo 家族标志、One UI 和 Browser 换标如何统一 | 方向提案 v1 |
| [c1-brand-identity-system.md](c1-brand-identity-system.md) | C1 Flow One 的完整标志、色彩、字体、动效和应用规则 | 当前品牌方向 |
| [c1-product-design-system.md](c1-product-design-system.md) | C1 桌面产品布局、Token、组件、键盘和可访问性规则 | 当前产品 UI 规格 |
| [key-screen-blueprints.md](key-screen-blueprints.md) | Onboarding、Home、Task、Inbox、Automation 等页面状态蓝图 | 当前页面规格 |
| [domain-model-and-contracts.md](domain-model-and-contracts.md) | Task、Run、Action、Grant、Artifact 等如何建模 | 草案 |
| [security-and-trust-model.md](security-and-trust-model.md) | 谁能做什么，如何审批、隔离、审计与停止 | 草案 |
| [connectors-skills-and-ecosystem.md](connectors-skills-and-ecosystem.md) | Brain、Provider、Connector、MCP、Skill 如何区分和扩展 | 草案 |
| [distribution-data-and-operations.md](distribution-data-and-operations.md) | 如何安装、升级、迁移、备份、诊断和恢复 | 草案 |
| [product-metrics-and-validation.md](product-metrics-and-validation.md) | 如何衡量真实结果、信任、安全和留存 | 草案 |
| [delivery-roadmap.md](delivery-roadmap.md) | 跨仓库工作如何拆解、排序和验收 | 草案 |
| [adr/0001-desktop-ui-stack.md](adr/0001-desktop-ui-stack.md) | 桌面 UI 为什么使用 React/Vite、何时接入 Tauri、运行时边界在哪里 | Accepted |
| [ui-prototype-implementation.md](ui-prototype-implementation.md) | 当前可运行 UI 已覆盖什么、如何启动、下一步如何接入 Core | 可运行原型 |
| [super-workbench-context-and-governance.md](super-workbench-context-and-governance.md) | Workspace、人的权限角色、One 工作角色与 Unterm/Unzoo 强制路由如何设计 | 当前产品方向 |

## 品牌与视觉资产

- [C1 / Flow One 完整品牌系统预览](../brand/c1/brand-system-preview.html)
- [C1 产品设计系统与关键页面预览](../brand/c1/product-design-preview.html)
- [C1 / Flow One 品牌识别手册](c1-brand-identity-system.md)
- [C1 产品设计系统](c1-product-design-system.md)
- [关键页面与状态蓝图](key-screen-blueprints.md)
- [C1 品牌资产目录](../brand/c1/README.md)
- [Direction B：Open Gate 专项预览](../brand/direction-b-preview.html)
- [Direction B：Open Gate 产品标](../brand/unzoo-one-mark-b-open-gate.svg)
- [Direction B：Open Gate 黑白商标稿](../brand/unzoo-one-mark-b-open-gate-mono.svg)
- [Direction B：Open Gate App Icon](../brand/unzoo-one-app-icon-b-open-gate.svg)
- [可交互品牌预览](../brand/preview.html)
- [Unzoo 母品牌标志](../brand/unzoo-master-mark.svg)
- [Unzoo One 标志](../brand/unzoo-one-mark.svg)
- [Unzoo Browser 优化概念标](../brand/unzoo-browser-mark.svg)
- [Unzoo One App Icon](../brand/unzoo-one-app-icon.svg)
- [设计令牌](../brand/tokens.css)
- [第一版高保真探索图](../brand/concepts/unzoo-one-ui-exploration-01.png)

## 事实来源优先级

同一概念出现差异时按以下顺序处理：

1. `contracts/v0` 的机器可验证 Schema；当前尚待建立。
2. [安全与信任模型](security-and-trust-model.md)。
3. [核心领域模型与协议契约](domain-model-and-contracts.md)。
4. [MVP 产品规格](mvp-product-spec.md)。
5. 产品体验、品牌与路线图文档。
6. 探索图和演示稿。

探索图用于表达方向，不作为权限、状态机或功能完整性的事实来源。

## 待建立

- `contracts/v0`：Task Event、Action、Approval、Provider Manifest 和错误模型 Schema。
- `docs/adr/`：跨仓库且难以回滚的架构决策记录。
- `research/`：用户访谈、任务回放和竞品证据。
- `brand/optical/`：16–32px 光学校正版与平台图标导出。
