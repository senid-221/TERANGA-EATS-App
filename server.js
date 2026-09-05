import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { registerDriverRoutes } from './server/driverRoutes.js';
import { registerOrderRoutes } from './server/orderRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
app.use(express.json({ limit: '256kb' }));

const sign = (value) => crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
const makeSession = (email) => {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${email}|${expires}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
};
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
  } catch { return false; }
};
const getCookie = (req, name) => String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
const authenticateAdmin = (req, res) => {
  if (validSession(getCookie(req, 'teranga_admin_session'))) return true;
  res.status(401).json({ ok: false, error: 'Authentication required.' });
  return false;
};

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'TerangaEats' }));

app.post('/api/admin/login', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET) return res.status(503).json({ ok: false, error: 'Admin authentication is not configured on the server.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const emailOk = email === ADMIN_EMAIL;
  const passwordOk = password.length === ADMIN_PASSWORD.length && crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));
  if (!emailOk || !passwordOk) return res.status(401).json({ ok: false, error: 'Invalid admin email or password.' });
  res.setHeader('Set-Cookie', `teranga_admin_session=${makeSession(email)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', 'teranga_admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax');
  res.json({ ok: true });
});

app.get('/api/admin/session', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: validSession(getCookie(req, 'teranga_admin_session')) });
});

const productRow = p => ({
  id: p.id,
  restaurant_id: p.restaurantId,
  restaurant_name: p.restaurantName,
  category_id: p.categoryId,
  name_fr: p.nameFR,
  name_en: p.nameEN,
  description_fr: p.descriptionFR,
  description_en: p.descriptionEN,
  image_url: p.imageUrl,
  price: Number(p.price) || 0,
  original_price: p.originalPrice ?? null,
  available: p.available !== false,
  rating: Number(p.rating) || 0,
  review_count: Number(p.reviewCount) || 0,
  prep_time_minutes: Number(p.prepTimeMinutes) || 20,
  is_spicy: Boolean(p.isSpicy),
  is_popular: Boolean(p.isPopular),
  is_signature: Boolean(p.isSignature),
  ingredients_fr: Array.isArray(p.ingredientsFR) ? p.ingredientsFR : [],
  ingredients_en: Array.isArray(p.ingredientsEN) ? p.ingredientsEN : [],
  options: Array.isArray(p.options) ? p.options : []
});
const orderForAdmin = row => ({
  ...row,
  restaurantId: row.restaurant_id,
  restaurantName: row.restaurant_name,
  restaurantLogo: row.restaurant_logo,
  restaurantPhone: row.restaurant_phone,
  restaurantAddress: row.restaurant_address,
  userId: row.user_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerEmail: row.customer_email || row.delivery_address?.email || '',
  deliveryAddress: row.delivery_address || {},
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  orderStatus: row.order_status,
  statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
  createdAt: row.created_at,
  deliveredAt: row.delivered_at,
  estimatedDeliveryTime: row.estimated_delivery_time
});
const allowedStatuses = new Set(['pending', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'delivering', 'driver_arrived', 'delivered', 'cancelled']);

app.get('/api/admin/orders', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Admin order feed failed:', error);
    return res.status(500).json({ ok: false, error: 'Unable to load orders.' });
  }
  res.json({ ok: true, orders: (data || []).map(orderForAdmin) });
});

app.get('/api/admin/diagnostics', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const result = {
    ok: true,
    server: true,
    supabaseConfigured: Boolean(supabase),
    openRouterConfigured: Boolean(String(process.env.OPENROUTER_API_KEY || '').trim()),
    wasenderConfigured: Boolean(String(process.env.WASENDER_API_KEY || '').trim() && String(process.env.WASENDER_ADMIN_NUMBER || '').trim()),
    adminAuthConfigured: Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && SESSION_SECRET),
    orderTable: false,
    orderCount: 0
  };
  if (supabase) {
    const { count, error } = await supabase.from('orders').select('id', { count: 'exact', head: true });
    result.orderTable = !error;
    result.orderCount = Number(count || 0);
  }
  res.json(result);
});

app.post('/api/admin/products', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const p = req.body?.product;
  if (!p?.id || !p?.restaurantId || !p?.categoryId || !p?.nameFR || !p?.nameEN) return res.status(400).json({ ok: false, error: 'Invalid product payload.' });
  const { error } = await supabase.from('products').insert(productRow(p));
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

app.put('/api/admin/products/:id', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const p = { ...(req.body?.product || {}), id: req.params.id };
  const { id, ...updates } = productRow(p);
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

app.delete('/api/admin/products/:id', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

app.patch('/api/admin/orders/:id/status', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const { status, noteFR, noteEN } = req.body || {};
  if (!allowedStatuses.has(status)) return res.status(400).json({ ok: false, error: 'Invalid order status.' });
  const { data: current, error: readError } = await supabase.from('orders').select('status_history').eq('id', req.params.id).single();
  if (readError) return res.status(404).json({ ok: false, error: 'Order not found.' });
  const history = Array.isArray(current?.status_history) ? current.status_history : [];
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({
    order_status: status,
    status_history: [...history, { status, timestamp: now, noteFR: noteFR || `Statut : ${status}`, noteEN: noteEN || `Status: ${status}` }],
    delivered_at: status === 'delivered' ? now : null
  }).eq('id', req.params.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true });
});

app.post('/api/orders/status', async (req, res) => {
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
  const id = String(req.body?.orderId || '').trim();
  const phone = String(req.body?.phone || '').replace(/\D/g, '');
  if (!id || !phone) return res.status(400).json({ ok: false, error: 'Order ID and phone are required.' });
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error || !data) return res.status(404).json({ ok: false, error: 'Order not found.' });
  const storedPhone = String(data.customer_phone || data.delivery_address?.phone || '').replace(/\D/g, '');
  if (!storedPhone || storedPhone !== phone) return res.status(403).json({ ok: false, error: 'Order verification failed.' });
  res.json({ ok: true, order: orderForAdmin(data) });
});

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = String(process.env.OPENROUTER_MODEL || 'openai/gpt-4o').trim();
const OPENROUTER_API_KEY = String(process.env.OPENROUTER_API_KEY || '').trim();
const AI_SYSTEM_PROMPT = `You are TerangaEats Client Helper, the customer-support AI inside the TerangaEats food ordering app.\n\nRules:\n- Give useful, natural, accurate answers. Do not make up facts.\n- Use the catalog context supplied by the server for current product names and prices.\n- Never invent product names, prices, discounts, delivery times, order status, payment confirmation, restaurant availability, addresses, or company policies.\n- If the conversation does not contain the information needed, clearly say that you do not have that information and direct the customer to the TerangaEats human team on WhatsApp.\n- Help with menu questions, how to order, checkout, delivery, payment methods, order tracking, and general app support.\n- If the customer asks in Kinyarwanda, answer in natural Kinyarwanda. If French, answer in French. If English, answer in English. Keep the language consistent with the customer.\n- Be polite, concise, practical, and friendly.\n- Remember the conversation history supplied in the messages and use it to avoid asking for information the customer already provided.\n- Do not claim that you performed an action in the app unless the conversation explicitly confirms it.\n- If a human is needed, say so and recommend the WhatsApp Team button.`;
const extractOpenRouterReply = data => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) return content.map(part => typeof part === 'string' ? part : String(part?.text || '')).join('').trim();
  return '';
};

app.post('/api/ai-help', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const fallbackMessage = String(req.body?.message || '').trim();
  const normalized = messages.filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant')).slice(-30);
  if (!normalized.length && fallbackMessage) normalized.push({ role: 'user', content: fallbackMessage });
  if (!normalized.length) return res.status(400).json({ ok: false, reply: 'Andika ikibazo cyawe.' });
  if (!OPENROUTER_API_KEY) return res.status(503).json({ ok: false, reply: 'AI Helper ntabwo iraboneka ubu. Kanda WhatsApp uvugane na team yacu.' });

  let catalogContext = 'Catalog context is unavailable.';
  if (supabase) {
    const [{ data: restaurants }, { data: products }] = await Promise.all([
      supabase.from('restaurants').select('id,name,is_open,estimated_delivery_time'),
      supabase.from('products').select('restaurant_id,name_fr,name_en,price,available').eq('available', true).limit(200)
    ]);
    catalogContext = JSON.stringify({ restaurants: restaurants || [], products: products || [] });
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': String(process.env.APP_URL || 'https://citymarketbusiness.com'),
        'X-Title': 'TerangaEats',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: 'system', content: `${AI_SYSTEM_PROMPT}\n\nCURRENT CATALOG FROM SUPABASE:\n${catalogContext}` },
          ...normalized
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    const reply = extractOpenRouterReply(data);
    if (!response.ok || !reply) throw new Error(String(data?.error?.message || `OpenRouter request failed (${response.status})`));
    res.json({ ok: true, reply });
  } catch (error) {
    console.warn('OpenRouter AI helper failed:', error?.message || error);
    res.status(200).json({ ok: false, reply: 'AI Helper yagize ikibazo gito. Kanda WhatsApp uvugane na team yacu.' });
  }
});

const money = n => `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))} FCFA`;
const mapsLink = a => typeof a?.lat === 'number' && typeof a?.lng === 'number'
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.lat},${a.lng}`)}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([a?.streetAddress, a?.buildingInfo, a?.neighborhood].filter(Boolean).join(', ') || 'Dakar')}`;
const normalizeWhatsAppNumber = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};
const WASENDER_API_URL = String(process.env.WASENDER_API_URL || 'https://www.wasenderapi.com').replace(/\/$/, '');
const verifyWasenderWebhook = req => {
  const signature = String(req.headers['x-webhook-signature'] || '').trim();
  const secret = String(process.env.WASENDER_WEBHOOK_SECRET || '').trim();
  if (!signature || !secret) return false;
  return signature === secret;
};
const notifyWhatsApp = async (order, event = 'new_order') => {
  const apiKey = String(process.env.WASENDER_API_KEY || '').trim();
  const adminNumber = normalizeWhatsAppNumber(process.env.WASENDER_ADMIN_NUMBER || '');
  if (!apiKey || !adminNumber) return false;
  const items = (order.items || []).map(i => `• ${i.quantity || 1} × ${i.nameFR || i.nameEN || 'Produit'} — ${money(i.totalPrice ?? (i.unitPrice || 0) * (i.quantity || 1))}`).join('\n');
  const a = order.delivery_address || {};
  const email = order.customer_email || a.email || '';
  const address = [a.neighborhood, a.streetAddress, a.buildingInfo].filter(Boolean).join(', ') || 'Adresse non précisée';
  const driver = order.driver || {};
  const heading = event === 'driver_accepted' ? '🚦 *DRIVER A ACCEPTÉ LA COMMANDE*' : '🛎️ *NOUVELLE COMMANDE — TERANGAEATS*';
  const body = [
    heading,
    `🆔 Commande : *${order.id}*`,
    `👤 Client : *${order.customer_name}*`,
    `📱 WhatsApp/Tél : *${order.customer_phone}*`,
    email ? `✉️ Email : ${email}` : '',
    '',
    '🛒 *Produits :*',
    items || '• Aucun produit',
    '',
    `💰 *TOTAL : ${money(order.total)}*`,
    `💳 Paiement : ${order.payment_method || 'cash_on_delivery'}`,
    `📍 Livraison : ${address}`,
    `🗺️ *Google Maps :* ${mapsLink(a)}`,
    event === 'driver_accepted' ? `🏍️ Driver : *${driver.name || 'Livreur'}*` : ''
  ].filter(Boolean).join('\n');
  try {
    const r = await fetch(`${WASENDER_API_URL}/api/send-message`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: adminNumber, text: body })
    });
    if (!r.ok) {
      console.warn('WasenderAPI notification failed:', r.status, await r.text().catch(() => ''));
      return false;
    }
    const result = await r.json().catch(() => null);
    return result?.success !== false;
  } catch (error) {
    console.warn('WasenderAPI request failed:', error);
    return false;
  }
};

app.post('/api/orders/notify', async (req, res) => {
  if (!supabase) return res.status(503).json({ ok: false, notificationSent: false, reason: 'Supabase server credentials are not configured.' });
  const id = String(req.body?.orderId || '').trim();
  if (!id) return res.status(400).json({ ok: false, notificationSent: false, reason: 'Order ID is required.' });
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error || !data) return res.status(404).json({ ok: false, notificationSent: false, reason: 'Order not found.' });
  const sent = await notifyWhatsApp(data);
  return res.status(sent ? 200 : 202).json({ ok: true, notificationSent: sent, reason: sent ? undefined : 'WhatsApp is not configured or rejected the message.' });
});

app.post('/api/admin/notify-order', async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ ok: false, notificationSent: false, reason: 'Supabase server credentials are not configured.' });
  const id = String(req.body?.orderId || '').trim();
  if (!id) return res.status(400).json({ ok: false, notificationSent: false, reason: 'Order ID is required.' });
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error || !data) return res.status(404).json({ ok: false, notificationSent: false, reason: 'Order not found.' });
  const sent = await notifyWhatsApp(data);
  res.status(sent ? 200 : 202).json({ ok: true, notificationSent: sent, reason: sent ? undefined : 'WhatsApp is not configured or rejected the message.' });
});

app.post('/api/whatsapp/webhook', (req, res) => {
  if (!verifyWasenderWebhook(req)) return res.status(401).json({ ok: false, error: 'Invalid webhook signature.' });
  const payload = req.body || {};
  const event = String(payload.event || 'unknown');
  console.log(`Wasender webhook: ${event}`);
  res.status(200).json({ received: true });
});

registerOrderRoutes(app, { supabase, notifyWhatsApp });
registerDriverRoutes(app, supabase, SESSION_SECRET, authenticateAdmin, notifyWhatsApp);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

if (!existsSync(path.join(distPath, 'index.html'))) {
  console.error(`Production build is missing: ${path.join(distPath, 'index.html')}`);
  console.error('Run "npm run build" in the Hostinger build command before starting the application.');
  process.exit(1);
}

app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`TerangaEats server running on port ${PORT}; static files: ${distPath}`));
