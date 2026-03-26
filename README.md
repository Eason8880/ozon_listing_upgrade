# Ozon Listing Upgrade

基于 `Vite + React + TypeScript` 的纯前端工具站点，适合直接部署到 `Vercel`。

## 功能

- 新增 `数据翻译` Tab：
  - 上传 `.xls / .xlsx`（仅处理第 1 个工作表）
  - 调用 OpenRouter（`google/gemini-2.5-flash`、`openai/gpt-4o-mini`）翻译 `商品名称`、`简介` 为俄语
  - 按固定字段规则生成全新 `.xlsx` 结果文件（只保留目标 10 列）
- 用户输入 `bltcy.ai` API Key 后调用 BLTCY 生图接口
- 支持本地上传图片和多行图片 URL 混合提交
- 支持 `nano-banana`、`gpt-4o-image`、`gemini-3.1-flash-image-preview-4k`、`nano-banana-2-4k`
- 逐张生成、逐条展示状态，失败项可单独重试
- 成功结果支持预览、单张下载、单张复制 URL、批量复制 URL、ZIP 打包下载
- `API Key`、模型、比例、提示词自动保存到浏览器本地

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署到 GitHub + Vercel

1. 初始化 Git 并推到 GitHub

```bash
git init
git add .
git commit -m "init product image generator"
git branch -M main
git remote add origin <你的-github-仓库地址>
git push -u origin main
```

2. 打开 Vercel，选择 **Add New Project**
3. 导入这个 GitHub 仓库
4. Vercel 会自动识别为 `Vite` 项目；如果需要手动填写：
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 Deploy

如果后续你改了代码，只要继续推送到 GitHub，Vercel 会自动重新部署。

## 注意

- `数据翻译` 的 OpenRouter Key 会保存在浏览器本地环境中。
- `API Key` 会保存在浏览器本地环境中。
- 当前 4 个模型统一请求 `https://api.bltcy.ai/v1/images/generations`。
- 如果接口返回的是公网 `url`，页面支持复制 URL。
- 如果接口返回的是 `b64_json`，页面仍支持预览、下载和 ZIP，但不会复制 `data:` 地址。
