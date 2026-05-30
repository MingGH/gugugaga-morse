# 咕咕嘎嘎摩尔斯密码转换器

一个以咕咕嘎嘎为灵感的摩尔斯密码工具站，支持文字与“咕嘎密文”双向转换、音频播放、音频合并下载，以及单音节 / 双音节两种表达模式。

## Live Demo

![](https://img.996.ninja/ninjutsu/5d6dd594ff29d4df74e8c0219df5a466.png)

## 功能简介

- 文字转咕嘎密文
- 咕嘎密文转文字
- 支持英文、数字、常见符号与中文字符编码
- 支持单音节模式：`咕 / 嘎`
- 支持双音节模式：`咕咕 / 嘎嘎`
- 支持默认音频直接播放，也支持用户上传自定义音频
- 支持将咕嘎序列对应的音频片段合并后下载为 `wav`
- 针对手机端做了响应式优化

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS v4

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 本地预览构建结果

```bash
npm run preview
```

## 项目结构

```text
.
├── public/                  # 静态资源与默认图片/音频
├── src/
│   ├── components/          # 页面组件
│   ├── utils/               # 摩尔斯与咕嘎转换逻辑
│   ├── App.tsx              # 页面入口
│   ├── index.css            # 全局样式
│   └── main.tsx             # 应用挂载
├── temp/                    # 本地临时素材，不参与提交
├── index.html               # HTML 模板与统计脚本
└── package.json             # 项目脚本与依赖
```

## 默认资源说明

- 网站图标：`public/gugu-smile.png`
- 默认单音节音频：`public/gu.mp3`、`public/ga.mp3`
- 默认双音节音频：`public/gugu.mp3`、`public/gaga.mp3`

## 统计

项目已接入 Umami 统计脚本：

```html
<script defer src="https://umami.runnable.run/script.js" data-website-id="7a70324e-4128-43f4-8a14-c17500ba5f7c"></script>
```

## 相关链接

- 在线地址：https://gugugaga.996.ninja/
- 源码地址：https://github.com/MingGH/gugugaga-morse
- 主站：996忍者 https://996.ninja
- 博客：Asher的博客 https://www.runnable.run/about/

## Git 说明

- `temp/` 为本地素材目录，不提交到仓库
- 提交前建议执行 `npm run build`，确保构建通过

## 后续可扩展方向

- 增加更多预置音色
- 支持导出 `mp3`
- 增加批量文本处理和历史记录
