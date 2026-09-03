import React, { useState, useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { Restaurant, DakarNeighborhood } from '../../types';
import { DAKAR_NEIGHBORHOODS } from '../../data/constants';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Star,
  Clock,
  Bike,
  Utensils,
  ChevronRight,
  Compass,
  Layers,
  Filter,
} from 'lucide-react';

interface DakarRestaurantsMapProps {
  restaurants: Restaurant[];
  selectedRestaurantId?: string | null;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  height?: string;
  initialNeighborhoodId?: string;
}

const MapPanController: React.FC<{ target: { lat: number; lng: number } | null; zoom?: number }> = ({
  target,
  zoom = 14,
}) => {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.panTo(target);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, target, zoom]);
  return null;
};

export const DakarRestaurantsMap: React.FC<DakarRestaurantsMapProps> = ({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  height = 'h-96 sm:h-[450px]',
  initialNeighborhoodId,
}) => {
  const { setSelectedRestaurant, setActiveScreen, language } = useApp();

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(
    initialNeighborhoodId || 'all'
  );
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(() => {
    if (selectedRestaurantId) {
      return restaurants.find((r) => r.id === selectedRestaurantId) || null;
    }
    return null;
  });

  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>({
    lat: 14.7167, // Dakar central coordinates
    lng: -17.4677,
  });
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Filter restaurants by neighborhood if selected
  const filteredRestaurants = useMemo(() => {
    if (selectedNeighborhood === 'all') return restaurants;
    const nObj = DAKAR_NEIGHBORHOODS.find((n) => n.id === selectedNeighborhood);
    if (!nObj) return restaurants;
    return restaurants.filter(
      (r) =>
        r.neighborhood.toLowerCase().includes(nObj.name.toLowerCase()) ||
        nObj.name.toLowerCase().includes(r.neighborhood.toLowerCase())
    );
  }, [restaurants, selectedNeighborhood]);

  const handleNeighborhoodClick = (n: DakarNeighborhood | 'all') => {
    if (n === 'all') {
      setSelectedNeighborhood('all');
      setPanTarget({ lat: 14.7167, lng: -17.4677 });
      setMapZoom(12);
    } else {
      setSelectedNeighborhood(n.id);
      setPanTarget({ lat: n.lat, lng: n.lng });
      setMapZoom(14);
    }
  };

  const handleMarkerClick = (r: Restaurant) => {
    setActiveRestaurant(r);
    setPanTarget({ lat: r.latitude, lng: r.longitude });
    setMapZoom(15);
    if (onSelectRestaurant) {
      onSelectRestaurant(r);
    }
  };

  const handleOpenRestaurant = (r: Restaurant) => {
    setSelectedRestaurant(r);
    setActiveScreen('restaurant_detail');
  };

  return (
    <div className="w-full space-y-3">
      {/* Neighborhood Fast Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleNeighborhoodClick('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 transition-all cursor-pointer ${
            selectedNeighborhood === 'all'
              ? 'bg-[#006633] text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🇸🇳 Tout Dakar ({restaurants.length})
        </button>
        {DAKAR_NEIGHBORHOODS.map((n) => {
          const count = restaurants.filter(
            (r) =>
              r.neighborhood.toLowerCase().includes(n.name.toLowerCase()) ||
              n.name.toLowerCase().includes(r.neighborhood.toLowerCase())
          ).length;
          return (
            <button
              key={n.id}
              onClick={() => handleNeighborhoodClick(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedNeighborhood === n.id
                  ? 'bg-[#006633] text-white shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <MapPin className="w-3 h-3 text-[#006633]" />
              <span>{n.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedNeighborhood === n.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div
        className={`relative w-full ${height} rounded-[32px] overflow-hidden shadow-artistic-lg border border-[#F0EDE8] bg-slate-900`}
      >
        <GoogleMapsWrapper fallbackHeight={height}>
          <Map
            defaultCenter={{ lat: 14.7167, lng: -17.4677 }}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            <MapPanController target={panTarget} zoom={mapZoom} />

            {/* Restaurant Advanced Markers */}
            {filteredRestaurants.map((r) => {
              const isSelected = activeRestaurant?.id === r.id;
              return (
                <AdvancedMarker
                  key={r.id}
                  position={{ lat: r.latitude, lng: r.longitude }}
                  onClick={() => handleMarkerClick(r)}
                  title={r.name}
                >
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 transform group-hover:scale-115 ${
                        isSelected
                          ? 'bg-[#E8702A] text-white ring-4 ring-[#E8702A]/40 scale-110'
                          : 'bg-[#006633] text-[#FFCC00] ring-3 ring-white hover:ring-[#FFCC00]'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md mt-1 shadow-md border whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-[#2D2D2D] text-white border-[#E8702A]'
                          : 'bg-white/95 text-slate-900 border-gray-200'
                      }`}
                    >
                      {r.name.length > 16 ? `${r.name.substring(0, 16)}...` : r.name}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow for Selected Restaurant */}
            {activeRestaurant && (
              <InfoWindow
                position={{ lat: activeRestaurant.latitude, lng: activeRestaurant.longitude }}
                onCloseClick={() => setActiveRestaurant(null)}
              >
                <div className="p-1 max-w-[240px] text-slate-900">
                  <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                    <img
                      src={activeRestaurant.coverImageUrl}
                      alt={activeRestaurant.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-[#FFCC00] text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#FFCC00] text-[#FFCC00]" />
                      <span>{activeRestaurant.rating}</span>
                    </div>
                  </div>

                  <h4 className="font-black text-xs text-slate-900 leading-tight">
                    {activeRestaurant.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                    {activeRestaurant.address}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-600">
                    <span className="flex items-center gap-0.5 text-[#006633] font-bold">
                      <Clock className="w-3 h-3" />
                      {activeRestaurant.estimatedDeliveryTime}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                      <Bike className="w-3 h-3" />
                      {activeRestaurant.deliveryFee} FCFA
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenRestaurant(activeRestaurant)}
                    className="w-full mt-2.5 py-1.5 px-2 rounded-xl bg-[#006633] hover:bg-[#00552b] text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <span>{language === 'fr' ? 'Voir le menu' : 'View Menu'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </GoogleMapsWrapper>

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md rounded-2xl p-2 px-3 text-white text-xs flex items-center gap-2 border border-white/10 z-10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] animate-pulse"></span>
          <span className="font-bold text-[11px]">Dakar Food Map 🇸🇳</span>
        </div>

        {/* Bottom Floating Stats */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-2xl p-2 px-3 text-slate-800 text-[11px] font-bold shadow-md border border-gray-200 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#006633]"></span>
          <span>{filteredRestaurants.length} restaurants répertoriés</span>
        </div>
      </div>
    </div>
  );
};
