import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, CloudSun, TrendingUp } from 'lucide-react';
import { LayoutContext } from './Layout';

interface GeoData {
  location: string;
  weather: string;
  localTrending: string;
  region: string;
}

export default function GeoBanner() {
  const { currentUser } = useOutletContext<LayoutContext>();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoData({
        location: "Global Grid",
        weather: "Sunny • 74°F",
        localTrending: "Tech Innovation Summit",
        region: "Global"
      });
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/geolocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          const data = await res.json();
          setGeoData(data);
        } catch (e) {
          console.error("Error querying location metadata:", e);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied, defaulting to regional route matching.");
        const isUS = new Date().getTimezoneOffset() > 120;
        setGeoData({
          location: isUS ? "North American Region" : "European Grid",
          weather: isUS ? "Bright • 78°F" : "Chilly • 56°F",
          localTrending: isUS ? "Silicon Valley Tech Wave" : "Euro Cup Highlights",
          region: isUS ? "North America" : "Europe"
        });
        setGeoLoading(false);
      }
    );
  };

  useEffect(() => {
    detectUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser?.preferences.region && currentUser.preferences.region !== 'Global') {
      setGeoData(prev => prev ? { ...prev, location: `${currentUser.preferences.region} Portal Grid`, region: currentUser.preferences.region } : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <section className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${geoLoading ? 'bg-blue-500/10 text-blue-400 animate-spin' : 'bg-blue-500/10 text-blue-400'}`}>
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Localization</span>
            {geoLoading && <span className="text-[9px] text-blue-400 animate-pulse font-mono">Syncing Geolocation IP...</span>}
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Reading region: <span className="text-blue-400">{geoData?.location || "Global Grid"}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {geoData?.weather && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-medium">{geoData.weather}</span>
          </div>
        )}
        {geoData?.localTrending && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium">Local Trends: <strong className="text-slate-200">{geoData.localTrending}</strong></span>
          </div>
        )}
        <button
          onClick={detectUserLocation}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors active:scale-95 cursor-pointer"
        >
          Force Location Refresh
        </button>
      </div>
    </section>
  );
}
