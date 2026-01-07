import { Router } from 'express';
import { query, queryOne } from '../db/connection';
import { dataManager } from '../dataManager';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============ Stores (Stammdaten - Read Only from API) ============

router.get('/stores', async (req, res) => {
  try {
    const stores = await query('SELECT * FROM stores WHERE is_active = true ORDER BY name');
    res.json({ success: true, data: stores });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stores/:id', async (req, res) => {
  try {
    const store = await queryOne('SELECT * FROM stores WHERE id = $1', [req.params.id]);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    res.json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Articles (Stammdaten - Read Only from API) ============

router.get('/articles', async (req, res) => {
  try {
    const { product_group, season, brand } = req.query;
    let sql = 'SELECT * FROM articles WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (product_group) {
      sql += ` AND product_group = $${paramIndex++}`;
      params.push(product_group);
    }
    if (season) {
      sql += ` AND season = $${paramIndex++}`;
      params.push(season);
    }
    if (brand) {
      sql += ` AND brand = $${paramIndex++}`;
      params.push(brand);
    }
    sql += ' ORDER BY article_number';

    const articles = await query(sql, params);
    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Allocation Runs (Bewegungsdaten - Full CRUD) ============

router.get('/runs', async (req, res) => {
  try {
    const { type, status, user_name } = req.query;
    let sql = 'SELECT * FROM allocation_runs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (user_name) {
      sql += ` AND user_name = $${paramIndex++}`;
      params.push(user_name);
    }
    sql += ' ORDER BY start_date DESC';

    const runs = await query(sql, params);
    res.json({ success: true, data: runs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const run = await queryOne('SELECT * FROM allocation_runs WHERE id = $1', [req.params.id]);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/runs', async (req, res) => {
  try {
    const { type, status = 'planned', article_count = 0, store_count = 0, user_name, start_date } = req.body;
    const id = `RUN-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    await query(
      `INSERT INTO allocation_runs (id, type, status, article_count, store_count, user_name, start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, type, status, article_count, store_count, user_name, start_date || new Date()]
    );

    const run = await queryOne('SELECT * FROM allocation_runs WHERE id = $1', [id]);
    await dataManager.triggerWebhook('allocation_runs', 'created', run);
    
    res.status(201).json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/runs/:id', async (req, res) => {
  try {
    const { type, status, article_count, store_count, progress, end_date } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (type !== undefined) { updates.push(`type = $${paramIndex++}`); values.push(type); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (article_count !== undefined) { updates.push(`article_count = $${paramIndex++}`); values.push(article_count); }
    if (store_count !== undefined) { updates.push(`store_count = $${paramIndex++}`); values.push(store_count); }
    if (progress !== undefined) { updates.push(`progress = $${paramIndex++}`); values.push(progress); }
    if (end_date !== undefined) { updates.push(`end_date = $${paramIndex++}`); values.push(end_date); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id);
    await query(`UPDATE allocation_runs SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const run = await queryOne('SELECT * FROM allocation_runs WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('allocation_runs', 'updated', run);
    
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/runs/:id', async (req, res) => {
  try {
    const run = await queryOne('SELECT * FROM allocation_runs WHERE id = $1', [req.params.id]);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }
    
    await query('DELETE FROM allocation_runs WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('allocation_runs', 'deleted', run);
    
    res.json({ success: true, message: 'Run deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Scenarios (Bewegungsdaten - Full CRUD) ============

router.get('/scenarios', async (req, res) => {
  try {
    const { status, allocation_type } = req.query;
    let sql = 'SELECT * FROM scenarios WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (allocation_type) {
      sql += ` AND allocation_type = $${paramIndex++}`;
      params.push(allocation_type);
    }
    sql += ' ORDER BY updated_at DESC';

    const scenarios = await query(sql, params);
    res.json({ success: true, data: scenarios });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await queryOne('SELECT * FROM scenarios WHERE id = $1', [req.params.id]);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({ success: true, data: scenario });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scenarios', async (req, res) => {
  try {
    const { name, description, allocation_type, created_by, parameters } = req.body;
    const id = `scenario-${uuidv4().substring(0, 8)}`;
    
    await query(
      `INSERT INTO scenarios (id, name, description, allocation_type, created_by, parameters, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')`,
      [id, name, description, allocation_type, created_by, JSON.stringify(parameters || {})]
    );

    const scenario = await queryOne('SELECT * FROM scenarios WHERE id = $1', [id]);
    await dataManager.triggerWebhook('scenarios', 'created', scenario);
    
    res.status(201).json({ success: true, data: scenario });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/scenarios/:id', async (req, res) => {
  try {
    const { name, description, status, parameters, results } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (parameters !== undefined) { updates.push(`parameters = $${paramIndex++}`); values.push(JSON.stringify(parameters)); }
    if (results !== undefined) { updates.push(`results = $${paramIndex++}`); values.push(JSON.stringify(results)); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id);
    await query(`UPDATE scenarios SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const scenario = await queryOne('SELECT * FROM scenarios WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('scenarios', 'updated', scenario);
    
    res.json({ success: true, data: scenario });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await queryOne('SELECT * FROM scenarios WHERE id = $1', [req.params.id]);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    
    await query('DELETE FROM scenarios WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('scenarios', 'deleted', scenario);
    
    res.json({ success: true, message: 'Scenario deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Exceptions (Bewegungsdaten - Full CRUD) ============

router.get('/exceptions', async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    let sql = 'SELECT * FROM exceptions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (severity) {
      sql += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }
    if (type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC';

    const exceptions = await query(sql, params);
    res.json({ success: true, data: exceptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/exceptions', async (req, res) => {
  try {
    const { type, severity, title, description, store_id, article_id, run_id, recommended_action } = req.body;
    const id = `exc-${uuidv4().substring(0, 8)}`;
    
    await query(
      `INSERT INTO exceptions (id, type, severity, status, title, description, store_id, article_id, run_id, recommended_action)
       VALUES ($1, $2, $3, 'open', $4, $5, $6, $7, $8, $9)`,
      [id, type, severity, title, description, store_id || null, article_id || null, run_id || null, recommended_action || null]
    );

    const exception = await queryOne('SELECT * FROM exceptions WHERE id = $1', [id]);
    await dataManager.triggerWebhook('exceptions', 'created', exception);
    
    res.status(201).json({ success: true, data: exception });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/exceptions/:id', async (req, res) => {
  try {
    const { status, assigned_to, resolved_at } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${paramIndex++}`); values.push(assigned_to); }
    if (status === 'resolved') { updates.push(`resolved_at = $${paramIndex++}`); values.push(new Date()); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id);
    await query(`UPDATE exceptions SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const exception = await queryOne('SELECT * FROM exceptions WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('exceptions', 'updated', exception);
    
    res.json({ success: true, data: exception });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Tasks (Bewegungsdaten - Full CRUD) ============

router.get('/tasks', async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (assigned_to) {
      sql += ` AND assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }
    sql += ' ORDER BY due_date ASC';

    const tasks = await query(sql, params);
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, description, type, priority, assigned_to, due_date, related_run_id, related_scenario_id } = req.body;
    const id = `task-${uuidv4().substring(0, 8)}`;
    
    await query(
      `INSERT INTO tasks (id, title, description, type, status, priority, assigned_to, due_date, related_run_id, related_scenario_id)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)`,
      [id, title, description, type, priority || 'medium', assigned_to, due_date, related_run_id || null, related_scenario_id || null]
    );

    const task = await queryOne('SELECT * FROM tasks WHERE id = $1', [id]);
    await dataManager.triggerWebhook('tasks', 'created', task);
    
    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date, completed_at } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (priority !== undefined) { updates.push(`priority = $${paramIndex++}`); values.push(priority); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${paramIndex++}`); values.push(assigned_to); }
    if (due_date !== undefined) { updates.push(`due_date = $${paramIndex++}`); values.push(due_date); }
    if (status === 'completed') { updates.push(`completed_at = $${paramIndex++}`); values.push(new Date()); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id);
    await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const task = await queryOne('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    await dataManager.triggerWebhook('tasks', 'updated', task);
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Parameters ============

router.get('/parameters', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM allocation_parameters WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = $1';
      params.push(category);
    }
    sql += ' ORDER BY category, name';

    const parameters = await query(sql, params);
    res.json({ success: true, data: parameters });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/parameters/:id', async (req, res) => {
  try {
    const { value, updated_by } = req.body;
    
    await query(
      'UPDATE allocation_parameters SET value = $1, updated_by = $2 WHERE id = $3',
      [String(value), updated_by || 'System', req.params.id]
    );

    const parameter = await queryOne('SELECT * FROM allocation_parameters WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: parameter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ KPIs / Dashboard ============

router.get('/kpis', async (req, res) => {
  try {
    const [
      openTasks,
      activeRuns,
      openExceptions,
      approvedScenarios,
      totalStores,
      totalArticles
    ] = await Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'in_progress')`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM allocation_runs WHERE status IN ('running', 'planned')`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM exceptions WHERE status IN ('open', 'in_progress')`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM scenarios WHERE status = 'approved'`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM stores WHERE is_active = true`),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM articles`)
    ]);

    res.json({
      success: true,
      data: {
        openTasks: parseInt(openTasks?.count || '0'),
        activeRuns: parseInt(activeRuns?.count || '0'),
        openExceptions: parseInt(openExceptions?.count || '0'),
        approvedScenarios: parseInt(approvedScenarios?.count || '0'),
        totalStores: parseInt(totalStores?.count || '0'),
        totalArticles: parseInt(totalArticles?.count || '0')
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Data Manager Config ============

router.get('/data-manager/config', async (req, res) => {
  try {
    const configs = await dataManager.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/data-manager/config/:entityName', async (req, res) => {
  try {
    const config = await dataManager.updateConfig(req.params.entityName, req.body);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/data-manager/logs/:entityName', async (req, res) => {
  try {
    const config = await dataManager.getConfig(req.params.entityName);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }
    const logs = await dataManager.getSyncLogs(config.id);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Import/Export Endpoints ============

router.post('/data-manager/import/:entityName', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const result = await dataManager.importData(req.params.entityName, req.body.data, apiKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/data-manager/export/:entityName', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const result = await dataManager.exportData(req.params.entityName, req.query as Record<string, any>, apiKey);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Database Status & Management ============

router.get('/db/status', async (req, res) => {
  try {
    // Test database connection
    const dbTest = await query('SELECT NOW() as time, current_database() as database');
    
    // Get table row counts
    const tables = ['stores', 'articles', 'allocation_runs', 'scenarios', 'exceptions', 'tasks', 'allocation_parameters'];
    const tableCounts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = parseInt(result[0]?.count || '0');
      } catch {
        tableCounts[table] = -1; // Table doesn't exist
      }
    }
    
    res.json({
      success: true,
      data: {
        connected: true,
        database: dbTest[0]?.database,
        serverTime: dbTest[0]?.time,
        tables: tableCounts,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      data: {
        connected: false,
        error: error.message
      }
    });
  }
});

router.post('/db/seed', async (req, res) => {
  try {
    // Re-run seed script
    const { execSync } = require('child_process');
    execSync('node dist/db/seed.js', { cwd: process.cwd() });
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/db/truncate/:table', async (req, res) => {
  const allowedTables = ['allocation_runs', 'scenarios', 'exceptions', 'tasks'];
  const table = req.params.table;
  
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ success: false, error: 'Table not allowed for truncation' });
  }
  
  try {
    await query(`DELETE FROM ${table}`);
    res.json({ success: true, message: `Table ${table} cleared` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
