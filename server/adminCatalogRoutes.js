import crypto from 'crypto';

const RESOURCE_CONFIG = {
  restaurants: {
    table: 'restaurants', select: '*',
    normalize: (x) => ({ id: String(x.id || ''), name: String(x.name || ''), description_fr: String(x.description_fr || ''), description_en: String(x.description_en || ''), cuisine: String(x.cuisine || ''), cuisine_types: Array.isArray(x.cuisine_types) ? x.cuisine_types : [], tags: Array.isArray(x.tags) ? x.tags : [], rating: Number(x.rating || 0), review_count: Number(x.review_count || 0), delivery_time: String(x.delivery_time || ''), estimated_delivery_time: String(x.estimated_delivery_time || ''), delivery_fee: Number(x.delivery_fee || 0), min_order: Number(x.min_order || 0), address: String(x.address || ''), neighborhood: String(x.neighborhood || ''), latitude: x.latitude == null ? null : Number(x.latitude), longitude: x.longitude == null ? null : Number(x.longitude), phone: String(x.phone || ''), cover_image_url: x.cover_image_url || null, logo_url: x.logo_url || null, is_halal: x.is_halal !== false, is_popular: Boolean(x.is_popular), is_promoted: Boolean(x.is_promoted), is_partner: x.is_partner !== false, is_open: x.is_open !== false, is_featured: Boolean(x.is_featured) }),
    fields: ['name','description_fr','description_en','cuisine','cuisine_types','tags','delivery_time','estimated_delivery_time','delivery_fee','min_order','address','neighborhood','latitude','longitude','phone','cover_image_url','logo_url','is_halal','is_popular','is_promoted','is_partner','is_open','is_featured']
  },
  categories: {
    table: 'categories', select: '*',
    normalize: (x) => ({ id: String(x.id || ''), name_fr: String(x.name_fr || ''), name_en: String(x.name_en || ''), image_url: x.image_url || null, icon_name: x.icon_name || null, sort_order: Number(x.sort_order || 0), dish_count: Number(x.dish_count || 0) }),
    fields: ['name_fr','name_en','image_url','icon_name','sort_order','dish_count']
  },
  promotions: {
    table: 'promotions', select: '*',
    normalize: (x) => ({ id: String(x.id || ''), code: String(x.code || ''), title_fr: String(x.title_fr || ''), title_en: String(x.title_en || ''), description_fr: String(x.description_fr || ''), description_en: String(x.description_en || ''), image_url: x.image_url || null, discount_type: x.discount_type === 'fixed' ? 'fixed' : 'percentage', discount_value: Number(x.discount_value || 0), min_order_value: Number(x.min_order_value || 0), valid_until: x.valid_until || null, is_active: x.is_active !== false }),
    fields: ['code','title_fr','title_en','description_fr','description_en','image_url','discount_type','discount_value','min_order_value','valid_until','is_active']
  }
};

const fromClient = (resource, item) => {
  const cfg = RESOURCE_CONFIG[resource];
  const source = item && typeof item === 'object' ? item : {};
  const map = { name: source.name, description_fr: source.descriptionFR, description_en: source.descriptionEN, cuisine: source.cuisine, cuisine_types: source.cuisineTypes, tags: source.tags, delivery_time: source.deliveryTime, estimated_delivery_time: source.estimatedDeliveryTime, delivery_fee: source.deliveryFee, min_order: source.minOrder, address: source.address, neighborhood: source.neighborhood, latitude: source.latitude, longitude: source.longitude, phone: source.phone, cover_image_url: source.coverImageUrl, logo_url: source.logoUrl, is_halal: source.isHalal, is_popular: source.isPopular, is_promoted: source.isPromoted, is_partner: source.isPartner, is_open: source.isOpen, is_featured: source.isFeatured, name_fr: source.nameFR, name_en: source.nameEN, image_url: source.imageUrl, icon_name: source.iconName, sort_order: source.sortOrder, dish_count: source.dishCount, code: source.code, title_fr: source.titleFR, title_en: source.titleEN, discount_type: source.discountType, discount_value: source.discountValue, min_order_value: source.minOrderValue, valid_until: source.endDate || source.validUntil, is_active: source.active };
  const out = {};
  for (const field of cfg.fields) if (map[field] !== undefined) out[field] = map[field];
  return out;
};

const toClient = (resource, row) => {
  if (resource === 'restaurants') return { ...RESOURCE_CONFIG.restaurants.normalize(row), descriptionFR: row.description_fr, descriptionEN: row.description_en, cuisineTypes: row.cuisine_types || [], coverImageUrl: row.cover_image_url || '', logoUrl: row.logo_url || '', deliveryTime: row.delivery_time, estimatedDeliveryTime: row.estimated_delivery_time, deliveryFee: Number(row.delivery_fee || 0), minOrder: Number(row.min_order || 0), isHalal: row.is_halal, isPopular: row.is_popular, isPromoted: row.is_promoted, isPartner: row.is_partner, isOpen: row.is_open, isFeatured: row.is_featured };
  if (resource === 'categories') return { ...RESOURCE_CONFIG.categories.normalize(row), nameFR: row.name_fr, nameEN: row.name_en, imageUrl: row.image_url || '', iconName: row.icon_name || '', sortOrder: Number(row.sort_order || 0), dishCount: Number(row.dish_count || 0) };
  return { ...RESOURCE_CONFIG.promotions.normalize(row), titleFR: row.title_fr, titleEN: row.title_en, descriptionFR: row.description_fr, descriptionEN: row.description_en, imageUrl: row.image_url || '', discountType: row.discount_type, discountValue: Number(row.discount_value || 0), minOrderValue: Number(row.min_order_value || 0), startDate: '', endDate: row.valid_until || '', active: row.is_active };
};

const settingsToClient = rows => Object.fromEntries((rows || []).map(r => [r.key, r?.value?.value ?? r.value]));

export function registerAdminCatalogRoutes(app, { supabase, authenticateAdmin }) {
  app.get('/api/admin/catalog', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    try {
      const [restaurants, categories, promotions, settings] = await Promise.all([
        supabase.from('restaurants').select('*').order('name'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('app_settings').select('key,value').order('key')
      ]);
      for (const result of [restaurants, categories, promotions, settings]) if (result.error) throw result.error;
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ok: true, restaurants: restaurants.data.map(r => toClient('restaurants', r)), categories: categories.data.map(r => toClient('categories', r)), promotions: promotions.data.map(r => toClient('promotions', r)), settings: settingsToClient(settings.data) });
    } catch (error) { console.error('Admin catalog load failed:', error); res.status(500).json({ ok: false, error: 'Unable to load catalog.' }); }
  });

  for (const resource of Object.keys(RESOURCE_CONFIG)) {
    const cfg = RESOURCE_CONFIG[resource];
    app.post(`/api/admin/${resource}`, async (req, res) => {
      if (!authenticateAdmin(req, res)) return;
      if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
      const item = req.body?.item || {};
      const id = String(item.id || crypto.randomUUID());
      const payload = { id, ...fromClient(resource, item) };
      if (resource === 'restaurants' && !payload.name) return res.status(400).json({ ok: false, error: 'Restaurant name is required.' });
      if (resource === 'categories' && (!payload.name_fr || !payload.name_en)) return res.status(400).json({ ok: false, error: 'Category names are required.' });
      if (resource === 'promotions' && (!payload.code || !payload.title_fr || !payload.title_en)) return res.status(400).json({ ok: false, error: 'Promotion code and titles are required.' });
      const { data, error } = await supabase.from(cfg.table).insert(payload).select('*').single();
      if (error) return res.status(400).json({ ok: false, error: error.message });
      res.status(201).json({ ok: true, item: toClient(resource, data) });
    });

    app.put(`/api/admin/${resource}/:id`, async (req, res) => {
      if (!authenticateAdmin(req, res)) return;
      if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
      const payload = fromClient(resource, req.body?.item);
      const { data, error } = await supabase.from(cfg.table).update(payload).eq('id', req.params.id).select('*').single();
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 400).json({ ok: false, error: error.code === 'PGRST116' ? 'Item not found.' : error.message });
      res.json({ ok: true, item: toClient(resource, data) });
    });

    app.delete(`/api/admin/${resource}/:id`, async (req, res) => {
      if (!authenticateAdmin(req, res)) return;
      if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
      const { error } = await supabase.from(cfg.table).delete().eq('id', req.params.id);
      if (error) return res.status(400).json({ ok: false, error: error.message });
      res.json({ ok: true });
    });
  }

  app.put('/api/admin/settings', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    const settings = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {};
    const allowed = ['app_name', 'admin_whatsapp', 'default_currency', 'app_logo_url'];
    try {
      for (const key of allowed) {
        if (settings[key] === undefined) continue;
        const { error } = await supabase.from('app_settings').upsert({ key, value: { value: String(settings[key] ?? '') } }, { onConflict: 'key' });
        if (error) throw error;
      }
      res.json({ ok: true });
    } catch (error) { console.error('Admin settings update failed:', error); res.status(400).json({ ok: false, error: 'Unable to save application settings.' }); }
  });
}
