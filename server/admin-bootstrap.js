import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { registerAdminCatalogRoutes } from './adminCatalogRoutes.js';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const sign = (value) => crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
const validSession = (token) => {
  if (!token || !SESSION_SECRET) return false;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    const expected = sign(payload);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const [email, expiry] = payload.split('|');
    return email === ADMIN_EMAIL && Number(expiry) > Date.now();
  } catch {
    return false;
  }
};
const getCookie = (req, name) => String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
const authenticateAdmin = (req, res) => {
  if (validSession(getCookie(req, 'teranga_admin_session'))) return true;
  res.status(401).json({ ok: false, error: 'Authentication required.' });
  return false;
};

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  registerAdminCatalogRoutes(this, { supabase, authenticateAdmin });
  return originalListen.apply(this, args);
};

await import('../server.js');
