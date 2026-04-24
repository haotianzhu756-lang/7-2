# 双色球工具（纯前端）

## 双击版（推荐）

- 更新数据：`tools\\update_ssq_data.bat`
- 启动网页：`tools\\start_ssq_web.bat`
- 先更新再启动：`tools\\update_and_start_ssq.bat`

## 命令行版

启动开发服务器：

```bash
node server.js
```

默认访问地址：`http://localhost:5173`

## GitHub Pages 发布

这个项目已经整理成可直接发布到 GitHub Pages 的静态站点。

本地生成 Pages 发布文件：

```bash
npm run build:pages
```

生成结果位于：

```bash
dist/
```

仓库中已经包含 GitHub Pages 工作流：

```text
.github/workflows/deploy-pages.yml
```

首次发布时，请在 GitHub 仓库中完成这几步：

1. 把仓库推送到 GitHub。
2. 打开仓库的 `Settings` -> `Pages`。
3. 在 `Build and deployment` 里把 `Source` 设为 `GitHub Actions`。
4. 推送到 `main` 或 `master` 分支后，等待 `Deploy GitHub Pages` 工作流完成。

如果工作流里出现 `Get Pages site failed`：

1. 先确认仓库 `Settings` -> `Pages` 里已经把 `Source` 设为 `GitHub Actions`。
2. 如果仓库是私有仓库，GitHub Free 不能直接发布私有仓库 Pages，需要把仓库改成公开仓库，或者使用支持私有仓库 Pages 的付费计划。

发布成功后，手机直接打开：

```text
https://你的用户名.github.io/仓库名/
```

如果仓库名不是根站点仓库，网址末尾需要保留仓库名这一段。

运行测试：

```bash
node tests/ssq.test.js
```

采集双色球历史数据并生成 CSV：

```bash
node scripts/fetch-ssq-history.js --source 500star --output data/ssq_history.csv
```

数据源选择：

```bash
node scripts/fetch-ssq-history.js --source auto
node scripts/fetch-ssq-history.js --source cwl
node scripts/fetch-ssq-history.js --source 500star
```

如 cwl 接口返回 403，可带浏览器 Cookie：

```bash
node scripts/fetch-ssq-history.js --source cwl --cookie "你的 Cookie"
```

或：

```bash
$env:SSQ_COOKIE="你的 Cookie"
node scripts/fetch-ssq-history.js --source cwl
```

离线转换本地原始 JSON：

```bash
node scripts/fetch-ssq-history.js --input ./raw.json --output data/ssq_history.csv
```
