# ADR 0002：并入 Unterm 源码，运行时以 Unterm 实现为准（路线 A）

> 状态：Accepted
> 日期：2026-11-09
> 取代：`delivery-roadmap.md` 2026-08-06 的「归属修订」中关于控制平面实现位置的部分
> 关联：`zhitongblog/unterm#30` 第 0 项、`unzoo-one#2`、`#4`、`#5`、`#10`、`#12`

## 背景

2026-08-06 的归属修订定为「Unzoo One 是唯一控制平面，Unterm 是可选的 Terminal
Provider」，并据此在本仓库开始用 TypeScript 自建 `one-core`。

但 unterm 0.71 实际上已经实现了这些能力，而且把 Unzoo 登记为它的 Provider：

| unterm 模块 | 内容 |
|---|---|
| `unterm-tasks/` | SQLite 持久化任务引擎、approval、lease、workspace |
| `unterm-providers/` | manifest、discovery、registry、contract suite、`unzoo.rs` |
| `unterm-services/` | audit、evidence、artifacts、workspace scope、supervisor、install |
| `unterm-brain/` | Brain 适配 |

`unterm#30` 第 0 项把这个冲突列成两条路：A（unterm 是宿主，`contracts/v0` 成为
它的对外接口）和 B（unzoo-one 是控制平面，unterm 退回 Terminal Provider）。unterm
在 `c4aa0399` 里按 A 推进；本仓库的文档和 `one-core` 仍按 B。两边在各做一套。

同时，产品要求用户只安装一个 Unzoo One，不再单独下载 Unterm。

## 决定

1. **Unterm 源码并入本仓库 `unterm/`**（MIT，`git subtree --squash`，版权声明见
   `NOTICE.md`）。Unzoo One 从源码构建终端与运行时，不再把 Unterm 当外部依赖安装。
2. **采用路线 A：运行时以 unterm 的 Rust 实现为准。** Task Engine、Provider Registry、
   Approval/Lease、Audit/Evidence/Artifact、Supervisor、安装器、Brain 适配都在
   `unterm/` 的 crate 里演进，不在 `one-core` 里另做一份。
3. **`contracts/v0` 定义的是这个运行时的对外接口**，契约与实现冲突时，先看实现
   是否更合理（如 `#14`、`#15`），再决定改哪边。
4. **`one-core`（TypeScript）冻结，不再扩展。** 它已经验证过的东西作为参考迁到
   Rust 侧：事件哈希链与验链、per-task 序号与 cursor 分页、幂等键跨重启、单实例锁
   接管规则、40 个行为测试所描述的语义。迁完后删除。
5. **「Unterm 为可选组件」不再成立。** 终端是产品内置能力；不需要终端的用户只是
   不用它，而不是不安装它。

## 后果

- `#4`（one-core）关闭方向改为「迁移到 unterm 运行时」；`#5`、`#7`、`#10`、`#12`
  的实现位置改为 `unterm/` 下对应 crate。
- `delivery-roadmap.md` §1 的仓库职责需要按本 ADR 重写；在重写之前，以本 ADR 为准。
- 本仓库多了一套 Rust 工作区，CI 需要加 `cargo check` / `cargo test`。
- 与上游 `zhitongblog/unterm` 的关系需要定：继续双向同步（`git subtree pull/push`），
  还是以本仓库为唯一上游。在定下来之前，按 `NOTICE.md` 的命令单向拉取。

## 未决

- 上游 unterm 是否继续作为独立终端产品发布。
- Web 控制台（`app/`）与 Tauri 桌面端（ADR 0001）谁对接 unterm 的 `/api`。
