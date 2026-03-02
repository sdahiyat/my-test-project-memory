import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for photos and photographers on PhotoBuddy.',
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q ?? ''

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">
        {query ? `Search results for "${query}"` : 'Search'}
      </h1>
      <p className="text-slate-500">
        Search will be implemented in the Search feature.
      </p>
    </main>
  )
}
