import { pool } from './connection';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Seed Stores (Stammdaten)
    const stores = [
      { id: 'store-zh-hb', name: 'Zürich HB', description: 'Hauptbahnhof Zürich', cluster: 'Urban Premium', region: 'Zürich', address: 'Bahnhofplatz 15, 8001 Zürich', total_capacity: 500 },
      { id: 'store-bs-sbb', name: 'Basel SBB', description: 'Basel Bahnhof SBB', cluster: 'Urban Standard', region: 'Basel', address: 'Centralbahnplatz 1, 4051 Basel', total_capacity: 400 },
      { id: 'store-be-bhf', name: 'Bern Bahnhof', description: 'Bern Hauptbahnhof', cluster: 'Regional', region: 'Bern', address: 'Bahnhofplatz 10, 3011 Bern', total_capacity: 350 },
      { id: 'store-lu', name: 'Luzern', description: 'Luzern Bahnhofstrasse', cluster: 'Regional', region: 'Zentralschweiz', address: 'Bahnhofstrasse 5, 6003 Luzern', total_capacity: 300 },
      { id: 'store-ge', name: 'Genf', description: 'Genève Centre', cluster: 'Urban Premium', region: 'Romandie', address: 'Rue du Mont-Blanc 22, 1201 Genève', total_capacity: 450 },
      { id: 'store-ls', name: 'Lausanne', description: 'Lausanne Gare', cluster: 'Urban Standard', region: 'Romandie', address: 'Place de la Gare 9, 1003 Lausanne', total_capacity: 380 },
      { id: 'store-sg', name: 'St. Gallen', description: 'St. Gallen Zentrum', cluster: 'Regional', region: 'Ostschweiz', address: 'Multergasse 15, 9000 St. Gallen', total_capacity: 280 },
      { id: 'store-wi', name: 'Winterthur', description: 'Winterthur Altstadt', cluster: 'Regional', region: 'Zürich', address: 'Marktgasse 25, 8400 Winterthur', total_capacity: 260 },
    ];

    for (const store of stores) {
      await pool.query(`
        INSERT INTO stores (id, name, description, cluster, region, address, total_capacity)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          cluster = EXCLUDED.cluster,
          region = EXCLUDED.region,
          address = EXCLUDED.address,
          total_capacity = EXCLUDED.total_capacity
      `, [store.id, store.name, store.description, store.cluster, store.region, store.address, store.total_capacity]);
    }
    console.log('Stores seeded');

    // Seed Articles (Stammdaten)
    const articles = [
      { id: 'art-001', article_number: 'SP-RUN-001', description: 'Running Shoes Pro', color: 'Black', color_hex: '#000000', brand: 'Nike', product_group: 'Shoes', purchase_area: 'Sport & Outdoor', season: 'HW 2025', price: 149.90 },
      { id: 'art-002', article_number: 'SP-HIK-002', description: 'Hiking Boots', color: 'Brown', color_hex: '#8B4513', brand: 'Salomon', product_group: 'Shoes', purchase_area: 'Sport & Outdoor', season: 'HW 2025', price: 189.90 },
      { id: 'art-003', article_number: 'AP-WIN-004', description: 'Winter Jacket', color: 'Navy', color_hex: '#000080', brand: 'The North Face', product_group: 'Apparel', purchase_area: 'Sport & Outdoor', season: 'HW 2025', price: 299.90 },
      { id: 'art-004', article_number: 'AP-FLE-005', description: 'Fleece Pullover', color: 'Grey', color_hex: '#808080', brand: 'Patagonia', product_group: 'Apparel', purchase_area: 'Sport & Outdoor', season: 'HW 2025', price: 129.90 },
      { id: 'art-005', article_number: 'AC-BAC-008', description: 'Backpack', color: 'Green', color_hex: '#228B22', brand: 'Deuter', product_group: 'Accessories', purchase_area: 'Sport & Outdoor', season: 'NOS', price: 89.90 },
    ];

    for (const article of articles) {
      await pool.query(`
        INSERT INTO articles (id, article_number, description, color, color_hex, brand, product_group, purchase_area, season, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          article_number = EXCLUDED.article_number,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          color_hex = EXCLUDED.color_hex,
          brand = EXCLUDED.brand,
          product_group = EXCLUDED.product_group,
          purchase_area = EXCLUDED.purchase_area,
          season = EXCLUDED.season,
          price = EXCLUDED.price
      `, [article.id, article.article_number, article.description, article.color, article.color_hex, article.brand, article.product_group, article.purchase_area, article.season, article.price]);
    }
    console.log('Articles seeded');

    // Seed Allocation Runs (Bewegungsdaten)
    const runs = [
      { id: 'RUN-2025-001', type: 'initial', status: 'completed', start_date: '2025-01-06T09:00:00Z', end_date: '2025-01-06T11:30:00Z', article_count: 156, store_count: 8, user_name: 'M. Weber' },
      { id: 'RUN-2025-002', type: 'replenishment', status: 'completed', start_date: '2025-01-05T14:00:00Z', end_date: '2025-01-05T15:30:00Z', article_count: 89, store_count: 6, user_name: 'S. Müller' },
      { id: 'RUN-2025-003', type: 'manual', status: 'with_exceptions', start_date: '2025-01-04T10:00:00Z', end_date: '2025-01-04T12:00:00Z', article_count: 45, store_count: 4, user_name: 'A. Schmidt' },
      { id: 'RUN-2025-004', type: 'initial', status: 'running', start_date: '2025-01-07T08:00:00Z', end_date: null, article_count: 203, store_count: 8, progress: 65, user_name: 'M. Weber' },
      { id: 'RUN-2025-005', type: 'replenishment', status: 'planned', start_date: '2025-01-08T09:00:00Z', end_date: null, article_count: 120, store_count: 8, user_name: 'T. Fischer' },
    ];

    for (const run of runs) {
      await pool.query(`
        INSERT INTO allocation_runs (id, type, status, start_date, end_date, article_count, store_count, progress, user_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          article_count = EXCLUDED.article_count,
          store_count = EXCLUDED.store_count,
          progress = EXCLUDED.progress,
          user_name = EXCLUDED.user_name
      `, [run.id, run.type, run.status, run.start_date, run.end_date, run.article_count, run.store_count, run.progress || null, run.user_name]);
    }
    console.log('Allocation Runs seeded');

    // Seed Scenarios (Bewegungsdaten)
    const scenarios = [
      {
        id: 'scenario-001',
        name: 'Standard Allokation HW 2025',
        description: 'Standardszenario für die Herbst/Winter Saison 2025',
        status: 'approved',
        allocation_type: 'initial',
        created_by: 'M. Weber',
        parameters: { forecast_weight: 0.6, historical_weight: 0.4, safety_stock_factor: 1.2, min_allocation_qty: 5, max_allocation_qty: 100 },
        results: { total_allocated: 15420, stores_covered: 8, expected_fill_rate: 94.5, capacity_utilization: 87.2, exceptions: 3 }
      },
      {
        id: 'scenario-002',
        name: 'Optimiert - Hohe Prognosegewichtung',
        description: 'Szenario mit erhöhter Gewichtung der Absatzprognose',
        status: 'simulated',
        allocation_type: 'initial',
        created_by: 'S. Müller',
        parameters: { forecast_weight: 0.8, historical_weight: 0.2, safety_stock_factor: 1.1, min_allocation_qty: 3, max_allocation_qty: 120 },
        results: { total_allocated: 16800, stores_covered: 8, expected_fill_rate: 96.2, capacity_utilization: 91.5, exceptions: 5 }
      },
      {
        id: 'scenario-003',
        name: 'NOS Nachschub - Standard',
        description: 'Standardszenario für Never-out-of-Stock Nachschub',
        status: 'approved',
        allocation_type: 'replenishment',
        created_by: 'T. Fischer',
        parameters: { forecast_weight: 0.5, historical_weight: 0.5, safety_stock_factor: 1.5, min_allocation_qty: 10, max_allocation_qty: 50 },
        results: { total_allocated: 8500, stores_covered: 8, expected_fill_rate: 98.1, capacity_utilization: 72.3, exceptions: 1 }
      },
    ];

    for (const scenario of scenarios) {
      await pool.query(`
        INSERT INTO scenarios (id, name, description, status, allocation_type, created_by, parameters, results)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          allocation_type = EXCLUDED.allocation_type,
          created_by = EXCLUDED.created_by,
          parameters = EXCLUDED.parameters,
          results = EXCLUDED.results
      `, [scenario.id, scenario.name, scenario.description, scenario.status, scenario.allocation_type, scenario.created_by, JSON.stringify(scenario.parameters), scenario.results ? JSON.stringify(scenario.results) : null]);
    }
    console.log('Scenarios seeded');

    // Seed Exceptions (Bewegungsdaten)
    const exceptions = [
      { id: 'exc-001', type: 'capacity', severity: 'critical', status: 'open', title: 'Kapazitätsüberschreitung Zürich HB', description: 'Die geplante Allokation überschreitet die verfügbare Kapazität um 15%', store_id: 'store-zh-hb', run_id: 'RUN-2025-003', recommended_action: 'Allokationsmenge reduzieren oder auf andere Filialen verteilen' },
      { id: 'exc-002', type: 'stock', severity: 'critical', status: 'in_progress', title: 'Niedriger Lagerbestand Running Shoes', description: 'Der zentrale Lagerbestand reicht nicht für alle geplanten Allokationen', article_id: 'art-001', assigned_to: 'S. Müller', recommended_action: 'Nachbestellung prüfen oder Allokation priorisieren' },
      { id: 'exc-003', type: 'forecast', severity: 'info', status: 'open', title: 'Prognoseabweichung Basel SBB', description: 'Die Ist-Verkäufe weichen um mehr als 20% von der Prognose ab', store_id: 'store-bs-sbb', recommended_action: 'Prognosemodell überprüfen' },
      { id: 'exc-004', type: 'manual', severity: 'blocking', status: 'open', title: 'Dringende Nachlieferung Winterjacken', description: 'Kundenanfrage für Sonderlieferung aufgrund hoher Nachfrage', store_id: 'store-ge', article_id: 'art-003', recommended_action: 'Express-Lieferung veranlassen' },
    ];

    for (const exc of exceptions) {
      await pool.query(`
        INSERT INTO exceptions (id, type, severity, status, title, description, store_id, article_id, run_id, assigned_to, recommended_action)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          severity = EXCLUDED.severity,
          status = EXCLUDED.status,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          store_id = EXCLUDED.store_id,
          article_id = EXCLUDED.article_id,
          run_id = EXCLUDED.run_id,
          assigned_to = EXCLUDED.assigned_to,
          recommended_action = EXCLUDED.recommended_action
      `, [exc.id, exc.type, exc.severity, exc.status, exc.title, exc.description, exc.store_id || null, exc.article_id || null, exc.run_id || null, exc.assigned_to || null, exc.recommended_action]);
    }
    console.log('Exceptions seeded');

    // Seed Tasks (Bewegungsdaten)
    const tasks = [
      { id: 'task-001', title: 'HW 2025 Allokation prüfen', description: 'Überprüfung der initialen Allokation für die Herbst/Winter Saison', type: 'review', status: 'in_progress', priority: 'high', assigned_to: 'M. Weber', due_date: '2025-01-10', related_scenario_id: 'scenario-001' },
      { id: 'task-002', title: 'Exception Zürich HB bearbeiten', description: 'Kapazitätsüberschreitung in Zürich HB lösen', type: 'exception', status: 'pending', priority: 'urgent', assigned_to: 'S. Müller', due_date: '2025-01-08', related_run_id: 'RUN-2025-003' },
      { id: 'task-003', title: 'Nachschub-Szenario freigeben', description: 'NOS Nachschub Szenario zur Produktion freigeben', type: 'approval', status: 'pending', priority: 'medium', assigned_to: 'A. Schmidt', due_date: '2025-01-09', related_scenario_id: 'scenario-003' },
      { id: 'task-004', title: 'Prognose-Parameter optimieren', description: 'Forecast-Gewichtung basierend auf Q4 Ergebnissen anpassen', type: 'allocation', status: 'pending', priority: 'medium', assigned_to: 'M. Weber', due_date: '2025-01-12' },
    ];

    for (const task of tasks) {
      await pool.query(`
        INSERT INTO tasks (id, title, description, type, status, priority, assigned_to, due_date, related_run_id, related_scenario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          assigned_to = EXCLUDED.assigned_to,
          due_date = EXCLUDED.due_date,
          related_run_id = EXCLUDED.related_run_id,
          related_scenario_id = EXCLUDED.related_scenario_id
      `, [task.id, task.title, task.description, task.type, task.status, task.priority, task.assigned_to, task.due_date, task.related_run_id || null, task.related_scenario_id || null]);
    }
    console.log('Tasks seeded');

    // Seed Parameters
    const parameters = [
      { id: 'param-001', category: 'capacity', name: 'Standard Kapazitätsfaktor', key: 'capacity_factor', value: '1.0', unit: 'Faktor', description: 'Multiplikator für die Basiskapazität' },
      { id: 'param-002', category: 'capacity', name: 'Maximale Auslastung', key: 'max_utilization', value: '95', unit: '%', description: 'Maximale erlaubte Kapazitätsauslastung' },
      { id: 'param-003', category: 'presentation', name: 'Mindest-Präsentationsmenge', key: 'min_presentation', value: '3', unit: 'Stück', description: 'Minimale Anzahl pro Größe auf der Fläche' },
      { id: 'param-004', category: 'control', name: 'Prognose-Horizont', key: 'forecast_horizon', value: '8', unit: 'Wochen', description: 'Zeitraum für Absatzprognose' },
      { id: 'param-005', category: 'control', name: 'Sicherheitsbestand-Tage', key: 'safety_stock_days', value: '14', unit: 'Tage', description: 'Puffer für Nachschub-Verzögerungen' },
    ];

    for (const param of parameters) {
      await pool.query(`
        INSERT INTO allocation_parameters (id, category, name, key, value, unit, description, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'System')
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          name = EXCLUDED.name,
          key = EXCLUDED.key,
          value = EXCLUDED.value,
          unit = EXCLUDED.unit,
          description = EXCLUDED.description
      `, [param.id, param.category, param.name, param.key, param.value, param.unit, param.description]);
    }
    console.log('Parameters seeded');

    // Seed Data Manager Config
    const configs = [
      { id: 'config-stores', entity_name: 'stores', data_category: 'master', inbound_enabled: true, outbound_enabled: false },
      { id: 'config-articles', entity_name: 'articles', data_category: 'master', inbound_enabled: true, outbound_enabled: false },
      { id: 'config-runs', entity_name: 'allocation_runs', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true },
      { id: 'config-scenarios', entity_name: 'scenarios', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true },
      { id: 'config-exceptions', entity_name: 'exceptions', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true },
      { id: 'config-tasks', entity_name: 'tasks', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true },
    ];

    for (const config of configs) {
      await pool.query(`
        INSERT INTO data_manager_config (id, entity_name, data_category, inbound_enabled, outbound_enabled)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          entity_name = EXCLUDED.entity_name,
          data_category = EXCLUDED.data_category,
          inbound_enabled = EXCLUDED.inbound_enabled,
          outbound_enabled = EXCLUDED.outbound_enabled
      `, [config.id, config.entity_name, config.data_category, config.inbound_enabled, config.outbound_enabled]);
    }
    console.log('Data Manager Config seeded');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
