-- Create goals table for hierarchical goal management
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure due date is after start date if both are provided
  CONSTRAINT valid_date_range CHECK (
    (start_date IS NULL OR due_date IS NULL) OR 
    (due_date >= start_date)
  ),
  
  -- Ensure parent_id is not the same as id (prevent self-reference)
  CONSTRAINT no_self_reference CHECK (parent_id IS DISTINCT FROM id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent_id ON goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_level ON goals(level);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON goals(category_id);
CREATE INDEX IF NOT EXISTS idx_goals_due_date ON goals(due_date);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_goal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_goal_updated_at();

-- Function to validate goal hierarchy levels
CREATE OR REPLACE FUNCTION validate_goal_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  -- If no parent, must be level 1
  IF NEW.parent_id IS NULL THEN
    IF NEW.level != 1 THEN
      RAISE EXCEPTION 'Root goals must be level 1';
    END IF;
  ELSE
    -- Get parent's level
    SELECT level INTO parent_level FROM goals WHERE id = NEW.parent_id;
    
    -- Child level must be parent level + 1
    IF NEW.level != parent_level + 1 THEN
      RAISE EXCEPTION 'Child goal level must be exactly one greater than parent level';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to validate hierarchy
CREATE TRIGGER validate_goal_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION validate_goal_hierarchy();

-- Function to calculate parent goal progress based on children
CREATE OR REPLACE FUNCTION calculate_parent_goal_progress(parent_goal_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_progress DECIMAL;
BEGIN
  SELECT AVG(progress) INTO avg_progress
  FROM goals
  WHERE parent_id = parent_goal_id
  AND status = 'active';
  
  RETURN COALESCE(avg_progress, 0);
END;
$$ language 'plpgsql';

-- Function to update parent progress when child changes
CREATE OR REPLACE FUNCTION update_parent_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  parent_progress DECIMAL;
BEGIN
  -- Only update if there's a parent and progress changed
  IF (OLD IS NULL OR NEW.progress != OLD.progress OR NEW.status != OLD.status) 
     AND NEW.parent_id IS NOT NULL THEN
    
    -- Calculate new parent progress
    parent_progress := calculate_parent_goal_progress(NEW.parent_id);
    
    -- Update parent's progress
    UPDATE goals 
    SET progress = parent_progress,
        status = CASE 
          WHEN parent_progress = 100 THEN 'completed'
          WHEN status = 'completed' AND parent_progress < 100 THEN 'active'
          ELSE status
        END,
        completed_at = CASE 
          WHEN parent_progress = 100 AND completed_at IS NULL THEN NOW()
          WHEN parent_progress < 100 THEN NULL
          ELSE completed_at
        END
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update parent progress
CREATE TRIGGER update_parent_progress_trigger
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_parent_goal_progress();

-- Create a view for goal hierarchy with path
CREATE OR REPLACE VIEW goal_hierarchy AS
WITH RECURSIVE goal_tree AS (
  -- Base case: root goals (level 1)
  SELECT 
    id,
    title,
    description,
    parent_id,
    level,
    progress,
    status,
    start_date,
    due_date,
    category_id,
    user_id,
    created_at,
    updated_at,
    ARRAY[title::VARCHAR] as path,
    ARRAY[id] as id_path,
    0 as depth
  FROM goals
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child goals
  SELECT 
    g.id,
    g.title,
    g.description,
    g.parent_id,
    g.level,
    g.progress,
    g.status,
    g.start_date,
    g.due_date,
    g.category_id,
    g.user_id,
    g.created_at,
    g.updated_at,
    gt.path || g.title::VARCHAR as path,
    gt.id_path || g.id as id_path,
    gt.depth + 1 as depth
  FROM goals g
  JOIN goal_tree gt ON g.parent_id = gt.id
)
SELECT * FROM goal_tree;