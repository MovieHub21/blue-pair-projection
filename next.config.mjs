/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Public files have stable, readable URLs, so keep a short browser
        // cache and revalidate them instead of pinning old content for a year.
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/GYMRUN.mp4',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:icon(favicon.png|apple-touch-icon.png|icon-192.png|icon-512.png)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}
export default nextConfig
