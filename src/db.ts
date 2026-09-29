import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'

const configuredPath = process.env.DATABASE_PATH || './data/property.sqlite'
const dbPath = path.resolve(configuredPath)
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
const migrationVersion = (db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get() as {version:number|null}).version || 0
if (migrationVersion < 1) db.transaction(() => db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, display_name TEXT NOT NULL,
  phone TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT NOT NULL, purpose TEXT NOT NULL CHECK(purpose IN ('sale','rent')),
  property_type TEXT NOT NULL, city TEXT NOT NULL CHECK(city IN ('Yangon','Mandalay','Bago')),
  township TEXT, price INTEGER NOT NULL CHECK(price > 0), currency TEXT NOT NULL DEFAULT 'MMK',
  rent_period TEXT, bedrooms INTEGER, bathrooms INTEGER, area REAL, area_unit TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS listings_search_idx ON listings(status, city, purpose, price, created_at);
CREATE TABLE IF NOT EXISTS listing_photos (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL, caption TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0
);
INSERT INTO schema_migrations(version) VALUES(1);
`))()
const currentVersion=(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get() as {version:number|null}).version||0
if(currentVersion<2) db.transaction(()=>db.exec(`
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin'));
ALTER TABLE listings ADD COLUMN review_status TEXT NOT NULL DEFAULT 'approved' CHECK(review_status IN ('pending','approved','rejected'));
INSERT INTO schema_migrations(version) VALUES(2);
`))()

export function listingById(id: string) {
  const row = db.prepare(`SELECT l.*, u.display_name AS owner_name, u.phone AS owner_phone, u.role AS owner_role
    FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.id=?`).get(id) as (Record<string, unknown> & {id:string}) | undefined
  if (!row) return null
  const photos = db.prepare('SELECT url, caption, is_primary AS isPrimary FROM listing_photos WHERE listing_id=? ORDER BY is_primary DESC, sort_order ASC').all(id) as {url:string;caption?:string;isPrimary:number}[]
  const status=row.review_status==='rejected'?'rejected':row.status==='draft'?'draft':row.review_status==='pending'?'pending_review':row.status
  return { id:row.id, title:row.title, description:row.description, purpose:row.purpose, propertyType:row.property_type, city:row.city, township:row.township, price:row.price, currency:row.currency, rentPeriod:row.rent_period, bedrooms:row.bedrooms, bathrooms:row.bathrooms, area:row.area, areaUnit:row.area_unit, status, reviewStatus:row.review_status, createdAt:row.created_at, publishedAt:row.published_at, photos:photos.map(p=>({...p,isPrimary:Boolean(p.isPrimary)})), owner:{displayName:row.owner_name,phone:row.owner_phone,role:row.owner_role} }
}
