'use client';

export default function Resume() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-bold tracking-tight">Resume</h1>
            <p className="text-emerald-400 mt-2">Brian Owens • Des Moines, IA</p>
          </div>
          <a 
            href="/resume.pdf" 
            target="_blank"
            className="border border-zinc-700 hover:border-white px-6 py-3 rounded-xl text-sm transition"
          >
            Download PDF
          </a>
        </div>

        {/* Professional Summary */}
        <section className="mb-16">
          <h2 className="uppercase tracking-widest text-sm text-zinc-500 mb-4">Professional Summary</h2>
          <p className="text-lg text-zinc-300">
            Creative full-stack developer and 3D enthusiast with a passion for building immersive 
            digital experiences. Experienced in modern web technologies and real-world 3D capture.
          </p>
        </section>

        {/* Experience */}
        <section className="mb-16">
          <h2 className="uppercase tracking-widest text-sm text-zinc-500 mb-6">Experience</h2>
          
          <div className="space-y-12">
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-xl font-semibold">Software Developer / 3D Capture Specialist</h3>
                <p className="text-zinc-400">2023 — Present</p>
              </div>
              <p className="text-emerald-400">Weitz Company • Des Moines, IA</p>
              <ul className="mt-4 list-disc list-inside text-zinc-400 space-y-2">
                <li>Developed internal tools and interactive web applications</li>
                <li>Captured and hosted 3D Gaussian Splats of job sites and offices</li>
                <li>Built interactive portfolio website showcasing 3D projects</li>
              </ul>
            </div>

            {/* Add more experience entries here */}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-16">
          <h2 className="uppercase tracking-widest text-sm text-zinc-500 mb-6">Skills</h2>
          <div className="flex flex-wrap gap-3">
            {['Next.js', 'TypeScript', 'React', 'Tailwind CSS', 'Gaussian Splatting', 
              'PlayCanvas / SuperSplat', 'AWS', 'GitHub', '3D Capture', 'UI/UX Design'].map(skill => (
              <span key={skill} className="bg-zinc-900 px-5 py-2 rounded-full text-sm border border-zinc-800">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="uppercase tracking-widest text-sm text-zinc-500 mb-6">Education</h2>
          <div>
            <h3 className="text-xl font-semibold">Bachelor's Degree in [Your Field]</h3>
            <p className="text-zinc-400">University Name • Graduation Year</p>
          </div>
        </section>
      </div>
    </div>
  );
}