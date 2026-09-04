import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { existsSync, chmodSync } from 'fs';
import { execFileSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { registerDriverRoutes } from './server/driverRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
app.use(express.json({ limit: '256kb' }));
const sign = (value) => crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
const makeSession = (email) => { const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; const payload = `${email}|${expires}`; return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`; };
const validSession = (token) => { if (!token || !SESSION_SECRET) return false; const [encoded, signature] = token.split('.'); if (!encoded || !signature) return false; try { const payload = Buffer.from(encoded, 'base64url').toString('utf8'); const expected = sign(payload); if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return false; const [email, expiry] = payload.split('|'); return email === ADMIN_EMAIL && Number(expiry) > Date.now(); } catch { return false; } };
const getCookie = (req, name) => String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
const authenticateAdmin = (req, res) => { if (validSession(getCookie(req,'teranga_admin_session'))) return true; res.status(401).json({ok:false,error:'Authentication required.'}); return false; };
app.get('/api/health', (_req,res) => res.json({ok:true,service:'TerangaEats'}));
app.post('/api/admin/login', (req,res) => { if(!ADMIN_EMAIL||!ADMIN_PASSWORD||!SESSION_SECRET)return res.status(503).json({ok:false,error:'Admin authentication is not configured on the server.'}); const email=String(req.body?.email||'').trim().toLowerCase(); const password=String(req.body?.password||''); const emailOk=email===ADMIN_EMAIL; const passwordOk=password.length===ADMIN_PASSWORD.length&&crypto.timingSafeEqual(Buffer.from(password),Buffer.from(ADMIN_PASSWORD)); if(!emailOk||!passwordOk)return res.status(401).json({ok:false,error:'Invalid admin email or password.'}); res.setHeader('Set-Cookie',`teranga_admin_session=${makeSession(email)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`); res.json({ok:true}); });
app.post('/api/admin/logout',(_req,res)=>{res.setHeader('Set-Cookie','teranga_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');res.json({ok:true});});
app.get('/api/admin/session',(req,res)=>res.json({ok:validSession(getCookie(req,'teranga_admin_session'))}));
const productRow=p=>({id:p.id,restaurant_id:p.restaurantId,restaurant_name:p.restaurantName,category_id:p.categoryId,name_fr:p.nameFR,name_en:p.nameEN,description_fr:p.descriptionFR,description_en:p.descriptionEN,image_url:p.imageUrl,price:p.price,original_price:p.originalPrice??null,available:p.available,rating:p.rating??0,review_count:p.reviewCount??0,prep_time_minutes:p.prepTimeMinutes??20,is_spicy:p.isSpicy??false,is_popular:p.isPopular??false,is_signature:p.isSignature??false,ingredients_fr:p.ingredientsFR??[],ingredients_en:p.ingredientsEN??[],options:p.options??[]});
const orderForAdmin=row=>({...row,restaurantId:row.restaurant_id,restaurantName:row.restaurant_name,restaurantLogo:row.restaurant_logo,restaurantPhone:row.restaurant_phone,restaurantAddress:row.restaurant_address,userId:row.user_id,customerName:row.customer_name,customerPhone:row.customer_phone,customerEmail:row.customer_email||row.delivery_address?.email||'',deliveryAddress:row.delivery_address,paymentMethod:row.payment_method,paymentStatus:row.payment_status,orderStatus:row.order_status,statusHistory:row.status_history||[],createdAt:row.created_at,deliveredAt:row.delivered_at,estimatedDeliveryTime:row.estimated_delivery_time});
const allowedStatuses=new Set(['pending','accepted','preparing','ready','assigned','picked_up','delivering','driver_arrived','delivered','cancelled']);
app.get('/api/admin/orders',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const {data,error}=await supabase.from('orders').select('*').order('created_at',{ascending:false});if(error)return res.status(500).json({ok:false,error:'Unable to load orders.'});res.json({ok:true,orders:(data||[]).map(orderForAdmin)});});
app.post('/api/admin/products',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const p=req.body?.product;if(!p?.id||!p?.restaurantId||!p?.categoryId||!p?.nameFR||!p?.nameEN)return res.status(400).json({ok:false,error:'Invalid product payload.'});const {error}=await supabase.from('products').insert(productRow(p));if(error)return res.status(400).json({ok:false,error:error.message});res.json({ok:true});});
app.put('/api/admin/products/:id',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const p={...(req.body?.product||{}),id:req.params.id};const {id,...updates}=productRow(p);const {error}=await supabase.from('products').update(updates).eq('id',id);if(error)return res.status(400).json({ok:false,error:error.message});res.json({ok:true});});
app.delete('/api/admin/products/:id',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const {error}=await supabase.from('products').delete().eq('id',req.params.id);if(error)return res.status(400).json({ok:false,error:error.message});res.json({ok:true});});
app.patch('/api/admin/orders/:id/status',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const {status,noteFR,noteEN}=req.body||{};if(!allowedStatuses.has(status))return res.status(400).json({ok:false,error:'Invalid order status.'});const {data:current,error:readError}=await supabase.from('orders').select('status_history').eq('id',req.params.id).single();if(readError)return res.status(404).json({ok:false,error:'Order not found.'});const history=Array.isArray(current?.status_history)?current.status_history:[];const now=new Date().toISOString();const {error}=await supabase.from('orders').update({order_status:status,status_history:[...history,{status,timestamp:now,noteFR:noteFR||`Statut : ${status}`,noteEN:noteEN||`Status: ${status}`}],delivered_at:status==='delivered'?now:null}).eq('id',req.params.id);if(error)return res.status(400).json({ok:false,error:error.message});res.json({ok:true});});
app.post('/api/orders/status',async(req,res)=>{if(!supabase)return res.status(503).json({ok:false,error:'Supabase server credentials are not configured.'});const id=String(req.body?.orderId||'').trim();const phone=String(req.body?.phone||'').replace(/\D/g,'');if(!id||!phone)return res.status(400).json({ok:false,error:'Order ID and phone are required.'});const {data,error}=await supabase.from('orders').select('*').eq('id',id).single();if(error||!data)return res.status(404).json({ok:false,error:'Order not found.'});const storedPhone=String(data.customer_phone||data.delivery_address?.phone||'').replace(/\D/g,'');if(!storedPhone||storedPhone!==phone)return res.status(403).json({ok:false,error:'Order verification failed.'});res.json({ok:true,order:orderForAdmin(data)});});

// AI Client Helper: Gemini is server-side only; customers never receive the API key.
app.post('/api/ai-help',async(req,res)=>{
  const message=String(req.body?.message||'').trim();
  if(!message)return res.status(400).json({ok:false,reply:'Andika ikibazo cyawe.'});
  const apiKey=String(process.env.GEMINI_API_KEY||'').trim();
  if(!apiKey)return res.status(503).json({ok:false,reply:'AI Helper ntabwo iraboneka ubu. Kanda WhatsApp uvugane na team yacu.'});
  try{
    const ai=new GoogleGenAI({apiKey});
    const response=await ai.models.generateContent({
      model:'gemini-2.5-flash',
      contents:[{
        role:'user',
        parts:[{text:`You are TerangaEats Client Helper. Help customers politely and briefly with ordering food, menu/product questions, delivery, payment, order tracking, and general TerangaEats support. Do not invent prices, products, delivery times, order status, or policies. If the customer needs a human/developer, tell them to use the WhatsApp button. Reply in the customer's language when clear; otherwise use simple French. Customer message: ${message}`}]
      }]
    });
    const reply=String(response?.text||'').trim()||'Nshobora kugufasha kuri menu, order, delivery cyangwa payment. Niba ukeneye umuntu, kanda WhatsApp Team.';
    res.json({ok:true,reply});
  }catch(error){
    console.warn('Gemini AI helper failed:',error?.message||error);
    res.status(200).json({ok:false,reply:'AI Helper yagize ikibazo gito. Kanda WhatsApp uvugane na team yacu.'});
  }
});

const money=n=>`${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)||0))} FCFA`;
const mapsLink=a=>typeof a?.lat==='number'&&typeof a?.lng==='number'?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.lat},${a.lng}`)}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([a?.streetAddress,a?.buildingInfo,a?.neighborhood].filter(Boolean).join(', ')||'Dakar')}`;
const normalizeWhatsAppNumber=(value)=>{const digits=String(value||'').replace(/\D/g,'');return digits?`+${digits}`:'';};
const WASENDER_API_URL=String(process.env.WASENDER_API_URL||'https://www.wasenderapi.com').replace(/\/$/,'');
const verifyWasenderWebhook=(req)=>{const signature=String(req.headers['x-webhook-signature']||'').trim();const secret=String(process.env.WASENDER_WEBHOOK_SECRET||'').trim();if(!signature||!secret)return false;return signature===secret;};
const notifyWhatsApp=async(order,event='new_order')=>{const apiKey=String(process.env.WASENDER_API_KEY||'').trim();const adminNumber=normalizeWhatsAppNumber(process.env.WASENDER_ADMIN_NUMBER||'');if(!apiKey||!adminNumber)return false;const items=(order.items||[]).map(i=>`• ${i.quantity||1} × ${i.nameFR||i.nameEN||'Produit'} — ${money(i.totalPrice??(i.unitPrice||0)*(i.quantity||1))}`).join('\n');const a=order.delivery_address||{};const email=order.customer_email||a.email||'';const address=[a.neighborhood,a.streetAddress,a.buildingInfo].filter(Boolean).join(', ')||'Adresse non précisée';const driver=order.driver||{};const heading=event==='driver_accepted'?'🚦 *DRIVER A ACCEPTÉ LA COMMANDE*':'🛎️ *NOUVELLE COMMANDE — TERANGAEATS*';const body=[heading,`🆔 Commande : *${order.id}*`,`👤 Client : *${order.customer_name}*`,`📱 WhatsApp/Tél : *${order.customer_phone}*`,email?`✉️ Email : ${email}`:'','', '🛒 *Produits :*',items||'• Aucun produit','',`💰 *TOTAL : ${money(order.total)}*`,`💳 Paiement : ${order.payment_method||'cash_on_delivery'}`,`📍 Livraison : ${address}`,`🗺️ *Google Maps :* ${mapsLink(a)}`,event==='driver_accepted'?`🏍️ Driver : *${driver.name||'Livreur'}*`:''].filter(Boolean).join('\n');try{const r=await fetch(`${WASENDER_API_URL}/api/send-message`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({to:adminNumber,text:body})});if(!r.ok){console.warn('WasenderAPI notification failed:',r.status,await r.text().catch(()=>''));return false;}const result=await r.json().catch(()=>null);return result?.success!==false;}catch(error){console.warn('WasenderAPI request failed:',error);return false;}};
app.post('/api/orders/notify',async(req,res)=>{if(!supabase)return res.status(503).json({ok:false,notificationSent:false,reason:'Supabase server credentials are not configured.'});const id=String(req.body?.orderId||'').trim();if(!id)return res.status(400).json({ok:false,notificationSent:false,reason:'Order ID is required.'});const {data,error}=await supabase.from('orders').select('*').eq('id',id).single();if(error||!data)return res.status(404).json({ok:false,notificationSent:false,reason:'Order not found.'});const sent=await notifyWhatsApp(data);return res.status(sent?200:202).json({ok:true,notificationSent:sent,reason:sent?undefined:'WhatsApp is not configured or rejected the message.'});
});
app.post('/api/admin/notify-order',async(req,res)=>{if(!authenticateAdmin(req,res))return;if(!supabase)return res.status(503).json({ok:false,notificationSent:false,reason:'Supabase server credentials are not configured.'});const id=String(req.body?.orderId||'').trim();if(!id)return res.status(400).json({ok:false,notificationSent:false,reason:'Order ID is required.'});const {data,error}=await supabase.from('orders').select('*').eq('id',id).single();if(error||!data)return res.status(404).json({ok:false,notificationSent:false,reason:'Order not found.'});const sent=await notifyWhatsApp(data);res.status(sent?200:202).json({ok:true,notificationSent:sent,reason:sent?undefined:'WhatsApp is not configured or rejected the message.'});
});
app.post('/api/whatsapp/webhook',(req,res)=>{if(!verifyWasenderWebhook(req))return res.status(401).json({ok:false,error:'Invalid webhook signature.'});const payload=req.body||{};const event=String(payload.event||'unknown');console.log(`Wasender webhook: ${event}`);if(event==='session.status'){console.log('Wasender session status:',payload.data?.status||'unknown');}else if(event==='messages-personal.received'||event==='messages.upsert'){const message=payload.data?.messages||payload.data?.message||payload.data;const sender=message?.key?.remoteJid||message?.cleanedSenderPn||message?.from||'unknown';const text=message?.messageBody||message?.text||message?.content||'';console.log('WhatsApp incoming message:',{sender,text:event==='messages-personal.received'?text:'[message event]'});}else if(event==='message.sent'||event==='message-receipt.update'||event==='messages.update'){console.log('Wasender message update received.');}res.status(200).json({received:true});});
registerDriverRoutes(app,supabase,SESSION_SECRET,authenticateAdmin,notifyWhatsApp);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const esbuildBin = path.join(__dirname, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');

if (existsSync(esbuildBin)) {
  try {
    chmodSync(esbuildBin, 0o755);
    console.log('Prepared esbuild executable for production build.');
  } catch (error) {
    console.warn('Could not chmod esbuild executable:', error);
  }
}

if (!existsSync(path.join(distPath, 'index.html'))) {
  console.log('Production build missing; running Vite build before serving.');
  try {
    const viteCli = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
    if (!existsSync(viteCli)) throw new Error(`Vite CLI not found: ${viteCli}`);
    execFileSync(process.execPath, [viteCli, 'build'], { cwd: __dirname, stdio: 'inherit', env: process.env });
  } catch (error) {
    console.error('Production build failed:', error);
    process.exit(1);
  }
}

if (!existsSync(path.join(distPath, 'index.html'))) {
  console.error(`Production build completed but dist/index.html is still missing: ${distPath}`);
  process.exit(1);
}

app.use(express.static(distPath));
app.get('*',(_req,res)=>res.sendFile(path.join(distPath,'index.html')));
app.listen(PORT,'0.0.0.0',()=>console.log(`TerangaEats server running on port ${PORT}; static files: ${distPath}`));
