'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the map to avoid SSR issues with Leaflet
const SplatMap = dynamic(() => import('@/components/SplatMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
      Loading interactive map...
    </div>
  )
});

export default function MapPage() {
  const [selectedSplat, setSelectedSplat] = useState<any>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xl font-bold">
              S
            </div>
            <span className="text-2xl font-bold">Spleckt</span>
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <span className="text-emerald-400 font-medium">Explore Map</span>
          </div>
        </div>
      </nav>

      {/* Full-screen Map */}
      <div className="pt-16 h-screen">
        <SplatMap onMarkerClick={setSelectedSplat} />
      </div>

      {/* Splat Viewer Modal */}
      {selectedSplat && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-7xl h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-md px-8 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{selectedSplat.title}</h2>
                <p className="text-zinc-400">{selectedSplat.description}</p>
              </div>
              <button
                onClick={() => setSelectedSplat(null)}
                className="text-3xl hover:text-emerald-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Viewer Container */}
            <div className="w-full h-full pt-16">
              <iframe
                src={selectedSplat.viewerUrl}
                className="w-full h-full border-0"
                allow="fullscreen; accelerometer; gyroscope; magnetometer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}