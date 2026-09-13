import Hotel3DHero from '../../../components/ui/Hotel3DHero'

export default function ThreeDPreviewPage() {
  return (
    <main className="min-h-screen bg-[#061326] text-white overflow-hidden">
      <section className="min-h-screen grid lg:grid-cols-[0.8fr_1.2fr]">
        <div className="relative z-20 flex items-center px-6 py-16 md:px-12 lg:px-20">
          <div className="max-w-xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#e2bd69]">
              Blue Pair · 3D concept
            </div>
            <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight">
              A hotel you can feel before you arrive.
            </h1>
            <p className="mt-5 max-w-lg text-white/60 leading-relaxed">
              Move your pointer over the hotel to change its perspective. The building is a
              lightweight CSS 3D prototype, so it does not require a large model download.
            </p>
            <div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur">
              Interactive 3D · pointer controlled
            </div>
          </div>
        </div>

        <div className="relative min-h-[620px] lg:min-h-screen bg-[radial-gradient(circle_at_55%_45%,rgba(45,83,113,.42),transparent_42%),linear-gradient(120deg,#061326,#0b1d35_55%,#081426)]">
          <Hotel3DHero />
        </div>
      </section>
    </main>
  )
}
