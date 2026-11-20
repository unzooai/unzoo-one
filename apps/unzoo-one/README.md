# Unzoo One 桌面客户端

Unzoo One 是它自己后台服务（Core）的一个客户端；终端是另一个。任务、定时、
智能体会话和收件箱都在后台服务里，窗口关了照样跑。

- 外壳：Tauri 2（`src-tauri/`）。启动时确保后台服务在跑（没有就以 `--headless`
  启动 `unterm-core`），把地址和令牌通过 `core_connection` 命令交给页面。
- 界面：仓库根目录 `app/` 的控制台，静态构建（`npm run build:static` → `dist/client`）
  打包进客户端。
- 终端：侧栏"打开终端"启动安装目录里的 `unterm.exe`，它连到同一个后台服务。

## 开发

```powershell
# 后台服务和终端（unterm/ 工作区）
cd unterm; cargo build -p unterm-core -p unterm-app; cd ..
# 界面
npm run build:static
# 客户端（开发时会在 unterm/target 里找后台服务和终端）
cd apps/unzoo-one/src-tauri; cargo run
```

`UNTERM_STATE_DIR` 指向一个空目录即可在隔离环境里试，不碰本机已有的数据。

## 安装包

```powershell
powershell -File apps\unzoo-one\build-installer.ps1
```

依次构建后台服务与终端（release）、界面，把运行时文件放进 `src-tauri/payload`，
再由 Tauri 打出 MSI（`src-tauri/target/release/bundle/msi`）。安装目录是平铺的：
`Unzoo One.exe`、`unterm-core.exe`、`unterm.exe`、`unterm-cli.exe` 和终端的辅助文件，
各自都在同一目录里找彼此。

### 签名

不签名的安装包，Windows SmartScreen 会拦一道“已保护你的电脑”。发布用的包要用代码签名证书签：

```powershell
# 证书在系统证书库里（EV 证书的 USB 令牌、或云 HSM 的 KSP 通常是这样）
$env:UNZOO_SIGN_THUMBPRINT = "<证书 SHA-1 指纹>"
# 或者是 .pfx 文件
$env:UNZOO_SIGN_PFX = "C:\path\to\codesign.pfx"; $env:UNZOO_SIGN_PFX_PASSWORD = "..."
# 或者用 Azure Trusted Signing（微软的签名服务）
$env:UNZOO_SIGN_TRUSTED = "C:\path\to\metadata.json"      # Endpoint、CodeSigningAccountName、CertificateProfileName
$env:UNZOO_SIGN_TRUSTED_DLIB = "C:\path\to\Azure.CodeSigning.Dlib.dll"
# 可选：时间戳服务器，默认 http://timestamp.digicert.com（Trusted Signing 默认用微软的）
$env:UNZOO_SIGN_TIMESTAMP = "http://timestamp.digicert.com"

powershell -File apps\unzoo-one\build-installer.ps1 -RequireSignature
```

- `sign.ps1` 用 Windows SDK 的 `signtool`（SHA-256，带 RFC 3161 时间戳，证书过期后签名仍有效）。
- 先签放进安装包的运行时文件（`unterm*.exe`、DLL）；客户端本身和两个 MSI 由 Tauri 用同一个脚本签
  （`bundle.windows.signCommand`，构建时临时加上）。已经带有效签名的文件（微软的 `OpenConsole.exe`、
  `conpty.dll`）原样保留。
- 没配证书时照样能打包，脚本开头会说明这是未签名的包；`-RequireSignature` 下没证书直接失败，
  打完还会检查两个 MSI 确实带了签名。
- 选哪种签名：2024 年起 EV 证书也不再让 SmartScreen 立即放行，信任都要靠同一个发布者的签名积累下载量。
  首选 Azure Trusted Signing（按月付费，证书由微软托管、自动续期，不用 USB 令牌）；它对申请者所在地有
  限制，申请不了时再买 OV/EV 证书。无论哪种，签名的发布者名都要和安装包里的“Unzoo”一致，且一直用同一个。
- 不签名之外，最容易被杀毒软件误报的是程序“看起来像恶意软件”的行为。下面这些已经改掉，以后也别再加：
  隐藏窗口里跑 `reg.exe` 写开机启动项（改用注册表 API）、`powershell -EncodedCommand` /
  `-ExecutionPolicy Bypass` / 在 PowerShell 里 `Add-Type` 调 user32（截图改用 GDI 直接调）、
  后台下载安装包再用隐藏的 PowerShell 装（Unterm 自带的自动更新在 Unzoo One 里不再启用）。
- 新版本发布后如果仍被 Defender 报毒，到 https://www.microsoft.com/wdsi/filesubmission 以软件开发者身份
  提交误报，通常几天内处理。

## 开机后台运行

设置 › 运行偏好的“登录系统后在后台运行”：打开后，登录系统时以 `--background` 启动客户端，
它只把后台服务拉起来、不开窗口，随即退出。重启电脑后定时任务不用等人打开 Unzoo One。

| 系统 | 写在哪里 |
|---|---|
| Windows | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 的 `Unzoo One` |
| macOS | `~/Library/LaunchAgents/ai.unzoo.one.background.plist`（RunAtLoad） |
| Linux | `$XDG_CONFIG_HOME/autostart/ai.unzoo.one.desktop`（默认 `~/.config`） |

都只属于当前用户，不需要管理员权限，也都会出现在系统自己的“登录项 / 启动应用”列表里。
macOS 和 Linux 的安装包还没有做（`build-installer.ps1` 只打 Windows MSI），这部分代码先就位。
