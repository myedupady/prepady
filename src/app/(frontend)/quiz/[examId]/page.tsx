import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { QuizRunner } from './QuizRunner'

export const dynamic = 'force-dynamic'

export default async function ExamQuizPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params

  // Gate: must be logged in.
  const token = (await cookies()).get('payload-token')?.value
  let authed = false
  if (token) {
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()) as { id?: number; exp?: number }
      authed = !!decoded.id && (!decoded.exp || decoded.exp > Date.now() / 1000)
    } catch {
      /* malformed */
    }
  }
  if (!authed) redirect(`/login?redirect=/quiz/${examId}`)

  const payload = await getPayload({ config: configPromise })
  const exam = await payload.findByID({ collection: 'exams', id: examId, depth: 0 }).catch(() => null)
  if (!exam) notFound()
  const e = exam as { code?: string; name?: string; country?: string }

  return <QuizRunner examId={examId} examName={e.code ?? 'Exam'} examFull={e.name ?? ''} country={e.country ?? ''} />
}
