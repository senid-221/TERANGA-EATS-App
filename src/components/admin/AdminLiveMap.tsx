import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, AdvancedMarker, InfoWindow, Map } from '@vis.gl/react-google-maps';
import { Activity, LocateFixed, MapPin, RefreshCw, Truck, UserRound } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

type Driver = {
  id: string;
  name?: string;
  fullName?: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  active?: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationAt?: string;
};

const ACTIVE: OrderStatus[] = ['assigned', 'picked_up', 'delivering', 'driver_arrived'];
const DAKAR = { lat: 14.7167, lng: -17.4677 };

const driverFromOrder = (order: Order): Driver | null => {
  const d = order.driver;
  if (!d?.id) return null;
  return {
    id: String(d.id),
    name: d.name,
    fullName: d.name,
    phone: d.phone,
    vehicleType: d.vehicleType,
    vehiclePlate: d.vehiclePlate,
    active: true,
    currentLat: Number(d.currentLat),
    currentLng: Number(d.currentLng),
    lastLocationAt: d.lastLocationAt,
  };
};

export const AdminLiveMap: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersResponse, driversResponse] = await Promise.all([
        fetch('/api/admin/orders', { credentials: 'include' }),
        fetch('/api/admin/drivers', { credentials: 'include' }),
      ]);
      const orderData = await ordersResponse.json().catch(() => ({}));
      const driverData = await driversResponse.json().catch(() => ({}));
      if (ordersResponse.ok && Array.isArray(orderData.orders)) setOrders(orderData.orders);
      if (driversResponse.ok && Array.isArray(driverData.drivers)) setDrivers(driverData.drivers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const live = useMemo(() => {
    const map = new Map<string, { driver: Driver; order: Order }>();
    orders.forEach((order) => {
      if (!ACTIVE.includes(order.orderStatus)) return;
      const d = driverFromOrder(order);
      if (!d || !Number.isFinite(d.currentLat) || !Number.isFinite(d.currentLng)) return;
      map.set(d.id, { driver: d, order });
    });
    return Array.from(map.values());
  }, [orders]);

  const selectedItem = live.find((item) => item.driver.id === selected);
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const center = selectedItem && Number.isFinite(selectedItem.driver.currentLat) && Number.isFinite(selectedItem.driver.currentLng)
    ? { lat: Number(selectedItem.driver.currentLat), lng: Number(selectedItem.driver.currentLng) }
    : (live[0] ? { lat: Number(live[0].driver.currentLat), lng: Number(live[0].driver.currentLng) } : DAKAR);

  return (
    <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><LocateFixed className="w-5 h-5 text-[#006633]" /><h3 className="font-heading font-black text-lg">Live Driver Map</h3><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black"><Activity className="w-3 h-3" /> LIVE</span></div>
          <p className="text-xs text-gray-500 mt-1">Position GPS des livreurs en livraison · actualisation automatique toutes les 3 secondes.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="self-start p-2.5 rounded-xl bg-[#F7F5F0] text-gray-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Drivers GPS live" value={live.length} />
        <Stat label="En livraison" value={live.filter(x => x.order.orderStatus === 'delivering').length} />
        <Stat label="Assignés" value={live.filter(x => x.order.orderStatus === 'assigned').length} />
        <Stat label="Commandes actives" value={orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length} />
      </div>

      {!apiKey ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-black">Google Maps API key manquante</p>
          <p className="text-xs mt-1">Ajoutez <code className="font-black">VITE_GOOGLE_MAPS_API_KEY</code> dans les variables d'environnement du build pour afficher la carte interactive. Les positions GPS restent visibles ci-dessous.</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[28px] border border-[#E5E0D8] h-[420px] bg-[#EEF2F0]">
          <APIProvider apiKey={apiKey}>
            <Map defaultCenter={center} center={center} defaultZoom={12} mapId="TERANGA_EATS_ADMIN_LIVE" gestureHandling="greedy" disableDefaultUI={false}>
              {live.map(({ driver, order }) => (
                <AdvancedMarker key={driver.id} position={{ lat: Number(driver.currentLat), lng: Number(driver.currentLng) }} onClick={() => setSelected(driver.id)}>
                  <div className="relative flex flex-col items-center cursor-pointer">
                    <div className="w-11 h-11 rounded-full bg-[#006633] border-4 border-white shadow-xl flex items-center justify-center text-white"><Truck className="w-5 h-5" /></div>
                    <div className="absolute -bottom-2 w-3 h-3 rotate-45 bg-[#006633]" />
                  </div>
                </AdvancedMarker>
              ))}
              {selectedItem && (
                <InfoWindow position={{ lat: Number(selectedItem.driver.currentLat), lng: Number(selectedItem.driver.currentLng) }} onCloseClick={() => setSelected(null)}>
                  <div className="min-w-[220px] p-1 text-gray-900">
                    <p className="font-black">{selectedItem.driver.name || selectedItem.driver.fullName || selectedItem.driver.id}</p>
                    <p className="text-xs font-bold text-[#006633]">{selectedItem.order.id} · {selectedItem.order.orderStatus}</p>
                    <p className="text-xs mt-1">{selectedItem.order.customerName}</p>
                    <p className="text-xs text-gray-500">{selectedItem.order.deliveryAddress?.neighborhood}, {selectedItem.order.deliveryAddress?.streetAddress}</p>
                    <p className="text-[10px] mt-2">GPS: {Number(selectedItem.driver.currentLat).toFixed(5)}, {Number(selectedItem.driver.currentLng).toFixed(5)}</p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {live.map(({ driver, order }) => (
          <button key={driver.id} onClick={() => setSelected(driver.id)} className="text-left rounded-2xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 hover:border-[#006633] transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-xl bg-[#006633] text-white flex items-center justify-center"><UserRound className="w-5 h-5" /></div><div className="min-w-0"><p className="font-black text-sm truncate">{driver.name || driver.fullName || driver.id}</p><p className="text-[11px] text-gray-500">{driver.vehicleType || 'Moto'}{driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ''}</p></div></div>
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black">{order.orderStatus}</span>
            </div>
            <div className="mt-3 space-y-1"><p className="text-xs font-black text-[#006633]">{order.id} · {order.customerName}</p><p className="text-[11px] text-gray-500 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5" />{order.deliveryAddress?.neighborhood}, {order.deliveryAddress?.streetAddress}</p><p className="text-[10px] text-gray-400">GPS {Number(driver.currentLat).toFixed(5)}, {Number(driver.currentLng).toFixed(5)}{driver.lastLocationAt ? ` · ${new Date(driver.lastLocationAt).toLocaleTimeString()}` : ''}</p></div>
          </button>
        ))}
        {live.length === 0 && <div className="md:col-span-2 text-center py-8 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E5E0D8]"><Truck className="w-8 h-8 mx-auto text-gray-300" /><p className="text-sm font-black text-gray-500 mt-2">Nta Driver ufite GPS live ubu.</p><p className="text-xs text-gray-400">Iyo Driver atangiye delivery kandi yemeye GPS, azagaragara hano.</p></div>}
      </div>
    </section>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => <div className="rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] p-3"><p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p><p className="font-heading font-black text-xl mt-1">{value}</p></div>;
