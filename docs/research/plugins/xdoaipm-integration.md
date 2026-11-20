# 技能和插件的分界，以及 Xdoaipm 怎么接进 Unzoo One（调研，2026-11-20）

## 1. 叫技能还是叫插件

| | 技能（Skill） | 插件（Plugin） |
|---|---|---|
| 是什么 | 给智能体看的做法（一个 `SKILL.md` 文件夹） | 一个能运行的程序 |
| 谁执行 | 智能体用终端和浏览器自己做 | 插件自己的代码，智能体通过它的工具调用 |
| 状态 | 没有，每次从头来 | 有：账号、队列、草稿、统计、去重 |
| 界面 | 没有 | 可以有自己的控制页面 |
| 定时 | 交给 Unzoo One 的定时任务 | 可以声明自己的定时任务 |
| 浏览器身份、模型 | 用任务的 | 可以按插件（甚至按角色）指定 |

**结论：只要需要控制页面、常驻状态或自己的代码，就是插件，不是技能。** 插件可以带技能
（告诉智能体怎么用插件的工具），技能不能带插件。界面上：设置 › 能力 下分“技能”和“插件”两栏；
插件的控制页面从侧栏“插件”进入，在 Unzoo One 窗口里打开。

## 2. Xdoaipm 是什么（读的是 main 分支源码，私有仓库）

多平台（X / 微博 / Reddit / 头条 / 知乎）社媒运营系统，作者 zhitongblog（也是 Unterm 的作者）。

- 纯 Python 标准库，约 1.6 万行。`server.py` 在 `127.0.0.1:8788` 起本地看板（`web/index.html`，约 60 个
  `/api/*` 接口），`launcher.py` 用 pywebview 包成窗口，PyInstaller + Inno Setup 打包。另有 `cli.py`
  和给 Claude Code 用的 `mcp_server.py`（stdio）。
- 账号：`config/accounts.json`，每个账号绑一个 Unzoo 浏览器身份（同平台一对一，跨平台可复用）。
- 内容生成：`gen.py` 按平台选引擎 `{provider, profile}`：
  - `agy`：连本机 Unterm 的 MCP 端口，在一个专用终端里跑 agy CLI，可选模型和推理强度；
  - `chatgpt` / `gemini` / `qianwen`：在某个 Unzoo 身份里操作网页版。
- 浏览器动作：直接调 Unzoo 的 REST（`127.0.0.1:9399/api/v1/*`），按身份开标签页、打字、点击、上传。
- 自带定时器（每天采集、到时间自动发）、风控、代理切换（Clash）、效果统计、开发日志（从 git 提交写稿）。

## 3. 它现在绕开了 Unzoo One 的哪些东西

| 现状 | 问题 |
|---|---|
| 浏览器动作直接打 Unzoo REST 9399 | 不经过 Unzoo One：点“发布”“回复”不会被识别成对外发出，审核员和收件箱都看不到 |
| `agy.py` 连上 Unterm 后自己 `auth.login` + `agent.trust`，并往 agy 设置里写 `trustedWorkspaces` | 自己给自己授信，绕过了“谁能在终端里干什么” |
| 按 `~/.unterm`、`C:\Program Files\Unterm` 找终端 | 找不到 Unzoo One 的后台服务（`~/.unzoo-one`），会去启动单独的 Unterm |
| 自带定时器，`scheduler.auto_publish: true` | 和 Unzoo One 的定时任务各跑各的；跑了什么不进对话，关机补跑、提醒规则都用不上 |
| 看板端口没有令牌 | 本机任何程序都能调它的发布接口 |
| 辅助号“放大”个人号的帖子 | X 的平台操纵规则禁止多个账号协同放大同一个人。建议默认关闭，开了也要人确认 |

## 4. 怎么接进来（分三步）

### 第一步：先能用（Xdoaipm 不改代码）

- 设置 › 能力 › 插件 › “从文件夹添加”：选 Xdoaipm 的目录，Unzoo One 识别出 `server.py`，生成一份插件清单。
- Unzoo One 的后台服务负责启停它（作为受管进程，日志可看），侧栏“插件 › Xdoaipm”在窗口里打开它的看板。
- 把它的 `mcp_server.py` 挂给对话里的智能体，用户可以直接说“用 Xdoaipm 给知乎出一条开发日志”。
- 这一步它的浏览器动作仍然绕开审批，所以界面上标“未受管”，并默认关掉它的自动发布。

### 第二步：受管（Xdoaipm 小改，约 4 处）

Unzoo One 启动插件时通过环境变量给它：后台服务地址、插件令牌、分配的端口、分配的浏览器身份和模型。

1. **找终端**：读 `UNZOO_ONE_CORE` / `UNZOO_ONE_TOKEN`，不再自己找 Unterm、不再 `agent.trust`。
2. **生成**：`agy.py` 改成调 Unzoo One 的一次性会话（`agent_session` 的单轮运行），用插件配置的智能体和
   模型；网页版引擎保留。
3. **浏览器**：`uz.py` 的地址从 `127.0.0.1:9399` 换成 Unzoo One 提供的代理入口（同样的 REST 路径）。
   代理按插件令牌认出是谁，只放行分配给它的身份，并对点击/回车/提交做和智能体一样的后果判断：
   发布、回复、点赞走审核员和收件箱，理由里引用的是用户在插件里定稿的内容。
4. **定时**：`scheduler` 改成向 Unzoo One 注册定时任务（每个任务就是一段对话），跑的结果和问题都在对话里。

### 第三步：插件机制本身（Unzoo One 改）

插件清单 `unzoo-plugin.json`（和 Unzoo 浏览器的 `plugin.toml` 字段对齐，方便以后两边通用）：

```json
{
  "id": "xdoaipm",
  "name": "Xdoaipm 社媒运营",
  "version": "1.0.0",
  "run": { "command": ["python", "server.py"], "port": "auto", "health": "/api/ping" },
  "page": "/",
  "mcp": { "command": ["python", "mcp_server.py"] },
  "skills": ["skills/"],
  "roles": {
    "owner":     { "kind": "browser", "label": "个人号" },
    "auxiliary": { "kind": "browser", "label": "辅助号", "many": true },
    "writer":    { "kind": "agent",   "label": "写稿", "default": { "agent": "agy", "model": "gemini-4-carbon-medium" } }
  },
  "permissions": {
    "domains": ["x.com", "weibo.com", "reddit.com", "toutiao.com", "zhihu.com", "chatgpt.com"],
    "max_risk_without_asking": "local_mutation"
  },
  "schedules": [{ "id": "harvest", "label": "每天采集", "every": "day 09:00", "tool": "monitor" }]
}
```

## 5. 每个插件能不能有自己的浏览器身份和模型

能，而且应该按“角色”而不是按插件整体分配：

- **浏览器身份**：插件在清单里声明角色（个人号、辅助号、生成用），用户在插件设置页把每个角色绑到一个
  Unzoo 身份。没绑时给它新建一个专属身份（`plugin-xdoaipm-owner`），绝不默认用用户自己的身份。
  代理按令牌校验：插件只能操作绑给它的身份，碰别的身份直接拒绝。身份计入 Unzoo 套餐额度。
- **模型**：插件声明需要“写稿”“审稿”之类的智能体角色和默认的智能体 + 模型 + 推理强度，用户可以改。
  生成走 Unzoo One 的会话，所以用的是用户自己的订阅，用量算在对话记录里。
- **现在缺的**：Unzoo One 的任务目前只能选智能体，不能选模型（用的是各 CLI 自己的默认）；浏览器身份是
  全局一个。要先加上：
  - 任务和会话加 `model` / `effort`，传给各 CLI（`claude --model`、`codex -m`、`agy --model`、
    `opencode --model`）；
  - 浏览器身份从全局设置下放到任务和插件角色。

这两项对普通任务也有用（比如定时的小任务用便宜的模型），建议先做。

## 6. 建议的顺序

1. 任务级的模型和浏览器身份（Unzoo One 内部，普通任务马上受益）。
2. 插件机制第一版：清单、受管进程、侧栏打开控制页面、挂 MCP、角色绑定。
3. 浏览器代理入口（带插件令牌、身份校验和提交审核）。
4. 和 Xdoaipm 作者一起改那 4 处，作为第一个受管插件。
