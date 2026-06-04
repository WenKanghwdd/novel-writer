# 📖 Novel Writer — 小说写作管理工具

一个运行在浏览器中的个人小说写作管理工具，数据存储在 Supabase 云端。

## 技术栈

- **Vue 3** (Composition API) + **Vite** — 前端框架
- **Naive UI** — UI 组件库
- **Vditor** — Markdown 编辑器（所见即所得/即时渲染双栏模式）
- **Supabase** — 云端数据库（PostgreSQL）
- **Pinia** — 状态管理
- **Vue Router** — 路由

## 功能

- ✅ 项目管理（新建/重命名/删除）
- ✅ Markdown 写作编辑器（自动保存）
- ✅ 章节管理（新增/切换/删除）
- ✅ AI 助手侧边栏（嵌入 DeepSeek 网页版）
- ✅ 数据云端存储（多设备同步）

## 本地运行

### 1. 配置 Supabase

1. 注册 [Supabase](https://supabase.com) 并创建项目
2. 在 Supabase 控制台 **SQL Editor** 中执行 `supabase/schema.sql`
3. 从 **Project Settings → API** 获取 `URL` 和 `anon key`

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Supabase URL 和 anon key：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 安装依赖并运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview
```

### 4. 使用

1. 浏览器打开 `http://localhost:5173`
2. 点击「新建项目」创建第一个小说项目
3. 点击项目卡片进入写作界面
4. 使用左侧目录管理章节
5. 在中间编辑器中写作（自动保存）
6. 点击「AI 助手」展开右侧 DeepSeek 侧边栏

## 项目结构

```
novel-writer/
├── index.html              # HTML 入口
├── vite.config.js          # Vite 配置
├── package.json            # 依赖管理
├── .env                    # 环境变量（不提交到 Git）
├── .env.example            # 环境变量示例
├── supabase/
│   └── schema.sql          # Supabase 建表 SQL
├── src/
│   ├── main.js             # Vue 应用入口
│   ├── App.vue             # 根组件
│   ├── lib/
│   │   └── supabase.js     # Supabase SDK + API 封装
│   ├── router/
│   │   └── index.js        # 路由配置
│   ├── stores/
│   │   └── project.js      # Pinia store（项目管理状态）
│   ├── views/
│   │   ├── ProjectList.vue # 项目列表页
│   │   └── Writer.vue      # 写作编辑页（三栏布局）
│   ├── components/
│   │   ├── ChapterTree.vue  # 章节目录树
│   │   └── DeepSeekSidebar.vue # AI 助手侧边栏
│   └── styles/
│       └── main.css        # 全局样式
└── README.md
```

## 部署

```bash
npm run build
```

`dist/` 目录包含所有静态文件，可部署到：

- **GitHub Pages** (`gh-pages` 分支)
- **Vercel** / **Netlify**（选择 Vue 预设即可）
- **任意静态服务器**（Nginx, Caddy 等）

## 数据库表

| 表名 | 用途 | MVP 实现 |
|------|------|----------|
| `projects` | 小说项目 | ✅ |
| `chapters` | 章节/场景 | ✅ |
| `characters` | 角色管理 | ⏳ 预留 |
| `world_settings` | 世界观设定 | ⏳ 预留 |

## 自动保存

编辑器输入后 **10 秒无操作**自动保存到 Supabase。保存状态在顶部导航栏实时显示：
- 🟢 已保存
- 🟡 未保存
- 🔵 保存中...
- 🔴 保存失败

## License

MIT
