import fs from 'node:fs/promises'
import path from 'node:path'

const stripQuotes = (v) => {
  const s = String(v ?? '')
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
  return s
}

// Lightweight `.env` loader (so local dev works without extra deps like `dotenv`).
// - Only sets variables that are not already in `process.env`
// - Supports: KEY=value, KEY="value", KEY='value'
export async function loadEnv({ envPath = path.join(process.cwd(), '.env') } = {}) {
  let raw = ''
  try {
    raw = await fs.readFile(envPath, 'utf8')
  } catch {
    return false
  }

  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = stripQuotes(trimmed.slice(eq + 1).trim())
    if (!key) continue
    if (process.env[key] === undefined) process.env[key] = val
  }
  return true
}

