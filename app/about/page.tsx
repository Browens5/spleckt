'use client';

import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="text-emerald-400 hover:text-emerald-500 inline-flex items-center gap-2 mb-12">
          ← Back to Home
        </Link>

        <h1 className="text-6xl font-bold tracking-tight mb-12">About Me</h1>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-2xl text-zinc-300 leading-relaxed">
            I'm Brian Owens, a creative technologist based in Des Moines, Iowa. 
            I build immersive digital experiences using modern web technologies and 3D capture tools.
          </p>

          <div className="my-16 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-semibold mb-6">My Journey</h2>
              <p className="text-zinc-400">
                With a strong background in software development and a passion for 3D technologies, 
                I enjoy combining technical precision with creative storytelling. My work spans 
                full-stack development, interactive web experiences, and real-world 3D capture using 
                Gaussian Splatting.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold mb-6">Beyond Code</h2>
              <p className="text-zinc-400">
                When I'm not coding, you'll find me running, exploring the outdoors, or experimenting 
                with new ways to capture and preserve real-world spaces in 3D. I'm constantly learning 
                and love turning complex ideas into beautiful, functional digital products.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold mb-8">What I'm Passionate About</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['Immersive 3D Experiences', 'Clean & Intuitive Design', 'Modern Web Technologies', 
              'Problem Solving', 'Continuous Learning', 'Running & Fitness'].map((item) => (
              <div key={item} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <p className="font-medium text-emerald-400">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-zinc-800 text-center">
          <Link 
            href="/projects"
            className="inline-block bg-white text-black px-10 py-4 rounded-2xl font-semibold hover:bg-zinc-200 transition"
          >
            View My Projects →
          </Link>
        </div>
      </div>
    </div>
  );
}