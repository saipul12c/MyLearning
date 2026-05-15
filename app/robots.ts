import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/login',
          '/register',
          '/verify',
          '/verify-signature',
          '/security-check',
          '/maintenance',
          '/api/', // Sembunyikan API route jika ada
          '/_next/', // Folder internal Next.js
        ],
      },
    ],
    sitemap: 'https://my-learning-projek.netlify.app/sitemap.xml',
  }
}
