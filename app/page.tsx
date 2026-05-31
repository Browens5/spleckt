'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold">B</div>
            <span className="text-2xl font-semibold tracking-tight">Brian Owens</span>
          </div>

          <div className="flex gap-8 text-sm font-medium">
            <Link href="/about" className="hover:text-emerald-400 transition">About</Link>
            <Link href="/projects" className="hover:text-emerald-400 transition">Projects</Link>
            <Link href="/resume" className="hover:text-emerald-400 transition">Resume</Link>
            <a href="#contact" className="hover:text-emerald-400 transition">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6">
            Hi, I'm Brian Owens
          </h1>
          
          <p className="text-3xl text-zinc-400 mb-10 max-w-3xl mx-auto">
            Creative technologist and problem solver turning ideas into immersive digital experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/projects"
              className="bg-white text-black px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-zinc-200 transition"
            >
              View My Projects
            </Link>
            <Link 
              href="/about"
              className="border border-zinc-700 px-10 py-4 rounded-2xl font-medium text-lg hover:bg-zinc-900 transition"
            >
              Learn More About Me
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Summary */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-semibold mb-10 text-center">Professional Summary</h2>
          <div className="prose prose-invert text-lg text-zinc-300 max-w-3xl mx-auto text-center">
            <p>
              I'm a passionate developer and 3D enthusiast based in Des Moines, Iowa. 
              With experience in full-stack development, 3D capture technologies, and interactive experiences, 
              I love building things that blend creativity with technical precision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 'use client';

// import Link from 'next/link';

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-zinc-950 text-white">
//       {/* Navigation */}
//       <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md fixed w-full z-50">
//         <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xl font-bold">
//               S
//             </div>
//             <h1 className="text-2xl font-bold tracking-tight">Spleckt</h1>
//           </div>
          
//           <div className="flex items-center gap-8 text-sm">
//             <Link href="/map" className="hover:text-emerald-400 transition-colors">
//               Map
//             </Link>
//             <Link href="/about" className="hover:text-emerald-400 transition-colors">
//               About
//             </Link>
//             <a 
//               href="https://github.com/yourusername/your-repo" 
//               target="_blank"
//               className="hover:text-emerald-400 transition-colors"
//             >
//               GitHub
//             </a>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <main className="pt-24 pb-20">
//         <div className="max-w-5xl mx-auto px-6 text-center">
//           <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
//             Interactive 3D Gaussian Splats
//           </div>

//           <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6">
//             Spleckt
//           </h1>

//           <p className="text-2xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10">
//             A collection of real-world moments captured in stunning 3D.<br />
//             Explore, wander, and relive places through Gaussian Splats.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//             <Link
//               href="/map"
//               className="bg-white text-black px-10 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-200 transition-all active:scale-95"
//             >
//               Explore the Map
//             </Link>
            
//             <Link
//               href="#about"
//               className="border border-zinc-700 hover:border-zinc-500 px-10 py-4 rounded-xl font-medium text-lg transition-colors"
//             >
//               Learn More
//             </Link>
//           </div>
//         </div>
//       </main>

//       {/* Short Description Section */}
//       <section id="about" className="py-20 bg-zinc-900 border-t border-zinc-800">
//         <div className="max-w-4xl mx-auto px-6 text-center">
//           <h2 className="text-4xl font-semibold mb-8">What is Spleckt?</h2>
          
//           <div className="prose prose-invert max-w-2xl mx-auto text-lg text-zinc-300">
//             <p>
//               Spleckt is a platform for hosting and exploring 3D Gaussian Splat captures 
//               from the real world. Using the power of the PlayCanvas engine and SuperSplat, 
//               each pin on the map opens an immersive 3D viewer that lets you walk around 
//               captured locations in full 3D.
//             </p>
//             <p className="mt-6">
//               From scenic trails and city streets to unique indoor spaces — all preserved 
//               in high-fidelity 3D that you can explore directly in your browser.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Simple CTA Footer Section */}
//       <footer className="py-12 border-t border-zinc-800 bg-black">
//         <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500">
//           <p>Built with Next.js • SuperSplat • PlayCanvas</p>
//           <p className="mt-2">© 2026 Spleckt • Personal Project</p>
//         </div>
//       </footer>
//     </div>
//   );
// }


// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );

// }
