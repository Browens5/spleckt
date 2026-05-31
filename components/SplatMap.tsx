'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Splat = {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  viewerUrl: string;     // URL to your exported HTML viewer or hosted splat
  thumbnail?: string;
};

const sampleSplats: Splat[] = [
  {
    id: '1',
    title: 'Downtown Des Moines',
    description: 'Captured near the capital building',
    lat: 41.5912,
    lng: -93.6037,
    viewerUrl: 'https://superspl.at/scene/b11e45d1', // Replace with real URLs
  },
  // Add more of your captures here...
];

export default function SplatMap({ onMarkerClick }: { onMarkerClick: (splat: Splat) => void }) {
  return (
    <MapContainer
      center={[41.6, -93.6]} // Centered around Des Moines, Iowa
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {sampleSplats.map((splat) => (
        <Marker
          key={splat.id}
          position={[splat.lat, splat.lng]}
          eventHandlers={{
            click: () => onMarkerClick(splat),
          }}
        >
          <Popup>
            <div className="text-center">
              <strong className="block mb-1">{splat.title}</strong>
              <p className="text-sm text-zinc-600 mb-3">{splat.description}</p>
              <button
                onClick={() => onMarkerClick(splat)}
                className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                Open 3D Viewer
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}