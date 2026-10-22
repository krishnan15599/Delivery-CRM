import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Truck, Radio } from 'lucide-react';
import type { Delivery } from '../../types/delivery';

export interface DeliveryTrackingMapProps {
  delivery: Delivery;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({ delivery }) => {
  const [progress, setProgress] = useState(
    delivery.status === 'Delivered'
      ? 100
      : delivery.status === 'In Transit'
      ? 65
      : delivery.status === 'Picked Up'
      ? 35
      : delivery.status === 'Assigned'
      ? 15
      : 5
  );

  // Subtle real-time pulsing simulation
  useEffect(() => {
    if (delivery.status === 'In Transit') {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 55 : prev + 2));
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [delivery.status]);

  const origin = delivery.pickupAddress || 'Central Dispatch Hub';
  const destination = `${delivery.deliveryAddress}, ${delivery.city || 'Bengaluru'}`;
  const agentName = delivery.agentName || 'Assigned Courier';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 text-[#2c5fbf]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Live Courier Dispatch Route</h3>
            <p className="text-[11px] text-gray-500">Real-time GPS telemetry & waypoint simulation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {delivery.status === 'In Transit' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-pulse">
              <Radio className="w-3 h-3 text-emerald-600 animate-spin" />
              Live Telemetry
            </span>
          )}
          <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            ETA: ~18 mins
          </span>
        </div>
      </div>

      {/* Interactive Map Visual Stage */}
      <div className="relative h-64 bg-slate-900 overflow-hidden select-none">
        {/* Map Grid / Road Pattern Simulation */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Simulated Road Network Lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Background grid roads */}
          <line x1="0" y1="50" x2="100%" y2="50" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2="100%" y2="130" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="0" y1="210" x2="100%" y2="210" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

          {/* Active Navigation Route Path */}
          <path
            d="M 60 190 Q 200 60, 380 130 T 700 80"
            fill="none"
            stroke="#1e40af"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 60 190 Q 200 60, 380 130 T 700 80"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        </svg>

        {/* Origin Marker (Hub / Pickup) */}
        <div className="absolute left-8 bottom-8 flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded shadow mt-1">
            Dispatch Hub
          </span>
        </div>

        {/* Live Agent Vehicle Marker (Dynamic placement by progress) */}
        <div
          className="absolute transition-all duration-1000 flex flex-col items-center"
          style={{
            left: `calc(10% + ${progress * 0.75}%)`,
            top: `${Math.sin((progress / 100) * Math.PI) * 50 + 70}px`,
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/50 ring-4 ring-emerald-400/30">
              <Truck className="w-5 h-5 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
            </span>
          </div>
          <div className="text-[10px] font-bold text-white bg-emerald-950/90 border border-emerald-500/30 px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            {agentName}
          </div>
        </div>

        {/* Destination Marker */}
        <div className="absolute right-12 top-10 flex flex-col items-center">
          <div className="p-2.5 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded shadow mt-1">
            Destination
          </span>
        </div>

        {/* Floating Telemetry Stats Overlay */}
        <div className="absolute bottom-3 right-3 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 text-white text-xs flex items-center gap-4 shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 block">Current Speed</span>
            <span className="font-bold font-mono">32 km/h</span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div>
            <span className="text-[10px] text-slate-400 block">Remaining</span>
            <span className="font-bold font-mono">3.4 km</span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div>
            <span className="text-[10px] text-slate-400 block">Battery / Signal</span>
            <span className="font-bold text-emerald-400 font-mono">92% • 5G</span>
          </div>
        </div>
      </div>

      {/* Route Details Bar */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2 text-gray-700">
          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 font-medium block text-[10px]">PICKUP LOCATION</span>
            <span className="font-semibold truncate">{origin}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-gray-700">
          <div className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 font-medium block text-[10px]">DELIVERY DESTINATION</span>
            <span className="font-semibold truncate">{destination}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingMap;
