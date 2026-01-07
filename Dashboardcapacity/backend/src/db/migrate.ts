import { pool } from './connection';

const createTables = `
-- ============ STAMMDATEN (Master Data) Tables ============

CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cluster VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  address TEXT,
  total_capacity DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(50) PRIMARY KEY,
  article_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(50),
  color_hex VARCHAR(10),
  brand VARCHAR(100),
  product_group VARCHAR(100),
  purchase_area VARCHAR(100),
  season VARCHAR(50),
  size_range TEXT[], -- Array of sizes
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_hierarchy (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(50) NOT NULL,
  parent_id VARCHAR(50) REFERENCES product_hierarchy(id),
  path TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ BEWEGUNGSDATEN (Transaction Data) Tables ============

CREATE TABLE IF NOT EXISTS allocation_runs (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  article_count INTEGER DEFAULT 0,
  store_count INTEGER DEFAULT 0,
  progress INTEGER,
  user_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenarios (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  allocation_type VARCHAR(20) NOT NULL,
  created_by VARCHAR(100),
  parameters JSONB,
  results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exceptions (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  store_id VARCHAR(50) REFERENCES stores(id),
  article_id VARCHAR(50) REFERENCES articles(id),
  run_id VARCHAR(50) REFERENCES allocation_runs(id),
  assigned_to VARCHAR(100),
  recommended_action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_to VARCHAR(100),
  due_date DATE,
  related_run_id VARCHAR(50) REFERENCES allocation_runs(id),
  related_scenario_id VARCHAR(50) REFERENCES scenarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allocation_parameters (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  unit VARCHAR(20),
  description TEXT,
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  hierarchy_level VARCHAR(50),
  hierarchy_id VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS capacity_data (
  id VARCHAR(50) PRIMARY KEY,
  store_id VARCHAR(50) REFERENCES stores(id),
  article_id VARCHAR(50) REFERENCES articles(id),
  season VARCHAR(50),
  allocation_type VARCHAR(20),
  total_capacity DECIMAL(10,2),
  actual_capacity DECIMAL(10,2),
  target_capacity DECIMAL(10,2),
  forecast_suggestion DECIMAL(10,2),
  inventory INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, article_id, season, allocation_type)
);

-- ============ Data Manager Configuration Tables ============

CREATE TABLE IF NOT EXISTS data_manager_config (
  id VARCHAR(50) PRIMARY KEY,
  entity_name VARCHAR(100) NOT NULL UNIQUE,
  data_category VARCHAR(20) NOT NULL, -- 'master' or 'transaction'
  inbound_enabled BOOLEAN DEFAULT false,
  outbound_enabled BOOLEAN DEFAULT false,
  api_key VARCHAR(255),
  webhook_url TEXT,
  sync_interval_minutes INTEGER,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id VARCHAR(50) PRIMARY KEY,
  config_id VARCHAR(50) REFERENCES data_manager_config(id),
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============ Indexes ============

CREATE INDEX IF NOT EXISTS idx_allocation_runs_status ON allocation_runs(status);
CREATE INDEX IF NOT EXISTS idx_allocation_runs_type ON allocation_runs(type);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_severity ON exceptions(severity);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_capacity_data_store ON capacity_data(store_id);
CREATE INDEX IF NOT EXISTS idx_capacity_data_article ON capacity_data(article_id);

-- ============ Updated_at Trigger Function ============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['stores', 'articles', 'allocation_runs', 'scenarios', 'allocation_parameters', 'capacity_data', 'data_manager_config'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;
`;

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    await pool.query(createTables);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
