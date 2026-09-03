import { Order } from '../types';

export const notifyAdminOfOrder = async (order: Order): Promise<boolean> => {
  try {
    // Customer-side order notification endpoint. The order is already saved
    // in Supabase before this request is made.
    const response = await fetch('/api/orders/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 202) {
      console.warn('Admin WhatsApp notification failed:', result?.reason || response.statusText);
      return false;
    }
    return Boolean(result?.notificationSent);
  } catch (error) {
    console.warn('Admin WhatsApp notification request failed:', error);
    return false;
  }
};
