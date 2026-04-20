# 魔方小课堂 - LayerCube

**一个交互式 3D 魔方网页应用，专为新手设计，使用层先法（Layer by Layer / Beginner Method）一步一步教学还原魔方。**

支持鼠标拖拽 / 移动端手指触摸操作魔方，一键打乱，实时提示下一步公式，并自动播放算法动画。


## ✨ 核心特性

- 🧊 **真实 3D 交互魔方**  
  使用 Three.js + React Three Fiber 实现，支持：
  - 鼠标拖拽旋转单层
  - 移动端触摸手势完美支持
  - 键盘快捷键（F/R/U/L/B/D + ' + 2）
  - 自由旋转视角

- 🔀 **一键打乱**  
  生成符合 WCA 标准的随机打乱序列（25-30 步），可调节难度。

- 📚 **层先法逐步教学**（严格按照七步法）
  1. 底面十字（White Cross）
  2. 底面角块还原
  3. 中层棱块还原
  4. 顶面十字
  5. 顶面角块方向（小鱼公式等）
  6. 顶面角块位置
  7. 顶面棱块位置

  系统会**自动检测当前步骤**，给出对应公式、图案案例和“下一步”按钮。

- 🎬 **动画演示**  
  点击公式即可看到平滑的 3D 执行动画，高亮对应面和块。

- 📱 **完全响应式**  
  PC + 移动端均可流畅使用，支持 PWA（可安装到手机主屏幕）。

- ⏱️ 额外功能  
  - 撤销 / 重做  
  - 还原计时器  
  - 公式库快速查看  
  - 当前进度条  
  - 生成分享链接（保存魔方状态）

## 🚀 快速开始

### 本地运行

```bash
git clone https://github.com/你的用户名/layercube.git
cd layercube

# 使用 pnpm / yarn / npm
pnpm install
# 或
yarn install
# 或
npm install

pnpm dev
# 打开 http://localhost:5173 （或对应端口）
```

### 技术栈

- **框架**：Next.js 15 / React 19 + TypeScript
- **3D 渲染**：Three.js + @react-three/fiber + @react-three/drei
- **动画**：GSAP / Three.js Tween
- **状态管理**：Zustand
- **样式**：Tailwind CSS + shadcn/ui
- **部署**：Vercel（推荐）

## 📖 使用说明

1. 打开网页后，你会看到一个已打乱的魔方。
2. 点击 **「打乱」** 可重新生成随机状态。
3. 切换到 **「教学模式」**，系统会自动判断当前处于层先法的哪一步。
4. 查看右侧面板的**当前步骤**和推荐公式。
5. 点击 **「执行下一步」** → 魔方会自动演示该公式（带缓动动画）。
6. 也可以自己手动拖拽魔方练习，系统会实时检测是否完成当前步骤。
7. 完成所有 7 步后，恭喜你！魔方已还原。

**提示**：初次使用建议跟着教学面板一步一步来，熟悉后可以关闭提示自己练习。

## 🛠 项目结构（主要目录）

```
src/
├── components/          # React 组件
│   ├── Cube/            # 3D 魔方核心组件
│   ├── TeachingPanel/   # 层先法教学面板
│   └── Controls/        # 按钮栏
├── lib/
│   ├── cube.ts          # 魔方状态模型与转动逻辑
│   └── solver/          # 层先法七步求解器（纯 JS 实现）
│       ├── whiteCross.ts
│       ├── whiteCorners.ts
│       └── ...
├── store/               # Zustand 全局状态
└── hooks/               # 自定义钩子（拖拽、动画等）
```

## 🤝 如何贡献

欢迎任何形式的贡献！包括但不限于：

- 优化 3D 拖拽体验
- 增加更多教学动画和语音讲解
- 支持 CFOP 速解模式（可选）
- 修复 Bug 或改进移动端手势
- 翻译多语言

Fork 本仓库 → 创建 Feature 分支 → 提交 Pull Request。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

## 🙏 致谢

- Three.js 社区及多个优秀的开源魔方项目（joews/rubik-js、irisxu02/rubik 等）
- 层先法教学资源（魔方小站、Bilibili 教程）
- 所有帮助测试的朋友

---

**喜欢这个项目？**  
欢迎点个 ⭐ Star 支持！  
有任何问题或建议，欢迎在 [Issues](https://github.com/你的用户名/layercube/issues) 中提出。

**一起让更多人轻松学会还原魔方！** 🧊✨
