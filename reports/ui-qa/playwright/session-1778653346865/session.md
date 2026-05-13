
### Tool call: browser_navigate
- Args
```json
{
  "url": "http://127.0.0.1:5173"
}
```
- Result
```json
{
  "code": "await page.goto('http://127.0.0.1:5173');",
  "page": "- Page URL: http://127.0.0.1:5173/\n- Page Title: Khujandi Mini App\n- Console: 1 errors, 0 warnings",
  "snapshot": "- generic [active] [ref=e1]:\n  - generic [ref=e2]:\n    - img [ref=e4]\n    - generic [ref=e13]: Худжанди\n  - region \"Language selection\" [ref=e17]:\n    - heading \"Выберите язык\" [level=1] [ref=e18]\n    - paragraph [ref=e19]: Выберите язык, чтобы продолжить.\n    - generic [ref=e20]:\n      - button \"Русский\" [ref=e21]\n      - button \"English\" [ref=e22]\n      - button \"Тоҷикӣ\" [ref=e23]",
  "events": "- New console entries: reports/ui-qa/playwright/console-2026-05-13T06-22-26-930Z.log#L1-L14"
}
```

### Tool call: browser_snapshot
- Args
```json
{
  "filename": "reports/ui-qa/playwright/snapshot-smoke-20260513-1022.md",
  "depth": 5
}
```
- Result
```json
{
  "page": "- Page URL: http://127.0.0.1:5173/\n- Page Title: Khujandi Mini App\n- Console: 1 errors, 0 warnings",
  "snapshot": "- region \"Language selection\" [ref=e17]:\n  - heading \"Выберите язык\" [level=1] [ref=e18]\n  - paragraph [ref=e19]: Выберите язык, чтобы продолжить.\n  - generic [ref=e20]:\n    - button \"Русский\" [ref=e21]\n    - button \"English\" [ref=e22]\n    - button \"Тоҷикӣ\" [ref=e23]",
  "events": "- New console entries: reports/ui-qa/playwright/console-2026-05-13T06-22-26-930Z.log#L15-L16"
}
```

### Tool call: browser_take_screenshot
- Args
```json
{
  "type": "png",
  "filename": "reports/ui-qa/playwright/smoke-20260513-1022.png",
  "fullPage": true
}
```
- Result
```json
{
  "result": "- [Screenshot of full page](reports/ui-qa/playwright/smoke-20260513-1022.png)",
  "code": "// Screenshot full page and save it as reports/ui-qa/playwright/smoke-20260513-1022.png\nawait page.screenshot({\n  fullPage: true,\n  path: 'reports/ui-qa/playwright/smoke-20260513-1022.png',\n  scale: 'css',\n  type: 'png'\n});"
}
```

### Tool call: browser_console_messages
- Args
```json
{
  "level": "info",
  "all": true,
  "filename": "reports/ui-qa/playwright/console-smoke-20260513-1022.log"
}
```
- Result
```json
{
  "result": "- [Console](reports/ui-qa/playwright/console-smoke-20260513-1022.log)"
}
```

### Tool call: browser_close
- Args
```json
{}
```
- Result
```json
{
  "result": "No open tabs. Navigate to a URL to create one.",
  "code": "await page.close()"
}
```
