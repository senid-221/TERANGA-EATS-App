import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '256kb' }));

const adminUserIds = (process.env.ADMIN_USER_IDS || 'user_3IovuJeKnlbTyX5UYfDYuV1Wk1v').split(',').map(v => v.trim()).filter(Boolean);
const clerk = process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY, publishableKey: process.env.CLERK_PUBLISHABLE_KEY })
  : null;
const adminDb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

async function authenticateAdmin(req, res) {
  if (!clerk) {
    res.status(503).json({ ok: false, error: 'Clerk server authentication is not configured.' });
    return null;
  }
  try {
    const request = new Request(`${process.env.APP_URL || 'http://localhost:3000'}${req.originalUrl}`, {
      method: req.method,
      headers: new Headers({ authorization: req.header('authorization') || '' })
    });
    const state = await clerk.authenticateRequest(request, {
      authorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES || `${process.env.APP_URL || 'http://localhost:3000'},http://localhost:3000`).split(',').map(v => v.trim()).filter(Boolean)
    });
    if (!state.isAuthenticated) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return null;
    }
    const userId = state.toAuth().userId;
    if (!userId || !adminUserIds.includes(userId)) {
      res.status(403).json({ ok: false, error: 'Administrator access required.' });
      return null;
    }
    return userId;
  } catch (error) {
    console.error('Clerk admin authentication failed:', error);
    res.status(401).json({ ok: false, error: 'Invalid authentication token.' });
    return null;
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'TerangaEats' }));

app.get('/api/admin/orders', async (req, res) => {
  if (!(await authenticateAdmin(req, res))) return;
  if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const { data, error } = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: 'Unable to load orders.' });
  return res.json({ ok: true, orders: data || [] });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`TerangaEats server running on port ${PORT}`));
