import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

app.use(express.json({ limit: '256kb' }));

const sign = (value) => crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
const makeSession = (email) => { const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; const payload = `${email}|${expires}`; return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`; };
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
const getCookie = (req, name) => String(req.headers.cookie || '').split(';').map((v) => v.trim()).find((v) => v.startsWith(`${name}=`))?.slice(name.length + 1);
const authenticateAdmin = (req, res) => { if (validSession(getCookie(req, 'teranga_admin_session'))) return true; res.status(401).json({ ok: false, error: 'Authentication required.' }); return false; };

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'TerangaEats' }));
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET) return res.status(503).json({ ok: false, error: 'Admin authentication is not configured on the server.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const emailOk = email === ADMIN_EMAIL;
  const passwordOk = password.length === ADMIN_PASSWORD.length && crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));
  if (!emailOk || !passwordOk) return res.status(401).json({ ok: false, error: 'Invalid admin email or password.' });
  res.setHeader('Set-Cookie', `teranga_admin_session=${makeSession(email)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`);
  res.json({ ok: true });
});
app.post('/api/admin/logout', (_req, res) => { res.setHeader('Set-Cookie', 'teranga_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'); res.json({ ok: true }); });
app.get('/api/admin/session', (req, res) => res.json({ ok: validSession(getCookie(req, 'teranga_admin_session')) }));

const productRow = (p) => ({ id:p.id, restaurant_id:p.restaurantId, restaurant_name:p.restaurantName, category_id:p.categoryId, name_fr:p.nameFR, name_en:p.nameEN, description_fr:p.descriptionFR, description_en:p.descriptionEN, image_url:p.imageUrl, price:p.price, original_price:p.originalPrice ?? null, available:p.available, rating:p.rating ?? 0, review_count:p.reviewCount ?? 0, prep_time_minutes:p.prepTimeMinutes ?? 20, is_spicy:p.isSpicy ?? false, is_popular:p.isPopular ?? false, is_signature:p.isSignature ?? false, ingredients_fr:p.ingredientsFR ?? [], ingredients_en:p.ingredientsEN ?? [], options:p.options ?? [] });
const orderForAdmin = (row) => ({ ...row, restaurantId:row.restaurant_id, restaurantName:row.restaurant_name, restaurantLogo:row.restaurant_logo, restaurantPhone:row.restaurant_phone, restaurantAddress:row.restaurant_address, userId:row.user_id, customerName:row.customer_name, customerPhone:row.customer_phone, customerEmail:row.customer_email || row.delivery_address?.email || '', deliveryAddress:row.delivery_address, paymentMethod:row.payment_method, paymentStatus:row.payment_status, orderStatus:row.order_status, statusHistory:row.status_history || [], createdAt:row.created_at, deliveredAt:row.delivered_at, estimatedDeliveryTime:row.estimated_delivery_time });
const allowedStatuses = new Set(['pending','accepted','preparing','ready','assigned','picked_up','delivering','driver_arrived','delivered','cancelled']);

app.get('/api/admin/orders', async (req,res) => {
  if (!authenticateAdmin(req,res)) return;
  if (!supabase) return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});
  const {data,error}=await supabase.from('orders').select('*').order('created_at',{ascending:false});
  if(error) return res.status(500).json({ok:false,error:'Unable to load orders.'});
  res.json({ok:true,orders:(data||[]).map(orderForAdmin)});
});
app.post('/api/admin/products', async(req,res)=>{ if(!authenticateAdmin(req,res))return; if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'}); const p=req.body?.product; if(!p?.id||!p?.restaurantId||!p?.categoryId||!p?.nameFR||!p?.nameEN)return res.status(400).json({ok:false,error:'Invalid product payload.'}); const {error}=await supabase.from('products').insert(productRow(p)); if(error)return res.status(400).json({ok:false,error:error.message}); res.json({ok:true}); });
app.put('/api/admin/products/:id', async(req,res)=>{ if(!authenticateAdmin(req,res))return; if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'}); const p={...(req.body?.product||{}),id:req.params.id}; const {id,...updates}=productRow(p); const {error}=await supabase.from('products').update(updates).eq('id',id); if(error)return res.status(400).json({ok:false,error:error.message}); res.json({ok:true}); });
app.delete('/api/admin/products/:id', async(req,res)=>{ if(!authenticateAdmin(req,res))return; if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'}); const {error}=await supabase.from('products').delete().eq('id',req.params.id); if(error)return res.status(400).json({ok:false,error:error.message}); res.json({ok:true}); });
app.patch('/api/admin/orders/:id/status', async(req,res)=>{ if(!authenticateAdmin(req,res))return; if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'}); const {status,noteFR,noteEN}=req.body||{}; if(!allowedStatuses.has(status))return res.status(400).json({ok:false,error:'Invalid order status.'}); const {data:current,error:readError}=await supabase.from('orders').select('status_history').eq('id',req.params.id).single(); if(readError)return res.status(404).json({ok:false,error:'Order not found.'}); const history=Array.isArray(current?.status_history)?current.status_history:[]; const now=new Date().toISOString(); const {error}=await supabase.from('orders').update({order_status:status,status_history:[...history,{status,timestamp:now,noteFR:noteFR||`Statut : ${status}`,noteEN:noteEN||`Status: ${status}`}],delivered_at:status==='delivered'?now:null}).eq('id',req.params.id); if(error)return res.status(400).json({ok:false,error:error.message}); res.json({ok:true}); });

const money=(n)=>`${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)||0))} FCFA`;
const mapsLink=(a={})=>typeof a.lat==='number'&&typeof a.lng==='number'?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.lat},${a.lng}`)}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([a.streetAddress,a.buildingInfo,a.neighborhood].filter(Boolean).join(', ')||'Rwanda')}`;
const notifyWhatsApp=async(order)=>{
  const token=process.env.WHATSAPP_ACCESS_TOKEN; const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID; const adminNumber=process.env.WHATSAPP_ADMIN_NUMBER;
  if(!token||!phoneId||!adminNumber)return false;
  const items=(order.items||[]).map(i=>`• ${i.quantity||1} × ${i.nameFR||i.nameEN||'Produit'} — ${money(i.totalPrice??(i.unitPrice||0)*(i.quantity||1))}`).join('\n');
  const a=order.delivery_address||{}; const email=order.customer_email||a.email||''; const address=[a.neighborhood,a.streetAddress,a.buildingInfo].filter(Boolean).join(', ')||'Adresse non précisée';
  const body=['🛎️ *NOUVELLE COMMANDE — TERANGAEATS*',`🆔 Commande : *${order.id}*`,`👤 Client : *${order.customer_name}*`,`📱 WhatsApp/Tél : *${order.customer_phone}*`,email?`✉️ Email : ${email}`:'','', '🛒 *Produits :*',items||'• Aucun produit','',`💰 *TOTAL : ${money(order.total)}*`,`💳 Paiement : ${order.payment_method||'cash_on_delivery'}`,`📍 Livraison : ${address}`,`🗺️ *Google Maps :* ${mapsLink(a)}`].filter(Boolean).join('\n');
  const version=process.env.WHATSAPP_API_VERSION||'v21.0';
  try{ const r=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:adminNumber.replace(/\D/g,''),type:'text',text:{preview_url:true,body}})}); return r.ok; }catch(error){console.warn('WhatsApp request failed:',error);return false;}
};

app.post('/api/orders/notify',async(req,res)=>{
  if(!supabase)return res.status(503).json({ok:false,notificationSent:false,reason:'Supabase server credentials are not configured.'});
  const id=String(req.body?.orderId||'').trim(); if(!id)return res.status(400).json({ok:false,notificationSent:false,reason:'Order ID is required.'});
  const {data,error}=await supabase.from('orders').select('*').eq('id',id).single(); if(error||!data)return res.status(404).json({ok:false,notificationSent:false,reason:'Order not found.'});
  const sent=await notifyWhatsApp(data); return res.status(sent?200:202).json({ok:true,notificationSent:sent,reason:sent?undefined:'WhatsApp is not configured or rejected the message.'});
});
app.post('/api/admin/notify-order',async(req,res)=>{ if(!authenticateAdmin(req,res))return; if(!supabase)return res.status(503).json({ok:false,notificationSent:false,reason:'Supabase server credentials are not configured.'}); const id=String(req.body?.orderId||'').trim(); if(!id)return res.status(400).json({ok:false,notificationSent:false,reason:'Order ID is required.'}); const {data,error}=await supabase.from('orders').select('*').eq('id',id).single(); if(error||!data)return res.status(404).json({ok:false,notificationSent:false,reason:'Order not found.'}); const sent=await notifyWhatsApp(data); res.status(sent?200:202).json({ok:true,notificationSent:sent,reason:sent?undefined:'WhatsApp is not configured or rejected the message.'}); });

const distPath=path.join(process.cwd(),'dist'); app.use(express.static(distPath)); app.get('*',(_req,res)=>res.sendFile(path.join(distPath,'index.html'))); app.listen(PORT,'0.0.0.0',()=>console.log(`TerangaEats server running on port ${PORT}`));
