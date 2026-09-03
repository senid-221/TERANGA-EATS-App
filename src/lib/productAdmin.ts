import { Product } from '../types';

const request = async (url: string, method: string, productOrId: Product | string, token: string | null) => {
  const isProduct = typeof productOrId !== 'string';
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(isProduct ? { product: productOrId } : undefined),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Admin product API failed:', result?.error || response.statusText);
    return false;
  }
  return Boolean(result?.ok);
};

export const saveProduct = async (product: Product, token?: string | null): Promise<boolean> => {
  if (!token) return false;
  const method = product.createdAt ? 'PUT' : 'POST';
  const url = method === 'PUT' ? `/api/admin/products/${encodeURIComponent(product.id)}` : '/api/admin/products';
  return request(url, method, product, token);
};

export const removeProduct = async (productId: string, token?: string | null): Promise<boolean> => {
  if (!token) return false;
  return request(`/api/admin/products/${encodeURIComponent(productId)}`, 'DELETE', productId, token);
};
