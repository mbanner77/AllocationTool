// Data Manager Layer - Configurable interfaces for Stammdaten and Bewegungsdaten
import { query, queryOne } from '../db/connection';
import { v4 as uuidv4 } from 'uuid';
import type { DataManagerConfig, SyncLog, ApiResponse } from '../types';

export class DataManager {
  
  // ============ Configuration Management ============
  
  async getConfig(entityName: string): Promise<DataManagerConfig | null> {
    return queryOne<DataManagerConfig>(
      'SELECT * FROM data_manager_config WHERE entity_name = $1',
      [entityName]
    );
  }

  async getAllConfigs(): Promise<DataManagerConfig[]> {
    return query<DataManagerConfig>('SELECT * FROM data_manager_config ORDER BY entity_name');
  }

  async updateConfig(entityName: string, updates: Partial<DataManagerConfig>): Promise<DataManagerConfig | null> {
    const config = await this.getConfig(entityName);
    if (!config) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.inbound_enabled !== undefined) {
      fields.push(`inbound_enabled = $${paramIndex++}`);
      values.push(updates.inbound_enabled);
    }
    if (updates.outbound_enabled !== undefined) {
      fields.push(`outbound_enabled = $${paramIndex++}`);
      values.push(updates.outbound_enabled);
    }
    if (updates.api_key !== undefined) {
      fields.push(`api_key = $${paramIndex++}`);
      values.push(updates.api_key);
    }
    if (updates.webhook_url !== undefined) {
      fields.push(`webhook_url = $${paramIndex++}`);
      values.push(updates.webhook_url);
    }
    if (updates.sync_interval_minutes !== undefined) {
      fields.push(`sync_interval_minutes = $${paramIndex++}`);
      values.push(updates.sync_interval_minutes);
    }

    if (fields.length === 0) return config;

    values.push(entityName);
    await query(
      `UPDATE data_manager_config SET ${fields.join(', ')} WHERE entity_name = $${paramIndex}`,
      values
    );

    return this.getConfig(entityName);
  }

  // ============ Data Access Control ============

  async canRead(entityName: string, direction: 'inbound' | 'outbound'): Promise<boolean> {
    const config = await this.getConfig(entityName);
    if (!config) return false;

    if (direction === 'inbound') {
      return config.inbound_enabled;
    }
    return config.outbound_enabled;
  }

  async canWrite(entityName: string, direction: 'inbound' | 'outbound'): Promise<boolean> {
    const config = await this.getConfig(entityName);
    if (!config) return false;

    // Stammdaten (master) can only be written via inbound (external systems)
    if (config.data_category === 'master') {
      return direction === 'inbound' && config.inbound_enabled;
    }

    // Bewegungsdaten (transaction) can be written in both directions based on config
    if (direction === 'inbound') {
      return config.inbound_enabled;
    }
    return config.outbound_enabled;
  }

  // ============ Sync Operations ============

  async logSync(
    configId: string,
    direction: 'inbound' | 'outbound',
    status: 'success' | 'failed' | 'partial',
    recordsProcessed: number,
    recordsFailed: number,
    errorMessage?: string
  ): Promise<SyncLog> {
    const id = uuidv4();
    await query(
      `INSERT INTO sync_logs (id, config_id, direction, status, records_processed, records_failed, error_message, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [id, configId, direction, status, recordsProcessed, recordsFailed, errorMessage || null]
    );

    await query(
      'UPDATE data_manager_config SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
      [configId]
    );

    return queryOne<SyncLog>('SELECT * FROM sync_logs WHERE id = $1', [id]) as Promise<SyncLog>;
  }

  async getSyncLogs(configId: string, limit = 50): Promise<SyncLog[]> {
    return query<SyncLog>(
      'SELECT * FROM sync_logs WHERE config_id = $1 ORDER BY started_at DESC LIMIT $2',
      [configId, limit]
    );
  }

  // ============ Bulk Import (Inbound) ============

  async importData<T extends Record<string, any>>(
    entityName: string,
    data: T[],
    apiKey?: string
  ): Promise<ApiResponse<{ processed: number; failed: number; errors: string[] }>> {
    const config = await this.getConfig(entityName);
    
    if (!config) {
      return { success: false, error: `Entity ${entityName} not configured` };
    }

    if (!config.inbound_enabled) {
      return { success: false, error: `Inbound not enabled for ${entityName}` };
    }

    if (config.api_key && config.api_key !== apiKey) {
      return { success: false, error: 'Invalid API key' };
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of data) {
      try {
        await this.upsertRecord(entityName, record);
        processed++;
      } catch (error: any) {
        failed++;
        errors.push(`Record ${record.id || 'unknown'}: ${error.message}`);
      }
    }

    await this.logSync(
      config.id,
      'inbound',
      failed === 0 ? 'success' : (processed > 0 ? 'partial' : 'failed'),
      processed,
      failed,
      errors.length > 0 ? errors.join('; ') : undefined
    );

    return {
      success: true,
      data: { processed, failed, errors },
      message: `Imported ${processed} records, ${failed} failed`
    };
  }

  // ============ Bulk Export (Outbound) ============

  async exportData(
    entityName: string,
    filters?: Record<string, any>,
    apiKey?: string
  ): Promise<ApiResponse<any[]>> {
    const config = await this.getConfig(entityName);
    
    if (!config) {
      return { success: false, error: `Entity ${entityName} not configured` };
    }

    if (!config.outbound_enabled) {
      return { success: false, error: `Outbound not enabled for ${entityName}` };
    }

    if (config.api_key && config.api_key !== apiKey) {
      return { success: false, error: 'Invalid API key' };
    }

    try {
      const data = await this.queryRecords(entityName, filters);
      
      await this.logSync(
        config.id,
        'outbound',
        'success',
        data.length,
        0
      );

      return { success: true, data };
    } catch (error: any) {
      await this.logSync(
        config.id,
        'outbound',
        'failed',
        0,
        0,
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  // ============ Record Operations ============

  private async upsertRecord(entityName: string, record: Record<string, any>): Promise<void> {
    const tableMap: Record<string, string> = {
      'stores': 'stores',
      'articles': 'articles',
      'allocation_runs': 'allocation_runs',
      'scenarios': 'scenarios',
      'exceptions': 'exceptions',
      'tasks': 'tasks',
      'parameters': 'allocation_parameters',
      'capacity': 'capacity_data'
    };

    const table = tableMap[entityName];
    if (!table) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const columns = Object.keys(record).filter(k => k !== 'created_at');
    const values = columns.map(k => record[k]);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const updateSet = columns.filter(c => c !== 'id').map((c, i) => `${c} = $${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (id) DO UPDATE SET ${updateSet}
    `;

    await query(sql, values);
  }

  private async queryRecords(entityName: string, filters?: Record<string, any>): Promise<any[]> {
    const tableMap: Record<string, string> = {
      'stores': 'stores',
      'articles': 'articles',
      'allocation_runs': 'allocation_runs',
      'scenarios': 'scenarios',
      'exceptions': 'exceptions',
      'tasks': 'tasks',
      'parameters': 'allocation_parameters',
      'capacity': 'capacity_data'
    };

    const table = tableMap[entityName];
    if (!table) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    if (!filters || Object.keys(filters).length === 0) {
      return query(`SELECT * FROM ${table}`);
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    return query(`SELECT * FROM ${table} WHERE ${conditions.join(' AND ')}`, values);
  }

  // ============ Webhook Notifications ============

  async triggerWebhook(entityName: string, event: string, data: any): Promise<void> {
    const config = await this.getConfig(entityName);
    
    if (!config || !config.webhook_url || !config.outbound_enabled) {
      return;
    }

    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_key ? { 'X-API-Key': config.api_key } : {})
        },
        body: JSON.stringify({
          entity: entityName,
          event,
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error(`Webhook failed for ${entityName}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Webhook error for ${entityName}:`, error);
    }
  }
}

export const dataManager = new DataManager();
