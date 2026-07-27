# Unzoo One agent execution policy

These rules apply to every AI agent working in this repository.

## Governed execution

1. Use Unterm for every terminal, shell, process and filesystem execution.
2. Use Unzoo Browser for every browser action, including navigation, extraction, screenshots, downloads, login flows and computer-use workflows.
3. Do not install, import or launch Playwright, Puppeteer, Selenium, WebDriverIO, raw CDP clients or duplicate browser automation runtimes.
4. If a request or dependency asks for Playwright-style browser automation, translate the operation to the equivalent Unzoo Browser capability.
5. If an equivalent Unzoo capability is unavailable, stop and report the missing capability. Do not silently fall back to another browser runtime.
6. Do not spawn an unmanaged shell, terminal emulator, browser profile or automation daemon.
7. Keep the active workspace, trust state, permission grant and provider lease attached to every mutating action.

## Provider boundary

```text
AI Brain
  -> One Supervisor / Policy
     -> Unterm Provider for terminal execution
     -> Unzoo Provider for browser and computer interaction
```

The Brain requests capabilities. It does not receive raw credentials and may not bypass the Supervisor by invoking provider internals directly.

## Browser mapping

- Navigate: `browser_navigate`
- Understand page: `browser_a11y_snapshot` or `page_analyze`
- Click/type: `browser_click` / `browser_type`
- Evaluate: `browser_evaluate`
- Screenshot: `browser_screenshot`
- Download media: `media_download_smart`
- Multi-account work: isolated Unzoo profiles

Do not add Playwright or similar packages to this repository.
