import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory at apps/web/data
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

let _db = null;

/**
 * Get or initialize SQLite DatabaseSync instance
 * @returns {DatabaseSync}
 */
export function getDb() {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    initTables(_db);
  }
  return _db;
}

/**
 * Initialize all database tables if they do not exist
 * @param {DatabaseSync} db
 */
export function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      invoice_no TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL, -- Issued, Draft, Paid, Void
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      pdf_filename TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      invoice_no TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL, -- Pending Approval, Paid
      created_at TEXT NOT NULL,
      UNIQUE(vendor_name, invoice_no)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

/**
 * Close database connection
 */
export function closeDb() {
  if (_db) {
    try {
      _db.close();
    } catch {
      // ignore
    }
    _db = null;
  }
}
