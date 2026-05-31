'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const SplatMap = dynamic(() => import('@/components/SplatMap'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center bg-zinc-950">Loading map...</div>
});

export default function MapPage() {
  const [selectedSplat, setSelectedSplat] = useState<any>(null);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Minimal Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xl font-bold">S</div>
            <span className="text-2xl font-bold">Spleckt</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm hover:text-emerald-400 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Full Screen Map */}
      <div className="h-screen w-screen pt-14">
        <SplatMap onMarkerClick={setSelectedSplat} />
      </div>

      {/* Full-Screen Splat Viewer Modal */}
      {selectedSplat && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
          <div className="w-full h-full relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSplat(null)}
              className="absolute top-6 right-6 z-10 bg-black/70 hover:bg-black text-white text-4xl w-14 h-14 flex items-center justify-center rounded-full transition-all hover:scale-110"
            >
              ✕
            </button>

            {/* Splat Title */}
            <div className="absolute top-6 left-6 z-10 bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl">
              <h2 className="text-2xl font-semibold">{selectedSplat.title}</h2>
              <p className="text-zinc-400">{selectedSplat.description}</p>
            </div>

            {/* Full-screen Iframe */}
            <iframe
              src={selectedSplat.viewerUrl}
              className="w-full h-full border-0"
              allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}