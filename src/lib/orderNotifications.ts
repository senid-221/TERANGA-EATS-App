import { Order } from '../types';

const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const clerk = (window as typeof window & { Clerk?: { session?: { getToken?: () => Promise<string | null> } } }).Clerk;
  return clerk?.session?.getToken ? clerk.session.getToken() : null;
};

export const notifyAdminOfOrder = async (order: Order): Promise<boolean> => {
  try {
    const token = await getClerkToken();
    const response = await fetch('/api/admin/notify-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ order }),
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
