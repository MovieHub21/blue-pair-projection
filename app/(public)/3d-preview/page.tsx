import Hotel3DHero from '../../../components/ui/Hotel3DHero'

export default function ThreeDPreviewPage() {
  return (
    <main className="min-h-screen bg-[#061326] text-white overflow-hidden">
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(45,83,113,.42),transparent_42%),linear-gradient(120deg,#061326,#0b1d35_55%,#081426)]" />
        <Hotel3DHero />
        <div className="relative z-10 max-w-xl px-6 md:px-12 lg:px-20 pointer-events-none">
          <div className="text-[10px] uppercase tracking-[.3em] text-[#e2bd69]">Blue Pair · 3D concept</div>
          <h1 className="mt-4 text-5xl md:text-7xl font-semibold tracking-tight">A hotel you can feel before you arrive.</h1>
          <p className="mt-5 max-w-lg text-white/60 leading-relaxed">Interactive architectural hero prototype. Move your pointer across the hotel to shift the perspective.</p>
          <div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur">Lightweight CSS 3D · no 3D model download</div>
        </div>
      </section>
    </main>
  )
}
