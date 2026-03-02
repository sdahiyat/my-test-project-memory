import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Photo ${params.id}`,
    description: 'View this photo on PhotoBuddy.',
  }
}

export default function PhotoDetailPage({ params }: Props) {
  if (!params.id) notFound()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">Photo Detail</h1>
      <p className="text-slate-500">
        Photo detail view (ID: {params.id}) will be implemented in the Photo
        Detail View feature.
      </p>
    </main>
  )
}
