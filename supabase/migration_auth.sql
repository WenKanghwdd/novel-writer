-- ============================================================
-- 迁移：从单用户硬编码 → Supabase Auth 多用户
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 删除旧的 RLS 策略
DROP POLICY IF EXISTS "允许所有操作（开发模式）" ON projects;
DROP POLICY IF EXISTS "允许所有操作（开发模式）" ON chapters;
DROP POLICY IF EXISTS "允许所有操作（开发模式）" ON characters;
DROP POLICY IF EXISTS "允许所有操作（开发模式）" ON world_settings;

-- 2. 添加基于 auth.uid() 的新策略（user_id 保持 TEXT 类型）
CREATE POLICY "用户只能操作自己的项目" ON projects
  FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "用户只能操作自己项目的章节" ON chapters
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  ) WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "用户只能操作自己项目的角色" ON characters
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  ) WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "用户只能操作自己项目的世界观" ON world_settings
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  ) WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text)
  );

-- 3.（可选）迁移旧数据到新用户
-- 注册后用下面的 SQL 把旧数据绑定到你的账号
-- UPDATE projects SET user_id = '你的auth UID字符串' WHERE user_id = 'local-dev-user';
