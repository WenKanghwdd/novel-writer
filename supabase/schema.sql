-- ============================================================
-- Novel Writer — Supabase 数据库建表 SQL
-- 在 Supabase 控制台 SQL Editor 中执行
-- ============================================================

-- ----------------------------
-- 1. 小说项目表
-- ----------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'local-dev-user',   -- 暂不实现多用户
  title       TEXT NOT NULL,
  synopsis    TEXT DEFAULT '',                          -- 故事简介
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------
-- 2. 章节/场景表（支持多级目录）
-- ----------------------------
CREATE TABLE IF NOT EXISTS chapters (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES chapters(id) ON DELETE CASCADE,  -- 父章节，null=根级
  title       TEXT NOT NULL DEFAULT '未命名章节',
  content     TEXT DEFAULT '',                          -- Markdown 正文
  order_index INTEGER NOT NULL DEFAULT 0,               -- 排序索引
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------
-- 3. 角色表（预留，MVP 暂不实现 UI）
-- ----------------------------
CREATE TABLE IF NOT EXISTS characters (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  attributes  JSONB DEFAULT '{}'::jsonb,               -- 自定义属性
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------
-- 4. 世界观设定表（预留）
-- ----------------------------
CREATE TABLE IF NOT EXISTS world_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,                            -- 如"地理""势力""时间线"
  content     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------
-- 索引：按项目查章节
-- ----------------------------
CREATE INDEX idx_chapters_project ON chapters(project_id, order_index);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_world_settings_project ON world_settings(project_id);

-- ----------------------------
-- 自动更新 updated_at 触发器
-- ----------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_world_settings_updated_at
  BEFORE UPDATE ON world_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------
-- 安全：禁用 RLS（单用户本地开发用）
-- 如果将来需要多用户，启用 RLS 并添加策略：
--   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "用户只能看到自己的项目"
--     ON projects FOR ALL
--     USING (user_id = auth.uid());
-- ----------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_settings ENABLE ROW LEVEL SECURITY;

-- 单用户模式：允许所有用户操作（因为我们都用 local-dev-user）
CREATE POLICY "允许所有操作（开发模式）" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "允许所有操作（开发模式）" ON chapters
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "允许所有操作（开发模式）" ON characters
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "允许所有操作（开发模式）" ON world_settings
  FOR ALL USING (true) WITH CHECK (true);
