import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { DriverInfo } from '../../types';
import { MapPin, Motorbike, Utensils, Navigation, Clock, ShieldCheck } from 'lucide-react';

interface OrderDeliveryMapProps {
  restaurant: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    logoUrl?: string;
  };
  deliveryAddress: {
    neighborhood: string;
    street?: string;
    latitude?: number;
    longitude?: number;
  };
  driver?: DriverInfo;
  estimatedTime?: string;
  progressPercent?: number; // 0 to 100
}

// Subcomponent to handle camera centering / pan
const MapController: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
};

export const OrderDeliveryMap: React.FC<OrderDeliveryMapProps> = ({
  restaurant,
  deliveryAddress,
  driver,
  estimatedTime = '25–35 min',
  progressPercent = 50,
}) => {
  // Destination coords (fallback to Dakar Plateau if not specified)
  const destLat = deliveryAddress.latitude || 14.6708;
  const destLng = deliveryAddress.longitude || -17.4381;

  // Restaurant coords
  const restLat = restaurant.latitude || 14.7118;
  const restLng = restaurant.longitude || -17.4699;

  // Interpolated driver position along the path based on progressPercent
  const driverLat = restLat + (destLat - restLat) * (progressPercent / 100);
  const driverLng = restLng + (destLng - restLng) * (progressPercent / 100);

  const [activeMarker, setActiveMarker] = useState<'restaurant' | 'driver' | 'destination' | null>('driver');
  const [focusTarget, setFocusTarget] = useState<'driver' | 'all'>('driver');

  // Center calculation
  const mapCenter = focusTarget === 'driver'
    ? { lat: driverLat, lng: driverLng }
    : { lat: (restLat + destLat) / 2, lng: (restLng + destLng) / 2 };

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-[32px] overflow-hidden shadow-artistic-lg border border-[#F0EDE8] bg-slate-900">
      <GoogleMapsWrapper fallbackHeight="h-72 sm:h-80">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <MapController center={mapCenter} zoom={focusTarget === 'driver' ? 15 : 13} />

          {/* Restaurant Marker */}
          <AdvancedMarker
            position={{ lat: restLat, lng: restLng }}
            onClick={() => setActiveMarker('restaurant')}
            title={restaurant.name}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-10 h-10 rounded-2xl bg-[#FFCC00] text-amber-950 flex items-center justify-center shadow-xl ring-4 ring-[#FFCC00]/40 border border-amber-400 transform group-hover:scale-110 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-white bg-black/80 px-2 py-0.5 rounded-md mt-1 shadow-md border border-white/10 whitespace-nowrap">
                {restaurant.name}
              </span>
            </div>
          </AdvancedMarker>

          {/* Real-time Driver Scooter Marker */}
          <AdvancedMarker
            position={{ lat: driverLat, lng: driverLng }}
            onClick={() => setActiveMarker('driver')}
            title={driver?.name || 'Livreur Teranga'}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#006633] text-[#FFCC00] flex items-center justify-center shadow-2xl ring-4 ring-white border-2 border-[#FFCC00] transform group-hover:scale-110 transition-transform">
                  <Motorbike className="w-6 h-6 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E8702A] animate-ping" />
              </div>
              <span className="text-[10px] font-black text-white bg-[#006633] px-2.5 py-0.5 rounded-full mt-1 shadow-md border border-[#FFCC00]/50 whitespace-nowrap">
                {driver?.name || 'Livreur en route'} 🛵
              </span>
            </div>
          </AdvancedMarker>

          {/* Customer Destination Marker */}
          <AdvancedMarker
            position={{ lat: destLat, lng: destLng }}
            onClick={() => setActiveMarker('destination')}
            title={deliveryAddress.neighborhood}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl ring-4 ring-red-400/40 transform group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 fill-white text-red-600" />
              </div>
              <span className="text-[10px] font-black text-white bg-black/80 px-2 py-0.5 rounded-md mt-1 shadow-md border border-white/10 whitespace-nowrap">
                {deliveryAddress.neighborhood}
              </span>
            </div>
          </AdvancedMarker>

          {/* InfoWindows */}
          {activeMarker === 'driver' && (
            <InfoWindow
              position={{ lat: driverLat, lng: driverLng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 text-slate-900 max-w-[200px]">
                <p className="font-black text-xs text-[#006633] flex items-center gap-1">
                  <Motorbike className="w-3.5 h-3.5" />
                  <span>{driver?.name || 'Livreur Teranga'}</span>
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {driver?.vehicle || 'Scooter Express'} • {driver?.phone || '+221 78 123 45 67'}
                </p>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                  En route vers votre adresse à Dakar
                </p>
              </div>
            </InfoWindow>
          )}

          {activeMarker === 'restaurant' && (
            <InfoWindow
              position={{ lat: restLat, lng: restLng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 text-slate-900 max-w-[200px]">
                <p className="font-black text-xs text-amber-700">{restaurant.name}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{restaurant.address}</p>
              </div>
            </InfoWindow>
          )}

          {activeMarker === 'destination' && (
            <InfoWindow
              position={{ lat: destLat, lng: destLng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 text-slate-900 max-w-[200px]">
                <p className="font-black text-xs text-red-700">Adresse de livraison</p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {deliveryAddress.neighborhood} {deliveryAddress.street ? `• ${deliveryAddress.street}` : ''}
                </p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </GoogleMapsWrapper>

      {/* Map Header Floating Overlay Badge */}
      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md rounded-2xl p-2 px-3 text-white text-xs flex items-center gap-2 border border-white/10 z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="font-bold text-[11px] tracking-wide">Google Maps Live Dakar</span>
      </div>

      {/* Floating ETA info */}
      <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md rounded-2xl p-2 px-3 text-white text-xs space-y-0.5 border border-white/10 z-10 text-right">
        <div className="flex items-center gap-1.5 font-black text-[#FFCC00] justify-end">
          <Clock className="w-3.5 h-3.5" />
          <span>{estimatedTime}</span>
        </div>
        <p className="text-[10px] text-gray-300">{deliveryAddress.neighborhood}</p>
      </div>

      {/* Floating Camera Re-center button */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={() => setFocusTarget(focusTarget === 'driver' ? 'all' : 'driver')}
          className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 cursor-pointer border border-gray-200 active:scale-95 transition-all"
          title="Recentrer la carte"
        >
          <Navigation className="w-3.5 h-3.5 text-[#006633]" />
          <span>{focusTarget === 'driver' ? 'Vue globale' : 'Suivre livreur'}</span>
        </button>
      </div>
    </div>
  );
};
