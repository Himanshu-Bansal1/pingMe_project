import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.resolve(here,'../../db'),{recursive:true});
export const db = new Database(path.resolve(here,'../../db/airpool.db'));
db.pragma('foreign_keys = ON');
db.exec(readFileSync(path.join(here,'schema.sql'),'utf8'));
