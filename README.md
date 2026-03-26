# 商品图片生成

基于 `Vite + React + TypeScript` 的纯前端批量商品图生成站点，适合直接部署到 `Vercel`。

## 功能

- 用户输入 `bltcy.ai` API Key 后直接在浏览器侧调用生图接口
- 支持本地上传图片和多行图片 URL 混合提交
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

- 这是纯前端方案，`API Key` 会保存在浏览器本地环境中。
- 站点默认请求 `https://api.bltcy.ai/v1/images/generations`。
- 若目标模型不接受本地图片 `data URL`，需要改为服务端代理或改成先上传后再传公开 URL。
