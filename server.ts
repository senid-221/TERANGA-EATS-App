import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface OrderItemPayload {
  nameFR?: string;
  nameEN?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface OrderNotificationPayload {
  order?: {
    id: string;
    customerName: string;
    customerPhone: string;
    restaurantName: string;
    items: OrderItemPayload[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    paymentMethod: string;
    deliveryAddress: {
      neighborhood?: string;
      streetAddress?: string;
      buildingInfo?: string;
      instructions?: string;
      lat?: number;
      lng?: number;
    };
  };
}

const formatMoney = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0))} FCFA`;

const buildMapsLink = (address: OrderNotificationPayload['order']['deliveryAddress']) => {
  if (typeof address?.lat === 'number' && typeof address?.lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.lat},${address.lng}`)}`;
  }

  const query = [address?.streetAddress, address?.buildingInfo, address?.neighborhood]
    .filter(Boolean)
    .join(', ');
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : 'https://www.google.com/maps';
};

const buildOrderMessage = (order: NonNullable<OrderNotificationPayload['order']>) => {
  const items = order.items
    .map((item) => `• ${item.quantity || 1} × ${item.nameFR || item.nameEN || 'Produit'} — ${formatMoney(item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 1))}`)
    .join('\n');

  const address = order.deliveryAddress;
  const addressText = [address.neighborhood, address.streetAddress, address.buildingInfo]
    .filter(Boolean)
    .join(', ') || 'Adresse non précisée';

  return [
    '🛎️ *NOUVELLE COMMANDE — TERANGAEATS*',
    '',
    `🆔 Commande : *${order.id}*`,
    `👤 Client : *${order.customerName}*`,
    `📱 WhatsApp/Tél : *${order.customerPhone}*`,
    `🍽️ Restaurant : *${order.restaurantName}*`,
    '',
    '🛒 *Produits :*',
    items || '• Aucun produit',
    '',
    `Sous-total : ${formatMoney(order.subtotal)}`,
    `Livraison : ${formatMoney(order.deliveryFee)}`,
    `Réduction : ${formatMoney(order.discount)}`,
    `💰 *TOTAL : ${formatMoney(order.total)}*`,
    `💳 Paiement : ${order.paymentMethod}`,
    '',
    `📍 *Livraison :* ${addressText}`,
    address.instructions ? `📝 Instructions : ${address.instructions}` : '',
    `🗺️ *Google Maps :* ${buildMapsLink(address)}`,
  ].filter(Boolean).join('\n');
};

const sendWhatsAppOrderNotification = async (order: NonNullable<OrderNotificationPayload['order']>) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!accessToken || !phoneNumberId || !adminNumber) {
    return {
      sent: false,
      configured: false,
      reason: 'WhatsApp credentials are not configured on the server.',
    };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: adminNumber.replace(/\D/g, ''),
      type: 'text',
      text: {
        preview_url: true,
        body: buildOrderMessage(order),
      },
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('WhatsApp order notification failed:', result);
    return { sent: false, configured: true, reason: 'WhatsApp API rejected the message.' };
  }

  return { sent: true, configured: true, messageId: result?.messages?.[0]?.id };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '256kb' }));

  // Customer order -> server -> WhatsApp Cloud API -> Admin WhatsApp.
  // Secrets stay server-side and are never exposed through VITE_* variables.
  app.post('/api/admin/notify-order', async (req, res) => {
    try {
      const order = (req.body as OrderNotificationPayload).order;
      if (!order?.id || !order.customerName || !order.customerPhone) {
        return res.status(400).json({ ok: false, error: 'Invalid order notification payload.' });
      }

      const result = await sendWhatsAppOrderNotification(order);
      if (!result.configured) {
        console.warn('Order saved, but WhatsApp notification is not configured.');
        return res.status(202).json({ ok: true, notificationSent: false, reason: result.reason });
      }

      if (!result.sent) {
        return res.status(502).json({ ok: false, notificationSent: false, reason: result.reason });
      }

      return res.json({ ok: true, notificationSent: true, messageId: result.messageId });
    } catch (error) {
      console.error('Order WhatsApp notification route error:', error);
      return res.status(500).json({ ok: false, notificationSent: false, error: 'Unable to send WhatsApp notification.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
