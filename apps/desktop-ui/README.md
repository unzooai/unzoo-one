# Unzoo One Desktop UI

C1 / Flow One 的可运行桌面产品原型。当前使用 React、TypeScript 与 Vite，正式产品将在契约稳定后由 Tauri 2 承载。

## 运行

```powershell
npm install
npm run dev
```

## 验证

```powershell
npm run lint
npm run build
```

界面通过 `src/domain/contracts.ts` 中的 `OneClient` 边界消费运行时数据。当前使用 `src/adapters/mockOneClient.ts`；真实 Supervisor 接入时应替换 adapter，不应让页面直接调用 Unterm、Unzoo 或模型 SDK。

架构决策与后续工作见：

- [ADR-0001](../../docs/adr/0001-desktop-ui-stack.md)
- [UI 原型实现说明](../../docs/ui-prototype-implementation.md)
