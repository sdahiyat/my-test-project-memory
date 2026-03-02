import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📷</span>
              <span className="text-xl font-bold text-slate-900">PhotoBuddy</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            <span>✨</span>
            AI-powered photo feedback
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Share photos.{' '}
            <span className="text-brand-600">Get smarter.</span>
          </h1>
          <p className="mb-10 text-xl text-slate-600 leading-relaxed">
            PhotoBuddy combines social photo sharing with AI-powered analysis
            to help you become a better photographer. Upload your work, receive
            detailed feedback, and connect with a community of creators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary px-8 py-3 text-base">
              Start sharing for free
            </Link>
            <Link
              href="/explore"
              className="btn-secondary px-8 py-3 text-base"
            >
              Browse photos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-white py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
            Everything you need to grow as a photographer
          </h2>
          <p className="mb-16 text-center text-lg text-slate-600">
            Built for photographers who want more than just a place to store images.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card">
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Simple, transparent pricing
          </h2>
          <p className="mb-12 text-lg text-slate-600">
            Start free, upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Free tier */}
            <div className="card text-left">
              <div className="mb-4">
                <span className="text-2xl font-bold text-slate-900">Free</span>
              </div>
              <ul className="mb-6 space-y-3 text-slate-600">
                {freeTierFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary w-full justify-center">
                Get started free
              </Link>
            </div>
            {/* Premium tier */}
            <div className="card text-left ring-2 ring-brand-500">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">$9.99</span>
                <span className="text-slate-500">/month</span>
                <span className="ml-auto rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  Premium
                </span>
              </div>
              <ul className="mb-6 space-y-3 text-slate-600">
                {premiumTierFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary w-full justify-center">
                Start with Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl">📷</span>
              <span className="font-semibold text-slate-900">PhotoBuddy</span>
            </div>
            <nav className="flex gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                Privacy
              </Link>
              <Link href="/explore" className="hover:text-slate-900 transition-colors">
                Explore
              </Link>
            </nav>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} PhotoBuddy
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

const features = [
  {
    icon: '🤖',
    title: 'AI Photo Analysis',
    description:
      'Get detailed composition feedback, lighting assessment, and technical quality reviews powered by GPT-4 Vision.',
  },
  {
    icon: '🏷️',
    title: 'Smart Auto-Tagging',
    description:
      'AI automatically extracts subjects, mood, colors, and photography style — making your photos discoverable.',
  },
  {
    icon: '✍️',
    title: 'Caption Suggestions',
    description:
      'Receive three social-media-ready captions in different tones: descriptive, emotional, and witty.',
  },
  {
    icon: '👥',
    title: 'Photographer Community',
    description:
      'Follow photographers you admire, get followers for your work, and build a curated feed.',
  },
  {
    icon: '🔍',
    title: 'Powerful Search',
    description:
      'Find photos by AI-generated tags, titles, or descriptions. Search for photographers by name or username.',
  },
  {
    icon: '📱',
    title: 'Built for the Web',
    description:
      'A fast, responsive experience with server-side rendering for lightning-quick page loads.',
  },
]

const freeTierFeatures = [
  '20 photo uploads per month',
  'AI auto-tagging on every photo',
  'Like and comment on photos',
  'Follow photographers',
  'Search photos and people',
]

const premiumTierFeatures = [
  'Unlimited photo uploads',
  'AI composition & lighting feedback',
  'AI caption suggestions (3 per photo)',
  'AI auto-tagging on every photo',
  'All social features included',
]
