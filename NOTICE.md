# 第三方源码声明

Unzoo One 自己的代码采用 Business Source License 1.1（见 [LICENSE](LICENSE)）。下面列出的第三方代码不在其内，保留各自的许可证。

## Unterm（`unterm/`）

`unterm/` 目录是 [zhitongblog/unterm](https://github.com/zhitongblog/unterm) 的源码，
通过 `git subtree --squash` 并入，导入时的上游提交为 `f0556e0`（v0.71.22 之后）。

Unterm 以 MIT 许可证发布，完整许可文本见 [`unterm/LICENSE.md`](unterm/LICENSE.md)：

- Copyright (c) 2026-Present Alex (Unterm)
- Copyright (c) 2018-Present Wez Furlong（Unterm 所基于的上游 WezTerm 引擎，
  见 https://github.com/wezterm/wezterm）

其中随附的字体（JetBrains Mono、Fira Code、Noto Color Emoji、Roboto）以
SIL Open Font License 1.1 发布，见 `unterm/assets/fonts/LICENSE_OFL.txt`。
`unterm/deps/` 下的 harfbuzz、freetype2、libpng、zlib 各自保留原许可证，
见对应目录与 [`unterm/licenses/`](unterm/licenses/)。

分发 Unzoo One 的任何形式（源码或安装包）都必须附带上述版权声明与许可文本。

### 与上游同步

```bash
git subtree pull --prefix=unterm https://github.com/zhitongblog/unterm.git master --squash
```
