import { Order } from '../types';

export const notifyAdminOfOrder = async (order: Order): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn('Admin WhatsApp notification failed:', result?.reason || response.statusText);
      return false;
    }
    return Boolean(result?.notificationSent);
  } catch (error) {
    console.warn('Admin WhatsApp notification request failed:', error);
    return false;
  }
};
