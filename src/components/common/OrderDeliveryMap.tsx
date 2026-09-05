import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsWrapper } from '../maps/GoogleMapsWrapper';
import { DriverInfo } from '../../types';
import { MapPin, Motorbike, Navigation, Clock, Utensils } from 'lucide-react';

interface OrderDeliveryMapProps {
  restaurant: { name: string; latitude: number; longitude: number; address: string; logoUrl?: string };
  deliveryAddress: { neighborhood: string; street?: string; latitude?: number; longitude?: number };
  driver?: DriverInfo;
  estimatedTime?: string;
  progressPercent?: number;
}

const MapController: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { if (map) { map.panTo(center); map.setZoom(zoom); } }, [map, center.lat, center.lng, zoom]);
  return null;
};

export const OrderDeliveryMap: React.FC<OrderDeliveryMapProps> = ({ restaurant, deliveryAddress, driver, estimatedTime = '25–35 min' }) => {
  const destLat = Number.isFinite(deliveryAddress.latitude) ? Number(deliveryAddress.latitude) : 14.6708;
  const destLng = Number.isFinite(deliveryAddress.longitude) ? Number(deliveryAddress.longitude) : -17.4381;
  const restLat = Number.isFinite(restaurant.latitude) ? Number(restaurant.latitude) : 14.7118;
  const restLng = Number.isFinite(restaurant.longitude) ? Number(restaurant.longitude) : -17.4699;
  const hasGps = Boolean(driver && Number.isFinite(driver.currentLat) && Number.isFinite(driver.currentLng));
  const driverPosition = hasGps ? { lat: Number(driver.currentLat), lng: Number(driver.currentLng) } : null;
  const [activeMarker, setActiveMarker] = useState<'restaurant' | 'driver' | 'destination' | null>(hasGps ? 'driver' : 'restaurant');
  const [focusTarget, setFocusTarget] = useState<'driver' | 'all'>(hasGps ? 'driver' : 'all');
  const mapCenter = focusTarget === 'driver' && driverPosition ? driverPosition : { lat: (restLat + destLat) / 2, lng: (restLng + destLng) / 2 };

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-[32px] overflow-hidden shadow-artistic-lg border border-[#F0EDE8] bg-slate-900">
      <GoogleMapsWrapper fallbackHeight="h-72 sm:h-80">
        <Map defaultCenter={mapCenter} defaultZoom={14} mapId="DEMO_MAP_ID" internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']} gestureHandling="greedy" disableDefaultUI={false} className="w-full h-full">
          <MapController center={mapCenter} zoom={focusTarget === 'driver' && driverPosition ? 15 : 13} />
          <AdvancedMarker position={{ lat: restLat, lng: restLng }} onClick={() => setActiveMarker('restaurant')} title={restaurant.name}>
            <div className="flex flex-col items-center cursor-pointer"><div className="w-10 h-10 rounded-2xl bg-[#FFCC00] text-amber-950 flex items-center justify-center shadow-xl ring-4 ring-[#FFCC00]/40 border border-amber-400"><Utensils className="w-5 h-5" /></div><span className="text-[10px] font-black text-white bg-black/80 px-2 py-0.5 rounded-md mt-1 whitespace-nowrap">{restaurant.name}</span></div>
          </AdvancedMarker>

          {driverPosition && driver && (
            <AdvancedMarker position={driverPosition} onClick={() => setActiveMarker('driver')} title={driver.name}>
              <div className="flex flex-col items-center cursor-pointer"><div className="relative"><div className="w-12 h-12 rounded-full bg-[#006633] text-[#FFCC00] flex items-center justify-center shadow-2xl ring-4 ring-white border-2 border-[#FFCC00]"><Motorbike className="w-6 h-6" /></div><span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E8702A] animate-ping" /></div><span className="text-[10px] font-black text-white bg-[#006633] px-2.5 py-0.5 rounded-full mt-1 shadow-md whitespace-nowrap">{driver.name} 🛵</span></div>
            </AdvancedMarker>
          )}

          <AdvancedMarker position={{ lat: destLat, lng: destLng }} onClick={() => setActiveMarker('destination')} title={deliveryAddress.neighborhood}>
            <div className="flex flex-col items-center cursor-pointer"><div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl ring-4 ring-red-400/40"><MapPin className="w-5 h-5 fill-white text-red-600" /></div><span className="text-[10px] font-black text-white bg-black/80 px-2 py-0.5 rounded-md mt-1 whitespace-nowrap">{deliveryAddress.neighborhood}</span></div>
          </AdvancedMarker>

          {activeMarker === 'driver' && driverPosition && driver && <InfoWindow position={driverPosition} onCloseClick={() => setActiveMarker(null)}><div className="p-1 text-slate-900 max-w-[210px]"><p className="font-black text-xs text-[#006633]">🛵 {driver.name}</p><p className="text-[11px] text-gray-600 mt-1">{driver.vehicleType} • {driver.vehiclePlate}</p><p className="text-[10px] text-emerald-700 font-bold mt-1">Position GPS du livreur en direct</p></div></InfoWindow>}
          {activeMarker === 'restaurant' && <InfoWindow position={{ lat: restLat, lng: restLng }} onCloseClick={() => setActiveMarker(null)}><div className="p-1 text-slate-900"><p className="font-black text-xs text-amber-700">{restaurant.name}</p><p className="text-[11px] text-gray-600 mt-1">{restaurant.address || 'Adresse restaurant non renseignée'}</p></div></InfoWindow>}
          {activeMarker === 'destination' && <InfoWindow position={{ lat: destLat, lng: destLng }} onCloseClick={() => setActiveMarker(null)}><div className="p-1 text-slate-900"><p className="font-black text-xs text-red-700">Zone de livraison</p><p className="text-[11px] text-gray-600 mt-1">{deliveryAddress.neighborhood}{deliveryAddress.street ? ` • ${deliveryAddress.street}` : ''}</p></div></InfoWindow>}
        </Map>
      </GoogleMapsWrapper>

      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md rounded-2xl p-2 px-3 text-white text-xs flex items-center gap-2 border border-white/10 z-10"><span className={`w-2.5 h-2.5 rounded-full ${hasGps ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} /><span className="font-bold text-[11px] tracking-wide">{hasGps ? 'GPS livreur en direct' : 'GPS livreur en attente'}</span></div>
      <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md rounded-2xl p-2 px-3 text-white text-xs space-y-0.5 border border-white/10 z-10 text-right"><div className="flex items-center gap-1.5 font-black text-[#FFCC00] justify-end"><Clock className="w-3.5 h-3.5" /><span>{estimatedTime}</span></div><p className="text-[10px] text-gray-300">{deliveryAddress.neighborhood}</p></div>
      <div className="absolute bottom-3 right-3 z-10"><button onClick={() => setFocusTarget(focusTarget === 'driver' && driverPosition ? 'all' : 'driver')} disabled={!driverPosition && focusTarget === 'all'} className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 cursor-pointer border border-gray-200 active:scale-95 disabled:opacity-50"><Navigation className="w-3.5 h-3.5 text-[#006633]" /><span>{focusTarget === 'driver' && driverPosition ? 'Vue globale' : 'Suivre livreur'}</span></button></div>
    </div>
  );
};
