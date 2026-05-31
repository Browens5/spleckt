'use client';

import { useState } from 'react';
import Link from 'next/link';

type Project = {
  id: string;
  title: string;
  description: string;
  type: 'splat' | 'web' | 'video';
  url?: string;
  splatUrl?: string;
  image?: string;
};

export default function Projects() {
  const [selectedSplat, setSelectedSplat] = useState<string | null>(null);

  const projects: Project[] = [
    {
      id: '1',
      title: 'Hilton Garden Inn Downtown Milwaukee',
      description: 'Immersive 3D Gaussian Splat capture of the historic Loyalty Building',
      type: 'splat',
      splatUrl: 'https://superspl.at/s?id=07537ddd',
    },
    {
      id: '2',
      title: 'Weitz Des Moines Office',
      description: 'Interior 3D capture of corporate office at 611 5th Street',
      type: 'splat',
      splatUrl: 'https://superspl.at/s?id=689907dd',
    },
    {
      id: '3',
      title: 'Idaho Falls Residence',
      description: 'Private home 3D capture showcasing architectural details',
      type: 'splat',
      splatUrl: 'https://superspl.at/s?id=58dcdba7',
    },
    // Add more projects here (web apps, videos, etc.)
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-6xl font-bold tracking-tight mb-4">Projects</h1>
        <p className="text-xl text-zinc-400 mb-12">Selected works blending design, technology, and creativity</p>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-zinc-900 rounded-3xl overflow-hidden group">
              <div className="aspect-video bg-zinc-800 relative">
                {project.type === 'splat' && (
                  <button
                    onClick={() => setSelectedSplat(project.splatUrl!)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">🌐</div>
                      <p className="font-medium">View 3D Splat</p>
                    </div>
                  </button>
                )}
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-semibold mb-2">{project.title}</h3>
                <p className="text-zinc-400">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Splat Modal */}
      {selectedSplat && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
          <button
            onClick={() => setSelectedSplat(null)}
            className="absolute top-8 right-8 text-5xl z-10 hover:text-emerald-400"
          >
            ✕
          </button>
          <iframe
            src={selectedSplat}
            className="w-full h-full"
            allow="fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}