# Ozon Listing Upgrade

基于 `Vite + React + TypeScript` 的纯前端数据翻译工具，适合直接部署到 `Vercel`。

## 功能

- 上传 `.xls / .xlsx`（仅处理第 1 个工作表）
- 调用 OpenRouter（`google/gemini-2.5-flash`、`openai/gpt-4o-mini`）翻译 `商品名称`、`简介` 为俄语
- 按固定字段规则生成全新 `.xlsx` 结果文件（14 列 Ozon 模板）
- 视觉系统升级：基于 Tailwind CSS 3 + Editorial-Dark 主题 token（玻璃质感、层级阴影、统一控件状态）
- `OpenRouter API Key`、翻译模型自动保存到浏览器本地

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
git commit -m "init ozon data translator"
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

- `OpenRouter API Key` 会保存在浏览器本地环境中。
