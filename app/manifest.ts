import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MyLearning - Platform Belajar Online',
    short_name: 'MyLearning',
    description: 'Pelajari skill digital dari instruktur terbaik di Indonesia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0c14',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
