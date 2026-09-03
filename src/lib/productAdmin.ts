import { Product } from '../types';

const request = async (url: string, method: string, productOrId: Product | string) => {
  const isProduct = typeof productOrId !== 'string';
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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
  const shouldCreate = create || product.id.startsWith('prod-');
  const method = shouldCreate ? 'POST' : 'PUT';
  const url = shouldCreate ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.id)}`;
  return request(url, method, product);
};

export const createProduct = async (product: Product, token?: string | null): Promise<boolean> => saveProduct(product, token, true);

export const removeProduct = async (productId: string, _token?: string | null): Promise<boolean> =>
  request(`/api/admin/products/${encodeURIComponent(productId)}`, 'DELETE', productId);
