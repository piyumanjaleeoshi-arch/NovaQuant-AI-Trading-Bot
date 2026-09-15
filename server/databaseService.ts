import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export interface BotStateRecord {
  id: number;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  updated_at: number;
  previous_status: string;
  action: string;
  reason: string;
  active_processes_running: number;
  metadata?: string;
}

export interface AuditLogRecord {
  id?: number;
  timestamp: number;
  event: string;
  status: string;
  action?: string;
  reason?: string;
  ip?: string;
  user_agent?: string;
  error?: string;
  metadata?: string;
}

export interface ExchangeConnectionRecord {
  id: string;
  user_id: string;
  exchange: string; // 'binance' | 'bybit' | 'bitget'
  encrypted_api_key: string;
  encrypted_api_secret: string;
  encrypted_api_passphrase?: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  created_at: number;
  updated_at: number;
}

export interface BotRecord {
  id: string;
  user_id: string;
  exchange_connection_id: string;
  name: string;
  strategy: string;
  trading_pair: string;
  capital_allocation: number;
  risk_settings: string;
  status: 'STOPPED' | 'RUNNING' | 'PAUSED';
  created_at: number;
  updated_at: number;
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[DATABASE] Error creating data directory:', err);
  }
}

const DB_FILE_PATH = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('sqlite:///', '')
  : path.join(process.cwd(), 'novaquant.db');

const JSON_BACKUP_PATH = path.join(DATA_DIR, 'bot_state.json');
const CONNECTIONS_BACKUP_PATH = path.join(DATA_DIR, 'exchange_connections.json');
const BOTS_BACKUP_PATH = path.join(DATA_DIR, 'bots.json');

let sqliteDb: DatabaseSync | null = null;

// Initialize native SQLite with graceful fallback
try {
  sqliteDb = new DatabaseSync(DB_FILE_PATH);
  console.log(`[DATABASE] SQLite engine initialized successfully at ${DB_FILE_PATH}`);
} catch (err: any) {
  console.warn('[DATABASE] Native node:sqlite not available or failed to load, using durable JSON storage:', err?.message || err);
}

// Initialize tables
export function initDatabase(): {
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  lastUpdated: number;
  activeProcessesRunning: boolean;
} {
  console.log('[DATABASE] Running schema bootstrap on production store...');

  if (sqliteDb) {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS bot_status (
          id INTEGER PRIMARY KEY,
          status TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          previous_status TEXT,
          action TEXT,
          reason TEXT,
          active_processes_running INTEGER NOT NULL DEFAULT 1,
          metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS bot_audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          event TEXT NOT NULL,
          status TEXT NOT NULL,
          action TEXT,
          reason TEXT,
          ip TEXT,
          user_agent TEXT,
          error TEXT,
          metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS risk_settings (
          id INTEGER PRIMARY KEY,
          settings_json TEXT NOT NULL,
          trading_mode TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS exchange_connections (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          exchange TEXT NOT NULL,
          encrypted_api_key TEXT NOT NULL,
          encrypted_api_secret TEXT NOT NULL,
          encrypted_api_passphrase TEXT,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_exchange_conn_user ON exchange_connections(user_id);

        CREATE TABLE IF NOT EXISTS bots (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          exchange_connection_id TEXT NOT NULL,
          name TEXT NOT NULL,
          strategy TEXT NOT NULL,
          trading_pair TEXT NOT NULL,
          capital_allocation REAL NOT NULL,
          risk_settings TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);
      `);

      // Ensure all columns exist in bot_status if table was pre-created
      const tableInfo = sqliteDb.prepare("PRAGMA table_info(bot_status)").all() as Array<{ name: string }>;
      const colNames = new Set(tableInfo.map((c) => c.name));

      if (!colNames.has('action')) {
        sqliteDb.exec('ALTER TABLE bot_status ADD COLUMN action TEXT;');
      }
      if (!colNames.has('previous_status')) {
        sqliteDb.exec('ALTER TABLE bot_status ADD COLUMN previous_status TEXT;');
      }
      if (!colNames.has('active_processes_running')) {
        sqliteDb.exec('ALTER TABLE bot_status ADD COLUMN active_processes_running INTEGER NOT NULL DEFAULT 1;');
      }
      if (!colNames.has('metadata')) {
        sqliteDb.exec('ALTER TABLE bot_status ADD COLUMN metadata TEXT;');
      }

      console.log('[DATABASE] Tables verified and migrated: bot_status, bot_audit_logs, risk_settings, exchange_connections, bots');
    } catch (dbErr: any) {
      console.error('[DATABASE ERROR] Failed bootstrapping SQLite tables:', dbErr?.message || dbErr);
    }
  }

  // Load existing status from SQLite or JSON backup
  let currentRecord: BotStateRecord | null = null;

  if (sqliteDb) {
    try {
      const selectStmt = sqliteDb.prepare('SELECT * FROM bot_status WHERE id = 1');
      const row = selectStmt.get() as unknown as BotStateRecord | undefined;
      if (row) {
        currentRecord = row;
        console.log(`[DATABASE] Loaded persistent bot state from SQLite: Status=${row.status}, UpdatedAt=${new Date(row.updated_at).toISOString()}`);
      }
    } catch (readErr: any) {
      console.error('[DATABASE ERROR] Failed to query bot_status table:', readErr?.message || readErr);
    }
  }

  // Check JSON backup if SQLite had no row
  if (!currentRecord && fs.existsSync(JSON_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_BACKUP_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.status) {
        currentRecord = parsed;
        console.log(`[DATABASE] Loaded persistent bot state from JSON fallback: Status=${parsed.status}`);
      }
    } catch (jsonErr: any) {
      console.warn('[DATABASE] Failed to read JSON backup:', jsonErr?.message);
    }
  }

  // If still no record, initialize with BOT_DEFAULT_STATUS (defaults to STOPPED per security directive)
  if (!currentRecord) {
    const envDefault = (process.env.BOT_DEFAULT_STATUS || 'stopped').toLowerCase();
    const defaultStatus: 'RUNNING' | 'PAUSED' | 'STOPPED' =
      envDefault === 'running' ? 'RUNNING' : envDefault === 'paused' ? 'PAUSED' : 'STOPPED';
    const now = Date.now();
    currentRecord = {
      id: 1,
      status: defaultStatus,
      updated_at: now,
      previous_status: 'INITIAL_BOOT',
      action: 'BOOT_INIT',
      reason: 'First system startup initialization (BOT_DEFAULT_STATUS=stopped)',
      active_processes_running: defaultStatus === 'RUNNING' ? 1 : 0,
      metadata: JSON.stringify({ initializedAt: now }),
    };

    saveBotStatusToStores(currentRecord);
    console.log(`[DATABASE] Initialized default bot record: Status=${defaultStatus}`);
  }

  return {
    status: currentRecord.status,
    lastUpdated: currentRecord.updated_at,
    activeProcessesRunning: currentRecord.active_processes_running === 1,
  };
}

// Internal helper to persist to both SQLite and JSON file
function saveBotStatusToStores(record: BotStateRecord): void {
  // 1. Save to SQLite
  if (sqliteDb) {
    try {
      const upsertStmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO bot_status (
          id, status, updated_at, previous_status, action, reason, active_processes_running, metadata
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `);
      upsertStmt.run(
        record.status,
        record.updated_at,
        record.previous_status,
        record.action,
        record.reason,
        record.active_processes_running,
        record.metadata || ''
      );
      console.log(`[DATABASE SUCCESS] SQLite updated: id=1, status=${record.status}, active_processes=${record.active_processes_running}`);
    } catch (sqliteErr: any) {
      console.error('[DATABASE ERROR] SQLite upsert failed:', sqliteErr?.message || sqliteErr);
      throw sqliteErr;
    }
  }

  // 2. Synchronous write to durable JSON backup
  try {
    fs.writeFileSync(JSON_BACKUP_PATH, JSON.stringify(record, null, 2), 'utf-8');
  } catch (fsErr: any) {
    console.error('[DATABASE ERROR] Failed writing JSON backup:', fsErr?.message || fsErr);
  }
}

// Get current bot status directly from database
export function getBotStatusFromDb(): {
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  lastUpdated: number;
  previousStatus: string;
  activeProcessesRunning: boolean;
  reason: string;
} {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM bot_status WHERE id = 1');
      const row = stmt.get() as unknown as BotStateRecord | undefined;
      if (row) {
        return {
          status: row.status,
          lastUpdated: row.updated_at,
          previousStatus: row.previous_status,
          activeProcessesRunning: row.active_processes_running === 1,
          reason: row.reason,
        };
      }
    } catch (err: any) {
      console.error('[DATABASE ERROR] getBotStatusFromDb SQLite query failed:', err);
    }
  }

  // JSON fallback
  if (fs.existsSync(JSON_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_BACKUP_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        status: parsed.status || 'RUNNING',
        lastUpdated: parsed.updated_at || Date.now(),
        previousStatus: parsed.previous_status || 'UNKNOWN',
        activeProcessesRunning: parsed.active_processes_running === 1,
        reason: parsed.reason || '',
      };
    } catch (err: any) {
      console.error('[DATABASE ERROR] getBotStatusFromDb JSON read failed:', err);
    }
  }

  return {
    status: 'RUNNING',
    lastUpdated: Date.now(),
    previousStatus: 'UNKNOWN',
    activeProcessesRunning: true,
    reason: 'Default state fallback',
  };
}

// Update bot status in database
export function updateBotStatusInDb(
  targetStatus: 'RUNNING' | 'PAUSED' | 'STOPPED',
  action: string,
  reason: string,
  meta?: { ip?: string; userAgent?: string; authorization?: string }
): {
  success: boolean;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  lastUpdated: number;
  activeProcessesRunning: boolean;
  message: string;
} {
  const now = Date.now();
  const current = getBotStatusFromDb();
  const previousStatus = current.status;

  // Active trading processes are ONLY running when status is RUNNING
  const activeProcessesRunning = targetStatus === 'RUNNING' ? 1 : 0;

  console.log(`[DATABASE TRANSITION] Updating bot status in database: "${previousStatus}" -> "${targetStatus}" (Action: ${action}, Reason: ${reason})`);

  const record: BotStateRecord = {
    id: 1,
    status: targetStatus,
    updated_at: now,
    previous_status: previousStatus,
    action: action || targetStatus,
    reason: reason || `Updated via action ${action}`,
    active_processes_running: activeProcessesRunning,
    metadata: JSON.stringify({
      ip: meta?.ip || 'unknown',
      userAgent: meta?.userAgent || 'unknown',
      timestampIso: new Date(now).toISOString(),
    }),
  };

  try {
    saveBotStatusToStores(record);

    // Record audit log
    recordAuditLog({
      timestamp: now,
      event: 'BOT_STATUS_CHANGED',
      status: targetStatus,
      action: action || targetStatus,
      reason: reason || `Status set to ${targetStatus}`,
      ip: meta?.ip,
      user_agent: meta?.userAgent,
      metadata: JSON.stringify({ previousStatus, activeProcessesRunning }),
    });

    console.log(`[DATABASE AUDIT] Bot status successfully transitioned to "${targetStatus}" in persistent storage.`);

    return {
      success: true,
      status: targetStatus,
      lastUpdated: now,
      activeProcessesRunning: activeProcessesRunning === 1,
      message: `Bot status updated to ${targetStatus} and saved to database`,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[DATABASE CRITICAL] Failed updating bot status in database:`, err);

    recordAuditLog({
      timestamp: now,
      event: 'BOT_STATUS_CHANGE_ERROR',
      status: targetStatus,
      action: action || targetStatus,
      reason: reason,
      ip: meta?.ip,
      user_agent: meta?.userAgent,
      error: errorMsg,
    });

    throw new Error(`Database error while updating bot status to ${targetStatus}: ${errorMsg}`);
  }
}

// Record an audit log entry
export function recordAuditLog(log: AuditLogRecord): void {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO bot_audit_logs (timestamp, event, status, action, reason, ip, user_agent, error, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        log.timestamp,
        log.event,
        log.status,
        log.action || '',
        log.reason || '',
        log.ip || '',
        log.user_agent || '',
        log.error || '',
        log.metadata || ''
      );
    } catch (auditErr: any) {
      console.error('[DATABASE ERROR] Failed writing audit log:', auditErr?.message || auditErr);
    }
  }
}

// Get recent audit logs
export function getRecentAuditLogs(limit: number = 50): AuditLogRecord[] {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM bot_audit_logs ORDER BY timestamp DESC LIMIT ?');
      return stmt.all(limit) as unknown as AuditLogRecord[];
    } catch (err) {
      console.error('[DATABASE ERROR] Failed retrieving audit logs:', err);
    }
  }
  return [];
}

/* =========================================================================
   MULTI-USER EXCHANGE CONNECTIONS CRUD OPERATIONS
   ========================================================================= */

function readConnectionsBackup(): ExchangeConnectionRecord[] {
  if (fs.existsSync(CONNECTIONS_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(CONNECTIONS_BACKUP_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function writeConnectionsBackup(records: ExchangeConnectionRecord[]): void {
  try {
    fs.writeFileSync(CONNECTIONS_BACKUP_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DATABASE] Failed writing connections backup:', err);
  }
}

/**
 * Saves or updates an exchange connection for a specific user.
 * Strictly associates the connection with user_id.
 */
export function saveUserExchangeConnection(data: {
  id?: string;
  user_id: string;
  exchange: string;
  encrypted_api_key: string;
  encrypted_api_secret: string;
  encrypted_api_passphrase?: string | null;
  status?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}): ExchangeConnectionRecord {
  const now = Date.now();
  const normalizedExchange = data.exchange.toLowerCase();
  
  // Find existing connection for this user and exchange if id not provided
  let connId = data.id;
  if (!connId) {
    const existing = getUserExchangeConnectionByExchange(data.user_id, normalizedExchange);
    connId = existing ? existing.id : `conn_${normalizedExchange}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  const record: ExchangeConnectionRecord = {
    id: connId,
    user_id: data.user_id,
    exchange: normalizedExchange,
    encrypted_api_key: data.encrypted_api_key,
    encrypted_api_secret: data.encrypted_api_secret,
    encrypted_api_passphrase: data.encrypted_api_passphrase || null,
    status: data.status || 'CONNECTED',
    created_at: now,
    updated_at: now,
  };

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO exchange_connections (
          id, user_id, exchange, encrypted_api_key, encrypted_api_secret, encrypted_api_passphrase, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          encrypted_api_key = excluded.encrypted_api_key,
          encrypted_api_secret = excluded.encrypted_api_secret,
          encrypted_api_passphrase = excluded.encrypted_api_passphrase,
          status = excluded.status,
          updated_at = excluded.updated_at;
      `);
      stmt.run(
        record.id,
        record.user_id,
        record.exchange,
        record.encrypted_api_key,
        record.encrypted_api_secret,
        record.encrypted_api_passphrase,
        record.status,
        record.created_at,
        record.updated_at
      );
      console.log(`[DATABASE] Saved exchange connection: id=${record.id}, user_id=${record.user_id}, exchange=${record.exchange}`);
    } catch (err: any) {
      console.error('[DATABASE ERROR] Failed saving exchange connection in SQLite:', err);
    }
  }

  // Durable JSON sync
  const allConns = readConnectionsBackup();
  const idx = allConns.findIndex((c) => c.id === record.id);
  if (idx >= 0) {
    record.created_at = allConns[idx].created_at;
    allConns[idx] = record;
  } else {
    allConns.push(record);
  }
  writeConnectionsBackup(allConns);

  return record;
}

/**
 * Retrieves all exchange connections strictly belonging to the given user_id.
 */
export function getUserExchangeConnections(userId: string): ExchangeConnectionRecord[] {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM exchange_connections WHERE user_id = ? ORDER BY created_at DESC');
      return stmt.all(userId) as unknown as ExchangeConnectionRecord[];
    } catch (err) {
      console.error('[DATABASE ERROR] Failed querying user exchange connections:', err);
    }
  }
  return readConnectionsBackup().filter((c) => c.user_id === userId);
}

/**
 * Retrieves a single connection by ID, ensuring user_id ownership matches.
 */
export function getUserExchangeConnectionById(userId: string, connectionId: string): ExchangeConnectionRecord | null {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM exchange_connections WHERE id = ? AND user_id = ?');
      const row = stmt.get(connectionId, userId) as unknown as ExchangeConnectionRecord | undefined;
      if (row) return row;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed querying exchange connection by ID:', err);
    }
  }
  const match = readConnectionsBackup().find((c) => c.id === connectionId && c.user_id === userId);
  return match || null;
}

/**
 * Retrieves a connection for a user by exchange name.
 */
export function getUserExchangeConnectionByExchange(userId: string, exchange: string): ExchangeConnectionRecord | null {
  const norm = exchange.toLowerCase();
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM exchange_connections WHERE user_id = ? AND LOWER(exchange) = ?');
      const row = stmt.get(userId, norm) as unknown as ExchangeConnectionRecord | undefined;
      if (row) return row;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed querying connection by exchange:', err);
    }
  }
  const match = readConnectionsBackup().find((c) => c.user_id === userId && c.exchange.toLowerCase() === norm);
  return match || null;
}

/**
 * Deletes an exchange connection belonging to the user.
 */
export function deleteUserExchangeConnection(userId: string, connectionId: string): boolean {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM exchange_connections WHERE id = ? AND user_id = ?');
      stmt.run(connectionId, userId);
      console.log(`[DATABASE] Deleted exchange connection: id=${connectionId}, user_id=${userId}`);
    } catch (err) {
      console.error('[DATABASE ERROR] Failed deleting exchange connection:', err);
    }
  }

  const allConns = readConnectionsBackup();
  const filtered = allConns.filter((c) => !(c.id === connectionId && c.user_id === userId));
  writeConnectionsBackup(filtered);
  return true;
}

/**
 * Updates status of an exchange connection.
 */
export function updateUserExchangeConnectionStatus(
  userId: string,
  connectionId: string,
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
): boolean {
  const now = Date.now();
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('UPDATE exchange_connections SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?');
      stmt.run(status, now, connectionId, userId);
      return true;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed updating connection status:', err);
    }
  }

  const allConns = readConnectionsBackup();
  const conn = allConns.find((c) => c.id === connectionId && c.user_id === userId);
  if (conn) {
    conn.status = status;
    conn.updated_at = now;
    writeConnectionsBackup(allConns);
    return true;
  }
  return false;
}

/* =========================================================================
   MULTI-USER BOTS CRUD OPERATIONS
   ========================================================================= */

function readBotsBackup(): BotRecord[] {
  if (fs.existsSync(BOTS_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(BOTS_BACKUP_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function writeBotsBackup(records: BotRecord[]): void {
  try {
    fs.writeFileSync(BOTS_BACKUP_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DATABASE] Failed writing bots backup:', err);
  }
}

/**
 * Creates a new bot tied to a specific user and their exchange connection.
 * Default status is STOPPED (BOT_DEFAULT_STATUS=stopped) to prevent unintended auto-trading.
 */
export function createUserBot(data: {
  id?: string;
  user_id: string;
  exchange_connection_id: string;
  name: string;
  strategy: string;
  trading_pair: string;
  capital_allocation: number;
  risk_settings: any;
  status?: 'STOPPED' | 'RUNNING' | 'PAUSED';
}): BotRecord {
  const now = Date.now();
  const botId = data.id || `bot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  
  // Safe default: STOPPED
  const botStatus = data.status || 'STOPPED';
  const riskSettingsStr = typeof data.risk_settings === 'string' ? data.risk_settings : JSON.stringify(data.risk_settings);

  const record: BotRecord = {
    id: botId,
    user_id: data.user_id,
    exchange_connection_id: data.exchange_connection_id,
    name: data.name,
    strategy: data.strategy,
    trading_pair: data.trading_pair,
    capital_allocation: Number(data.capital_allocation) || 1000,
    risk_settings: riskSettingsStr,
    status: botStatus,
    created_at: now,
    updated_at: now,
  };

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO bots (
          id, user_id, exchange_connection_id, name, strategy, trading_pair, capital_allocation, risk_settings, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          exchange_connection_id = excluded.exchange_connection_id,
          name = excluded.name,
          strategy = excluded.strategy,
          trading_pair = excluded.trading_pair,
          capital_allocation = excluded.capital_allocation,
          risk_settings = excluded.risk_settings,
          status = excluded.status,
          updated_at = excluded.updated_at;
      `);
      stmt.run(
        record.id,
        record.user_id,
        record.exchange_connection_id,
        record.name,
        record.strategy,
        record.trading_pair,
        record.capital_allocation,
        record.risk_settings,
        record.status,
        record.created_at,
        record.updated_at
      );
      console.log(`[DATABASE] Created/Updated user bot: id=${record.id}, user_id=${record.user_id}, status=${record.status}`);
    } catch (err) {
      console.error('[DATABASE ERROR] Failed saving bot to SQLite:', err);
    }
  }

  const allBots = readBotsBackup();
  const idx = allBots.findIndex((b) => b.id === record.id);
  if (idx >= 0) {
    record.created_at = allBots[idx].created_at;
    allBots[idx] = record;
  } else {
    allBots.push(record);
  }
  writeBotsBackup(allBots);

  return record;
}

/**
 * Retrieves all bots owned by the given user.
 */
export function getUserBots(userId: string): BotRecord[] {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC');
      return stmt.all(userId) as unknown as BotRecord[];
    } catch (err) {
      console.error('[DATABASE ERROR] Failed querying user bots:', err);
    }
  }
  return readBotsBackup().filter((b) => b.user_id === userId);
}

/**
 * Retrieves a single bot by ID, strictly verifying user ownership.
 */
export function getUserBotById(userId: string, botId: string): BotRecord | null {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?');
      const row = stmt.get(botId, userId) as unknown as BotRecord | undefined;
      if (row) return row;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed querying user bot by ID:', err);
    }
  }
  const match = readBotsBackup().find((b) => b.id === botId && b.user_id === userId);
  return match || null;
}

/**
 * Updates a user bot's status (STOPPED, RUNNING, PAUSED) with ownership check.
 */
export function updateUserBotStatus(userId: string, botId: string, status: 'STOPPED' | 'RUNNING' | 'PAUSED'): boolean {
  const now = Date.now();
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('UPDATE bots SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?');
      stmt.run(status, now, botId, userId);
      return true;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed updating bot status in SQLite:', err);
    }
  }

  const allBots = readBotsBackup();
  const bot = allBots.find((b) => b.id === botId && b.user_id === userId);
  if (bot) {
    bot.status = status;
    bot.updated_at = now;
    writeBotsBackup(allBots);
    return true;
  }
  return false;
}

/**
 * Deletes a bot belonging to the user.
 */
export function deleteUserBot(userId: string, botId: string): boolean {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM bots WHERE id = ? AND user_id = ?');
      stmt.run(botId, userId);
    } catch (err) {
      console.error('[DATABASE ERROR] Failed deleting bot from SQLite:', err);
    }
  }

  const allBots = readBotsBackup();
  const filtered = allBots.filter((b) => !(b.id === botId && b.user_id === userId));
  writeBotsBackup(filtered);
  return true;
}
