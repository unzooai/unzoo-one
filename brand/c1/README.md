# Unzoo One C1 / Flow One 品牌资产

本目录是基于 C1 `Flow One` 的品牌识别系统工作稿。核心符号由一条连续路径构成：开放的 `U` 沿右侧自然上升并转化为数字 `1`。

## 目录

```text
c1/
├── marks/       # 主标、信号版、黑白版与小尺寸版
├── lockups/     # 横版、竖版和品牌短句组合
├── icons/       # App Icon、Favicon、社交头像
├── motion/      # 数字环境中的标志动效样例
├── patterns/    # Flow Field 辅助图形
├── tokens.css   # 可直接进入产品的品牌与产品设计令牌
├── brand-system-preview.html
└── product-design-preview.html
```

## 选择规则

| 场景 | 文件 |
| --- | --- |
| 浅色背景默认主标 | `marks/unzoo-one-mark-primary.svg` |
| 深色数字界面强调 | `marks/unzoo-one-mark-signal.svg` |
| 商标、传真、单色印刷 | `marks/unzoo-one-mark-black.svg` |
| 深色单色背景 | `marks/unzoo-one-mark-white.svg` |
| 16–24px | `marks/unzoo-one-mark-optical-16.svg` |
| 桌面应用 | `icons/unzoo-one-app-icon.svg` |
| 浏览器标签 | `icons/unzoo-one-favicon.svg` |
| 社交账号 | `icons/unzoo-one-avatar.svg` |
| 网站首次进入 | `motion/unzoo-one-mark-motion.svg`，最多播放一次 |
| 品牌系统评审 | `brand-system-preview.html` |
| 产品设计评审 | `product-design-preview.html` |

## 当前限制

- Lockup 中的文字仍使用字体引用，正式生产前必须确认字体许可并转为轮廓。
- 尚未导出 Windows `.ico` 与 macOS `.icns`。
- 尚未经过正式商标近似清查。
- 小尺寸 SVG 是光学草案，需要在真实 Windows 任务栏和 Browser 标签中继续校正。
