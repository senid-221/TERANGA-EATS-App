import crypto from 'crypto';

const COOKIE = 'teranga_driver_session';
const SESSION_DAYS = 7;

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, expectedHex] = String(stored || '').split(':');
  if (!salt || !expectedHex) return false;
  try {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
};

const sign = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const makeSession = (driverId, secret) => {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${driverId}|${expires}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload, secret)}`;
};
const getCookie = (req, name) => String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
const readSession = (req, secret) => {
  const token = getCookie(req, COOKIE);
  if (!token || !secret) return null;
  const [encoded, signature] = token.split('.');
  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    const expected = sign(payload, secret);
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const [driverId, expiry] = payload.split('|');
    return driverId && Number(expiry) > Date.now() ? driverId : null;
  } catch { return null; }
};

const publicDriver = d => ({
  id: d.id, fullName: d.full_name, phone: d.phone, email: d.email || '', photoUrl: d.photo_url || '',
  vehicleType: d.vehicle_type || 'Moto', vehiclePlate: d.vehicle_plate || '', rating: Number(d.rating || 5),
  totalDeliveries: Number(d.total_deliveries || 0), active: Boolean(d.active)
});

const orderForDriver = row => ({
  id: row.id, userId: row.user_id, customerName: row.customer_name, customerPhone: row.customer_phone,
  customerEmail: row.customer_email || row.delivery_address?.email || '', restaurantId: row.restaurant_id,
  restaurantName: row.restaurant_name, restaurantLogo: row.restaurant_logo, restaurantPhone: row.restaurant_phone,
  restaurantAddress: row.restaurant_address, driver: row.driver || undefined, items: row.items || [], subtotal: row.subtotal,
  deliveryFee: row.delivery_fee, discount: row.discount, promoCode: row.promo_code || undefined, total: row.total,
  paymentMethod: row.payment_method, paymentStatus: row.payment_status, orderStatus: row.order_status,
  deliveryAddress: row.delivery_address || {}, createdAt: row.created_at, estimatedDeliveryTime: row.estimated_delivery_time,
  deliveredAt: row.delivered_at, statusHistory: row.status_history || []
});

export const registerDriverRoutes = (app, supabase, sessionSecret, authenticateAdmin) => {
  const secret = `${sessionSecret}:driver`;
  const requireDriver = async (req, res) => {
    const driverId = readSession(req, secret);
    if (!driverId) { res.status(401).json({ ok: false, error: 'Driver authentication required.' }); return null; }
    if (!supabase) { res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' }); return null; }
    const { data: driver, error } = await supabase.from('drivers').select('*').eq('id', driverId).eq('active', true).single();
    if (error || !driver) { res.status(401).json({ ok: false, error: 'Driver account is inactive or unavailable.' }); return null; }
    return driver;
  };

  app.post('/api/driver/login', async (req, res) => {
    if (!supabase || !sessionSecret) return res.status(503).json({ ok: false, error: 'Driver authentication is not configured.' });
    const login = String(req.body?.login || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!login || !password) return res.status(400).json({ ok: false, error: 'Login and password are required.' });
    const { data: drivers } = await supabase.from('drivers').select('*').eq('active', true).or(`id.eq.${login},email.eq.${login},phone.eq.${login}`);
    const driver = (drivers || []).find(d => verifyPassword(password, d.password_hash));
    if (!driver) return res.status(401).json({ ok: false, error: 'Identifiants Driver incorrects.' });
    res.setHeader('Set-Cookie', `${COOKIE}=${makeSession(driver.id, secret)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`);
    res.json({ ok: true, driver: publicDriver(driver) });
  });

  app.post('/api/driver/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    res.json({ ok: true });
  });

  app.get('/api/driver/session', async (req, res) => {
    const driver = await requireDriver(req, res);
    if (!driver) return;
    res.json({ ok: true, driver: publicDriver(driver) });
  });

  app.get('/api/driver/orders', async (req, res) => {
    const driver = await requireDriver(req, res);
    if (!driver) return;
    const { data, error } = await supabase.from('orders').select('*').eq('driver_id', driver.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ ok: false, error: 'Unable to load assigned orders.' });
    res.json({ ok: true, orders: (data || []).map(orderForDriver) });
  });

  app.patch('/api/driver/orders/:id/status', async (req, res) => {
    const driver = await requireDriver(req, res);
    if (!driver) return;
    const allowed = new Set(['picked_up', 'delivering', 'driver_arrived', 'delivered']);
    const status = String(req.body?.status || '');
    if (!allowed.has(status)) return res.status(400).json({ ok: false, error: 'Invalid driver status.' });
    const { data: order } = await supabase.from('orders').select('status_history,driver_id').eq('id', req.params.id).single();
    if (!order || order.driver_id !== driver.id) return res.status(404).json({ ok: false, error: 'Order not assigned to this driver.' });
    const now = new Date().toISOString();
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    const { error } = await supabase.from('orders').update({ order_status: status, status_history: [...history, { status, timestamp: now, noteFR: `Statut livreur : ${status}`, noteEN: `Driver status: ${status}` }], delivered_at: status === 'delivered' ? now : null }).eq('id', req.params.id).eq('driver_id', driver.id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    if (status === 'delivered') await supabase.from('drivers').update({ total_deliveries: Number(driver.total_deliveries || 0) + 1 }).eq('id', driver.id);
    res.json({ ok: true });
  });

  app.post('/api/driver/location', async (req, res) => {
    const driver = await requireDriver(req, res);
    if (!driver) return;
    const orderId = String(req.body?.orderId || '').trim();
    const lat = Number(req.body?.lat); const lng = Number(req.body?.lng); const accuracy = Number(req.body?.accuracy || 0);
    if (!orderId || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ ok: false, error: 'Invalid driver location.' });
    const { data: order } = await supabase.from('orders').select('driver').eq('id', orderId).eq('driver_id', driver.id).single();
    if (!order) return res.status(403).json({ ok: false, error: 'Order not assigned to this driver.' });
    const current = order.driver || {};
    const nextDriver = { ...current, id: driver.id, name: driver.full_name, phone: driver.phone, photoUrl: driver.photo_url || '', rating: Number(driver.rating || 5), totalDeliveries: Number(driver.total_deliveries || 0), vehicleType: driver.vehicle_type || 'Moto', vehiclePlate: driver.vehicle_plate || '', currentLat: lat, currentLng: lng, lastLocationAt: new Date().toISOString(), locationAccuracy: accuracy };
    const { error } = await supabase.from('orders').update({ driver: nextDriver }).eq('id', orderId).eq('driver_id', driver.id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    res.json({ ok: true, lat, lng, accuracy });
  });

  app.get('/api/admin/drivers', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    const { data, error } = await supabase.from('drivers').select('id,full_name,phone,email,photo_url,vehicle_type,vehicle_plate,rating,total_deliveries,active').order('full_name');
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, drivers: (data || []).map(publicDriver) });
  });

  app.post('/api/admin/drivers', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    const id = String(req.body?.id || '').trim(); const fullName = String(req.body?.fullName || '').trim(); const password = String(req.body?.password || '');
    if (!id || !fullName || password.length < 6) return res.status(400).json({ ok: false, error: 'Driver ID, name and a password of at least 6 characters are required.' });
    const row = { id, full_name: fullName, phone: String(req.body?.phone || '').trim(), email: String(req.body?.email || '').trim() || null, vehicle_type: String(req.body?.vehicleType || 'Moto'), vehicle_plate: String(req.body?.vehiclePlate || ''), password_hash: hashPassword(password), active: true };
    const { error } = await supabase.from('drivers').insert(row);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    res.json({ ok: true, driver: publicDriver(row) });
  });

  app.patch('/api/admin/orders/:id/assign-driver', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    const driverId = String(req.body?.driverId || '').trim();
    const { data: driver } = await supabase.from('drivers').select('id,full_name,phone,photo_url,vehicle_type,vehicle_plate,rating,total_deliveries,active').eq('id', driverId).single();
    if (!driver || !driver.active) return res.status(404).json({ ok: false, error: 'Driver not found or inactive.' });
    const { data: order } = await supabase.from('orders').select('status_history').eq('id', req.params.id).single();
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
    const now = new Date().toISOString(); const history = Array.isArray(order.status_history) ? order.status_history : [];
    const driverInfo = { id: driver.id, name: driver.full_name, phone: driver.phone, photoUrl: driver.photo_url || '', rating: Number(driver.rating || 5), totalDeliveries: Number(driver.total_deliveries || 0), vehicleType: driver.vehicle_type || 'Moto', vehiclePlate: driver.vehicle_plate || '' };
    const { error } = await supabase.from('orders').update({ driver_id: driver.id, driver: driverInfo, order_status: 'assigned', status_history: [...history, { status: 'assigned', timestamp: now, noteFR: `Livreur assigné : ${driver.full_name}`, noteEN: `Driver assigned: ${driver.full_name}` }] }).eq('id', req.params.id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    res.json({ ok: true, driver: driverInfo });
  });
};

export { hashPassword };
