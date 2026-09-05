import crypto from 'crypto';

const PAYMENT_METHODS = new Set(['wave', 'orange_money', 'mtn', 'cash_on_delivery']);

const cleanText = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const finiteMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

const normalizeAddress = (address, customer) => {
  const a = address && typeof address === 'object' ? address : {};
  const lat = Number(a.lat);
  const lng = Number(a.lng);
  return {
    fullName: cleanText(a.fullName || customer.name, 120),
    phone: cleanText(a.phone || customer.phone, 40),
    email: cleanText(a.email || customer.email, 160) || undefined,
    neighborhood: cleanText(a.neighborhood, 160),
    streetAddress: cleanText(a.streetAddress, 300),
    buildingInfo: cleanText(a.buildingInfo, 300) || undefined,
    instructions: cleanText(a.instructions, 500) || undefined,
    ...(Number.isFinite(lat) && lat >= -90 && lat <= 90 ? { lat } : {}),
    ...(Number.isFinite(lng) && lng >= -180 && lng <= 180 ? { lng } : {}),
  };
};

const selectedOptionPrice = (product, selected) => {
  if (!Array.isArray(selected) || selected.length === 0) return { price: 0, valid: true };
  const groups = Array.isArray(product.options) ? product.options : [];
  let total = 0;
  for (const option of selected) {
    const group = groups.find(g => g?.id === option?.groupId);
    const choice = group?.choices?.find(c => c?.id === option?.choiceId);
    if (!group || !choice) return { price: 0, valid: false };
    total += Math.max(0, Number(choice.price) || 0);
  }
  return { price: total, valid: true };
};

const publicOrder = row => ({
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerEmail: row.customer_email || row.delivery_address?.email || '',
  restaurantId: row.restaurant_id,
  restaurantName: row.restaurant_name,
  restaurantLogo: row.restaurant_logo,
  restaurantPhone: row.restaurant_phone,
  restaurantAddress: row.restaurant_address,
  driver: row.driver || undefined,
  items: row.items || [],
  subtotal: row.subtotal,
  deliveryFee: row.delivery_fee,
  discount: row.discount,
  promoCode: row.promo_code || undefined,
  total: row.total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  orderStatus: row.order_status,
  deliveryAddress: row.delivery_address || {},
  createdAt: row.created_at,
  estimatedDeliveryTime: row.estimated_delivery_time,
  deliveredAt: row.delivered_at,
  statusHistory: row.status_history || [],
});

export const registerOrderRoutes = (app, { supabase, notifyWhatsApp }) => {
  app.post('/api/orders', async (req, res) => {
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });

    try {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const customer = payload.customer && typeof payload.customer === 'object' ? payload.customer : {};
      const name = cleanText(customer.name, 120);
      const phone = cleanText(customer.phone, 40);
      const email = cleanText(customer.email, 160);
      const restaurantId = cleanText(payload.restaurantId, 120);
      const clientItems = Array.isArray(payload.items) ? payload.items : [];
      const paymentMethod = cleanText(payload.paymentMethod, 40);
      const deliveryFee = finiteMoney(payload.deliveryFee);

      if (!name || !phone || !email || !restaurantId || !clientItems.length || !PAYMENT_METHODS.has(paymentMethod) || deliveryFee === null) {
        return res.status(400).json({ ok: false, error: 'Complete customer, restaurant, items, delivery and payment information are required.' });
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id,name,logo_url,phone,address,estimated_delivery_time,is_open')
        .eq('id', restaurantId)
        .single();
      if (restaurantError || !restaurant) return res.status(400).json({ ok: false, error: 'Restaurant is not available.' });
      if (restaurant.is_open === false) return res.status(409).json({ ok: false, error: 'This restaurant is currently closed.' });

      const productIds = [...new Set(clientItems.map(item => cleanText(item?.productId, 120)).filter(Boolean))];
      if (!productIds.length) return res.status(400).json({ ok: false, error: 'Order contains no valid products.' });
      const { data: products, error: productError } = await supabase.from('products').select('*').in('id', productIds);
      if (productError) return res.status(500).json({ ok: false, error: 'Unable to validate order products.' });
      const productMap = new Map((products || []).map(p => [p.id, p]));

      const sanitizedItems = [];
      let subtotal = 0;
      for (const item of clientItems) {
        const productId = cleanText(item?.productId, 120);
        const product = productMap.get(productId);
        const quantity = Number(item?.quantity);
        if (!product || product.restaurant_id !== restaurantId || product.available === false || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
          return res.status(400).json({ ok: false, error: 'One or more products are unavailable or invalid.' });
        }
        const optionResult = selectedOptionPrice(product, item?.selectedOptions);
        if (!optionResult.valid) return res.status(400).json({ ok: false, error: 'One or more product options are invalid.' });
        const unitPrice = Math.round(Number(product.price) || 0) + optionResult.price;
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;
        sanitizedItems.push({
          id: cleanText(item?.id, 160) || `item-${crypto.randomUUID()}`,
          productId,
          product,
          restaurantId,
          restaurantName: restaurant.name,
          quantity,
          selectedOptions: Array.isArray(item?.selectedOptions) ? item.selectedOptions : [],
          specialInstructions: cleanText(item?.specialInstructions, 500) || undefined,
          unitPrice,
          totalPrice,
        });
      }

      let discount = 0;
      let promoCode = null;
      const requestedPromo = cleanText(payload.promoCode, 80).toUpperCase();
      if (requestedPromo) {
        const { data: promo } = await supabase.from('promotions').select('*').eq('code', requestedPromo).eq('is_active', true).single();
        if (promo && (!promo.valid_until || new Date(promo.valid_until).getTime() >= Date.now()) && subtotal >= Number(promo.min_order_value || 0)) {
          promoCode = promo.code;
          discount = promo.discount_type === 'fixed'
            ? Math.min(subtotal, Math.round(Number(promo.discount_value) || 0))
            : Math.min(subtotal, Math.round(subtotal * (Number(promo.discount_value) || 0) / 100));
        }
      }

      const total = Math.max(0, subtotal + deliveryFee - discount);
      const now = new Date().toISOString();
      const orderId = `TE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const address = normalizeAddress(payload.deliveryAddress, { name, phone, email });
      if (!address.streetAddress || !address.neighborhood) return res.status(400).json({ ok: false, error: 'Delivery address is required.' });

      const row = {
        id: orderId,
        user_id: cleanText(payload.userId, 160) || `guest-${crypto.randomUUID()}`,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        restaurant_id: restaurantId,
        restaurant_name: restaurant.name,
        restaurant_logo: restaurant.logo_url || '',
        restaurant_phone: restaurant.phone || '',
        restaurant_address: restaurant.address || '',
        driver: null,
        items: sanitizedItems,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        promo_code: promoCode,
        total,
        payment_method: paymentMethod,
        // No payment provider is wired into this app yet; never pretend an online payment succeeded.
        payment_status: paymentMethod === 'cash_on_delivery' ? 'cash_pending' : 'pending',
        order_status: 'pending',
        delivery_address: address,
        status_history: [{ status: 'pending', timestamp: now, noteFR: 'Commande reçue et transmise.', noteEN: 'Order received and submitted.' }],
        created_at: now,
        estimated_delivery_time: restaurant.estimated_delivery_time || '25–35 min',
      };

      const { data: saved, error: insertError } = await supabase.from('orders').insert(row).select('*').single();
      if (insertError || !saved) {
        console.error('Production order insert failed:', insertError);
        return res.status(500).json({ ok: false, error: 'Unable to save the order.' });
      }

      let notificationSent = false;
      if (typeof notifyWhatsApp === 'function') notificationSent = await notifyWhatsApp(saved, 'new_order');
      res.status(201).json({ ok: true, order: publicOrder(saved), notificationSent });
    } catch (error) {
      console.error('Production order API failed:', error);
      res.status(500).json({ ok: false, error: 'Unable to create the order.' });
    }
  });
};
