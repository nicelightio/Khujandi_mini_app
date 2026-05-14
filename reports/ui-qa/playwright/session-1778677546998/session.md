
### Tool call: browser_navigate
- Args
```json
{
  "url": "https://staging-tgmeal.natureonzoom.win"
}
```
- Result
```json
{
  "code": "await page.goto('https://staging-tgmeal.natureonzoom.win');",
  "page": "- Page URL: https://staging-tgmeal.natureonzoom.win/\n- Page Title: Khujandi Mini App",
  "snapshot": "- generic [active] [ref=e1]:\n  - generic [ref=e2]:\n    - img [ref=e4]\n    - generic [ref=e13]: Худжанди\n  - region \"Language selection\" [ref=e17]:\n    - heading \"Выберите язык\" [level=1] [ref=e18]\n    - paragraph [ref=e19]: Выберите язык, чтобы продолжить.\n    - generic [ref=e20]:\n      - button \"Русский\" [ref=e21]\n      - button \"English\" [ref=e22]\n      - button \"Тоҷикӣ\" [ref=e23]",
  "events": "- New console entries: reports/ui-qa/playwright/console-2026-05-13T13-05-47-061Z.log#L1-L9"
}
```

### Tool call: browser_run_code_unsafe
- Args
```json
{
  "code": "async (page) => {\n  return {\n    cwd: typeof process !== 'undefined' && process.cwd ? process.cwd() : null,\n    hasRequire: typeof require !== 'undefined',\n    hasFsGlobal: typeof fs !== 'undefined',\n    envKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter((key) => key === 'E2E_TEST_TOKEN' || key === 'PWD') : []\n  };\n}"
}
```
- Result
```json
{
  "result": "{\"cwd\":null,\"hasRequire\":false,\"hasFsGlobal\":false,\"envKeys\":[]}",
  "code": "await (async (page) => {\n  return {\n    cwd: typeof process !== 'undefined' && process.cwd ? process.cwd() : null,\n    hasRequire: typeof require !== 'undefined',\n    hasFsGlobal: typeof fs !== 'undefined',\n    envKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter((key) => key === 'E2E_TEST_TOKEN' || key === 'PWD') : []\n  };\n})(page);",
  "page": "- Page URL: https://staging-tgmeal.natureonzoom.win/\n- Page Title: Khujandi Mini App",
  "events": "- New console entries: reports/ui-qa/playwright/console-2026-05-13T13-05-47-061Z.log#L10-L11"
}
```
