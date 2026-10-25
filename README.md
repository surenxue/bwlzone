# BWL的角落

个人技术与生活博客，正式网址：**https://www.bwlzone.fun/**。

当前正式版本：**V1.0**（软件版本 `1.0.0`，2026-10-25）。新增一篇 GPT 协作建站笔记，并使用用户提供的星轨雪山照片作为封面与正文图片。

这次更新保留了现有三篇文章的正文、日期、原有路径、分类与标签，重新设计首页和阅读界面，并增加全文搜索、分类筛选、深浅色主题及移动端导航。

## 修改和发布

需要 Node.js 22 或更高版本，无需安装第三方依赖。

1. 修改 `content.json` 中的文章，或 `src/` 中的样式与交互。
2. 运行 `npm run build`。它生成 `dist/`，检查内部链接与文章完整性，并同步静态页面到仓库根目录。
3. 运行 `npm run dev`，访问终端输出的本地地址预览。
4. 提交并推送更改到 `main`，由现有 GitHub Pages 配置发布。

`CNAME` 保留为 `www.bwlzone.fun`，`site.config.json` 使用同一正式域名生成 canonical、Open Graph 和 sitemap 地址。`.nojekyll` 标记该站点为已经生成的静态页面。

## 目录

- `content.json`：文章数据及原始正文。
- `src/`：公共样式和交互源码。
- `scripts/`：页面生成、校验、预览和发布文件整理脚本。
- `assets/`：原仓库素材及用户提供的 V1.0 星轨雪山照片。
- `VERSION`、`site.config.json`：正式版本标识和站点地址。
- 根目录 HTML、CSS、JS 及分类、标签和文章目录：生成后的 GitHub Pages 文件。
- `img/`、`images/`、`css/`、`js/` 等原目录继续保留，兼容已有资源链接。

## 来源

导入时的原仓库提交为 `4f4dcfdcefd8106b37140c9d4c1f35916b923ac0`。原文的来源 SHA 保存在 `content.json` 中；文章沿用原站 BY-NC-SA 版权声明，图片沿用原有素材。

完整的 GPT 创建过程 Markdown 保存在独立的 `project-records` 分支，不合并到 `main`，不参与 GitHub Pages 的页面、搜索或 sitemap 生成。该分支是公开仓库中的记录，不是私密存储。
