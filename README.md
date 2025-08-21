# AIcapture

AIcapture 是一个用于屏幕捕获与 AI 处理的桌面应用（基于 Electron 的前端 + Python 后端），用于便捷地截取屏幕、发送到后端模型处理并将结果展示给用户。


## 主要功能

- 一键/区域截图

- 与后端 AI 服务交互（可自定义模型）

- 支持打包为 Windows 可执行安装包

- 可配置、易于扩展的前端与后端分离架构


## 快速开始（Windows / PowerShell）

1. 克隆仓库

```powershell
git clone https://github.com/<your-username>/AIcapture.git
cd AIcapture
```

1. 前端（Electron Capture 子项目）

```powershell
cd .\Capture
# 安装依赖（国内用户可用 cnpm 替换 npm）
npm install
# 开发模式
npm run dev
# 或者使用 nodemon 启动
npm run start
# 打包（需要 electron-builder）
npm run build
```

1. 后端（Python）

```powershell
cd ..\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# 如果有 requirements.txt：
pip install -r requirements.txt
# 启动后端服务
python main.py
```

请根据 `backend/chat.py` / `backend/main.py` 中的依赖自行安装。


## 运行逻辑

- 前端负责截屏、用户交互与界面展示。

- 前端通过本地或远程接口将截图/数据发送给后端。

- 后端负责调用模型（或代理到第三方模型）并返回处理结果。


## 配置

- 请查看 `Capture` 与 `backend` 目录下的配置文件或代码注释来设置 API 地址、模型参数及本地路径。

- 项目提供了一个示例环境变量文件 `.env.example`，用于说明需要配置的密钥与参数。请复制该文件为 `.env` 并填写实际值（不要将 `.env` 提交到公共仓库）：

```powershell
# 在项目根目录执行（PowerShell）
Copy-Item -Path .\.env.example -Destination .\.env -Force
notepad .\.env  # 或使用你喜欢的编辑器打开并填写
```

- 关键环境变量（至少需要填写以下项，按需调整）：
  - `OPENAI_API_KEY`：OpenAI / Deepseek API Key
  - `OPENAI_BASE_URL`：可选，自定义 API 基础 URL（例如 `https://api.deepseek.com`）
  - `VOLC_ARK_API_KEY`：火山引擎 Ark 的 API Key（用于视觉模型）
  - `VISION_MODEL`：火山引擎视觉模型 ID（默认示例：`doubao-1-5-vision-pro-32k-250115`）
  - `BACKEND_PORT`：后端服务监听端口（例如 `8080`，可选）

- 项目根目录已包含 `.gitignore`，默认会忽略 `.env`。请确保不要将含有密钥的 `.env` 推送到远程仓库；如果需要共享配置，可只提交不含真实密钥的 `.env.example`。


## 测试

- 前端：根据项目中是否包含测试框架运行对应命令（如有）。

- 后端：推荐使用 pytest 编写单元测试并运行 `pytest`。


## 贡献

- 欢迎贡献！请参阅 `CONTRIBUTING.md`，Fork 仓库 -> 新分支 -> 提交 PR。


## 许可证

本项目采用 MIT 许可证，详见 `LICENSE`。


## 联系方式

如需报告安全问题或其它重要事宜，请通过 GitHub Issues 或者在仓库中留下联系方式（请替换为你的邮箱）。
