import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClerkClient } from "@clerk/backend";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";

interface OrderItemPayload {
  nameFR?: string;
  nameEN?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface OrderNotificationPayload { orderId?: string; }
type DeliveryAddressPayload = { neighborhood?: string; streetAddress?: string; buildingInfo?: string; instructions?: string; lat?: number; lng?: number; };
type OrderPayload = { id: string; customerName: string; customerPhone: string; restaurantName: string; items: OrderItemPayload[]; subtotal: number; deliveryFee: number; discount: number; total: number; paymentMethod: string; deliveryAddress: DeliveryAddressPayload; };

const formatMoney = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0))} FCFA`;
const buildMapsLink = (address: DeliveryAddressPayload) => {
  if (typeof address.lat === 'number' && typeof address.lng === 'number') return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.lat},${address.lng}`)}`;
  const query = [address.streetAddress, address.buildingInfo, address.neighborhood].filter(Boolean).join(', ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : 'https://www.google.com/maps';
};
const buildOrderMessage = (order: OrderPayload) => {
  const items = order.items.map((item) => `• ${item.quantity || 1} × ${item.nameFR || item.nameEN || 'Produit'} — ${formatMoney(item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 1))}`).join('\n');
  const address = order.deliveryAddress;
  const addressText = [address.neighborhood, address.streetAddress, address.buildingInfo].filter(Boolean).join(', ') || 'Adresse non précisée';
  return ['🛎️ *NOUVELLE COMMANDE — TERANGAEATS*', '', `🆔 Commande : *${order.id}*`, `👤 Client : *${order.customerName}*`, `📱 WhatsApp/Tél : *${order.customerPhone}*`, `🍽️ Restaurant : *${order.restaurantName}*`, '', '🛒 *Produits :*', items || '• Aucun produit', '', `Sous-total : ${formatMoney(order.subtotal)}`, `Livraison : ${formatMoney(order.deliveryFee)}`, `Réduction : ${formatMoney(order.discount)}`, `💰 *TOTAL : ${formatMoney(order.total)}*`, `💳 Paiement : ${order.paymentMethod}`, '', `📍 *Livraison :* ${addressText}`, address.instructions ? `📝 Instructions : ${address.instructions}` : '', `🗺️ *Google Maps :* ${buildMapsLink(address)}`].filter(Boolean).join('\n');
};
const sendWhatsAppOrderNotification = async (order: OrderPayload) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN, phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID, adminNumber = process.env.WHATSAPP_ADMIN_NUMBER, apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  if (!accessToken || !phoneNumberId || !adminNumber) return { sent: false, configured: false, reason: 'WhatsApp credentials are not configured on the server.' };
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: adminNumber.replace(/\D/g, ''), type: 'text', text: { preview_url: true, body: buildOrderMessage(order) } }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { console.error('WhatsApp order notification failed:', result); return { sent: false, configured: true, reason: 'WhatsApp API rejected the message.' }; }
  return { sent: true, configured: true, messageId: result?.messages?.[0]?.id };
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUserIds = (process.env.ADMIN_USER_IDS || 'user_3IovuJeKnlbTyX5UYfDYuV1Wk1v').split(',').map((v) => v.trim()).filter(Boolean);
const clerk = process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY, publishableKey: process.env.CLERK_PUBLISHABLE_KEY }) : null;
const adminDb: SupabaseClient | null = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

const authenticateAdmin = async (req: express.Request, res: express.Response): Promise<string | null> => {
  if (!clerk) { res.status(503).json({ ok: false, error: 'Clerk server authentication is not configured.' }); return null; }
  try {
    const request = new Request(`${process.env.APP_URL || 'http://localhost:3000'}${req.originalUrl}`, { method: req.method, headers: new Headers({ authorization: req.header('authorization') || '' }) });
    const state = await clerk.authenticateRequest(request, { authorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES || `${process.env.APP_URL || 'http://localhost:3000'},http://localhost:3000`).split(',').map((v) => v.trim()).filter(Boolean) });
    if (!state.isAuthenticated) { res.status(401).json({ ok: false, error: 'Authentication required.' }); return null; }
    const userId = state.toAuth().userId;
    if (!userId || !adminUserIds.includes(userId)) { res.status(403).json({ ok: false, error: 'Administrator access required.' }); return null; }
    return userId;
  } catch (error) { console.error('Clerk admin authentication failed:', error); res.status(401).json({ ok: false, error: 'Invalid authentication token.' }); return null; }
};

const productRow = (p: any) => ({ id: p.id, restaurant_id: p.restaurantId, restaurant_name: p.restaurantName, category_id: p.categoryId, name_fr: p.nameFR, name_en: p.nameEN, description_fr: p.descriptionFR, description_en: p.descriptionEN, image_url: p.imageUrl, price: p.price, original_price: p.originalPrice ?? null, available: p.available, rating: p.rating ?? 0, review_count: p.reviewCount ?? 0, prep_time_minutes: p.prepTimeMinutes ?? 20, is_spicy: p.isSpicy ?? false, is_popular: p.isPopular ?? false, is_signature: p.isSignature ?? false, ingredients_fr: p.ingredientsFR ?? [], ingredients_en: p.ingredientsEN ?? [], options: p.options ?? [] });
const orderFromRow = (row: any): OrderPayload => ({ id: row.id, customerName: row.customer_name, customerPhone: row.customer_phone, restaurantName: row.restaurant_name || row.restaurant_id || 'Restaurant', items: Array.isArray(row.items) ? row.items : [], subtotal: Number(row.subtotal || 0), deliveryFee: Number(row.delivery_fee || 0), discount: Number(row.discount || 0), total: Number(row.total || 0), paymentMethod: row.payment_method || 'cash_on_delivery', deliveryAddress: row.delivery_address && typeof row.delivery_address === 'object' ? row.delivery_address : {} });
const orderForAdmin = (row: any) => ({ ...row, restaurantId: row.restaurant_id, restaurantName: row.restaurant_name, restaurantLogo: row.restaurant_logo, restaurantPhone: row.restaurant_phone, restaurantAddress: row.restaurant_address, userId: row.user_id, customerName: row.customer_name, customerPhone: row.customer_phone, deliveryAddress: row.delivery_address, paymentMethod: row.payment_method, paymentStatus: row.payment_status, orderStatus: row.order_status, statusHistory: row.status_history || [], createdAt: row.created_at, deliveredAt: row.delivered_at, estimatedDeliveryTime: row.estimated_delivery_time });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/admin/orders', async (req, res) => {
    if (!(await authenticateAdmin(req, res))) return;
    if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    const { data, error } = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ ok: false, error: 'Unable to load orders.' });
    return res.json({ ok: true, orders: (data || []).map(orderForAdmin) });
  });

  app.post('/api/admin/products', async (req, res) => { if (!(await authenticateAdmin(req, res))) return; if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' }); const product = req.body?.product; if (!product?.id || !product?.restaurantId || !product?.categoryId || !product?.nameFR || !product?.nameEN) return res.status(400).json({ ok: false, error: 'Invalid product payload.' }); const { error } = await adminDb.from('products').insert(productRow(product)); if (error) return res.status(400).json({ ok: false, error: error.message }); return res.json({ ok: true }); });
  app.put('/api/admin/products/:id', async (req, res) => { if (!(await authenticateAdmin(req, res))) return; if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' }); const product = { ...(req.body?.product || {}), id: req.params.id }; const { id, ...updates } = productRow(product); const { error } = await adminDb.from('products').update(updates).eq('id', id); if (error) return res.status(400).json({ ok: false, error: error.message }); return res.json({ ok: true }); });
  app.delete('/api/admin/products/:id', async (req, res) => { if (!(await authenticateAdmin(req, res))) return; if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' }); const { error } = await adminDb.from('products').delete().eq('id', req.params.id); if (error) return res.status(400).json({ ok: false, error: error.message }); return res.json({ ok: true }); });
  app.patch('/api/admin/orders/:id/status', async (req, res) => { if (!(await authenticateAdmin(req, res))) return; if (!adminDb) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' }); const { status, noteFR, noteEN } = req.body || {}; if (!status) return res.status(400).json({ ok: false, error: 'Order status is required.' }); const { data: current, error: readError } = await adminDb.from('orders').select('status_history').eq('id', req.params.id).single(); if (readError) return res.status(404).json({ ok: false, error: 'Order not found.' }); const history = Array.isArray(current?.status_history) ? current.status_history : []; const now = new Date().toISOString(); const { error } = await adminDb.from('orders').update({ order_status: status, status_history: [...history, { status, timestamp: now, noteFR: noteFR || `Statut : ${status}`, noteEN: noteEN || `Status: ${status}` }], delivered_at: status === 'delivered' ? now : null }).eq('id', req.params.id); if (error) return res.status(400).json({ ok: false, error: error.message }); return res.json({ ok: true }); });
  app.post('/api/admin/notify-order', async (req, res) => { try { const orderId = String((req.body as OrderNotificationPayload)?.orderId || '').trim(); if (!orderId) return res.status(400).json({ ok: false, error: 'Order ID is required.' }); if (!adminDb) return res.status(503).json({ ok: false, notificationSent: false, reason: 'Supabase server credentials are not configured.' }); const { data: row, error } = await adminDb.from('orders').select('id,customer_name,customer_phone,restaurant_name,items,subtotal,delivery_fee,discount,total,payment_method,delivery_address').eq('id', orderId).single(); if (error || !row) return res.status(404).json({ ok: false, notificationSent: false, reason: 'Order not found.' }); const order = orderFromRow(row); if (!order.customerName || !order.customerPhone) return res.status(400).json({ ok: false, notificationSent: false, reason: 'Order is missing customer contact details.' }); const result = await sendWhatsAppOrderNotification(order); if (!result.configured) return res.status(202).json({ ok: true, notificationSent: false, reason: result.reason }); if (!result.sent) return res.status(502).json({ ok: false, notificationSent: false, reason: result.reason }); return res.json({ ok: true, notificationSent: true, messageId: result.messageId }); } catch (error) { console.error('Order WhatsApp notification route error:', error); return res.status(500).json({ ok: false, notificationSent: false, error: 'Unable to send WhatsApp notification.' }); } });

  if (process.env.NODE_ENV !== "production") { const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" }); app.use(vite.middlewares); } else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, () => console.log(`TerangaEats server running on port ${PORT}`));
}
startServer().catch((error) => { console.error(error); process.exit(1); });
