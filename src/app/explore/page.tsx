import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover the most-liked photos from the PhotoBuddy community.',
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📷</span>
              <span className="text-xl font-bold text-slate-900">PhotoBuddy</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-slate-900">Explore</h1>
          <p className="mt-2 text-slate-600">
            Discover the most-liked photos from the last 7 days.
          </p>
        </div>

        {/* Placeholder grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-slate-200 animate-pulse"
            />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Photo grid will be populated in the Photo Upload &amp; Feed features.
        </p>
      </main>
    </div>
  )
}
