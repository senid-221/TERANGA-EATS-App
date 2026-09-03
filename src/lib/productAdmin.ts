import { Product } from '../types';

const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const clerk = (window as typeof window & { Clerk?: { session?: { getToken?: () => Promise<string | null> } } }).Clerk;
  return clerk?.session?.getToken ? clerk.session.getToken() : null;
};

const request = async (url: string, method: string, productOrId: Product | string, token: string) => {
  const isProduct = typeof productOrId !== 'string';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(isProduct ? { product: productOrId } : undefined),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Admin product API failed:', result?.error || response.statusText);
    return false;
  }
  return Boolean(result?.ok);
};

export const saveProduct = async (product: Product, _token?: string | null, create = false): Promise<boolean> => {
  const token = _token || await getClerkToken();
  if (!token) return false;
  const method = create ? 'POST' : 'PUT';
  const url = create ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.id)}`;
  return request(url, method, product, token);
};

export const removeProduct = async (productId: string, _token?: string | null): Promise<boolean> => {
  const token = _token || await getClerkToken();
  if (!token) return false;
  return request(`/api/admin/products/${encodeURIComponent(productId)}`, 'DELETE', productId, token);
};
