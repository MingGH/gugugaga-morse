# agent.md

## 文档目的

本文件用于说明本仓库的开发约定、结构认知和协作注意事项，方便后续由人类开发者或自动化代理继续维护。

## 项目定位

这是一个“咕咕嘎嘎”风格的摩尔斯密码工具站，核心能力包括：

- 文字与咕嘎密文双向转换
- 单音节 / 双音节两种编码模式切换
- 默认音频与自定义音频播放
- 根据咕嘎序列合并音频并导出
- 移动端友好的响应式访问体验

## 主要目录说明

- `src/components/Converter.tsx`
  负责文字与咕嘎密文的双向转换、复制、以及将转换结果填入下方序列。

- `src/components/AudioUploader.tsx`
  负责默认音频 / 上传音频管理、播放、停止、以及合并音频导出。

- `src/components/MorseTable.tsx`
  负责摩尔斯与咕嘎对照表展示。

- `src/utils/morseMap.ts`
  定义摩尔斯字符映射，以及单音节 / 双音节的咕嘎转换规则。

- `src/utils/converter.ts`
  封装文字与咕嘎密文之间的转换逻辑。

- `public/`
  放置 favicon、默认图片和默认音频资源。

- `temp/`
  本地临时素材目录，仅作为开发过程中的中转目录使用，不应提交。

## 开发约定

- 文档默认使用中文。
- 页面整体视觉保持黑、冷灰、暖白、橙黄这套配色，不引入青色和渐变。
- 组件圆角保持 `4px`，避免发光、玻璃拟态和多余阴影。
- 按钮优先保持 outline 风格。
- 新增移动端交互时，优先保证触控面积和小屏可读性。

## 音频相关约定

- 单音节模式默认使用：
  - `public/gu.mp3`
  - `public/ga.mp3`

- 双音节模式默认使用：
  - `public/gugu.mp3`
  - `public/gaga.mp3`

- 合并音频下载目前输出为 `wav`，实现基于浏览器 `Web Audio API`。

## 统计

项目已接入 Umami：

```html
<script defer src="https://umami.runnable.run/script.js" data-website-id="7a70324e-4128-43f4-8a14-c17500ba5f7c"></script>
```

如需替换站点统计，请修改 `index.html`。

## 相关链接

- 在线地址：https://gugugaga.996.ninja/
- 源码仓库：https://github.com/MingGH/gugugaga-morse
- 主站：996忍者 https://996.ninja
- 博客：Asher的博客 https://www.runnable.run/about/

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 提交前检查

- 确认 `temp/` 未被提交
- 确认 `npm run build` 通过
- 确认移动端和桌面端主要页面可用
