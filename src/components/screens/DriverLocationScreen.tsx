import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Power, ShieldCheck } from 'lucide-react';

export const DriverLocationScreen: React.FC = () => {
  const [driverId, setDriverId] = useState('driver-001');
  const [secret, setSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sharing, setSharing] = useState(false);
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!sharing || !orderId.trim() || !secret.trim() || !navigator.geolocation) return;
    let watchId: number | null = null;
    const send = async (position: GeolocationPosition) => {
      setCoords(position.coords);
      try {
        const response = await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Driver-Secret': secret.trim() },
          body: JSON.stringify({
            driverId: driverId.trim(),
            orderId: orderId.trim(),
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        });
        const result = await response.json().catch(() => ({}));
        setMessage(response.ok ? 'GPS envoyé au client.' : (result.error || 'Échec de mise à jour GPS.'));
      } catch {
        setMessage('Connexion au serveur impossible.');
      }
    };
    watchId = navigator.geolocation.watchPosition(send, () => setMessage('Autorisez la localisation GPS du téléphone.'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [sharing, driverId, secret, orderId]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-[32px] p-6 border border-[#F0EDE8] shadow-artistic space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#006633] text-[#FFCC00] flex items-center justify-center"><Navigation className="w-6 h-6" /></div>
          <div><h1 className="font-heading font-black text-xl">TerangaEats Driver</h1><p className="text-xs text-gray-500">GPS livraison en direct</p></div>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-2 text-xs text-emerald-900"><ShieldCheck className="w-4 h-4 shrink-0" />La position n'est envoyée que pendant le partage actif.</div>
        <label className="block text-xs font-bold">Driver ID<input value={driverId} onChange={e => setDriverId(e.target.value)} className="mt-1 w-full p-3 rounded-xl bg-[#F7F5F0] outline-none" /></label>
        <label className="block text-xs font-bold">Order ID<input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="TE-12345" className="mt-1 w-full p-3 rounded-xl bg-[#F7F5F0] outline-none" /></label>
        <label className="block text-xs font-bold">Driver location secret<input type="password" value={secret} onChange={e => setSecret(e.target.value)} className="mt-1 w-full p-3 rounded-xl bg-[#F7F5F0] outline-none" /></label>
        <button disabled={!orderId.trim() || !secret.trim()} onClick={() => { setSharing(v => !v); setMessage(''); }} className={`w-full p-4 rounded-2xl font-black text-white disabled:opacity-40 flex items-center justify-center gap-2 ${sharing ? 'bg-red-600' : 'bg-[#006633]'}`}><Power className="w-5 h-5" />{sharing ? 'Arrêter le partage GPS' : 'Démarrer le partage GPS'}</button>
        {coords && <div className="p-4 rounded-2xl bg-[#F7F5F0] text-xs font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-[#006633]" />{coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)} • ±{Math.round(coords.accuracy)}m</div>}
        {message && <p className="text-xs font-bold text-gray-600">{message}</p>}
      </div>
    </div>
  );
};
