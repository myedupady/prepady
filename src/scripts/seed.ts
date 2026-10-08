/**
 * Seeds the exam catalogue (6 regions + the full pan-African exam list) into the
 * database from the canonical list in src/lib/exams.ts. Idempotent — safe to
 * re-run; it updates existing rows (matched by slug / code+country) rather than
 * duplicating. Run with: pnpm seed
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { REGIONS, EXAMS } from '@/lib/exams'

async function run() {
  const payload = await getPayload({ config: configPromise })

  // ── Regions ───────────────────────────────────────────────────────────────
  const regionId: Record<string, number> = {}
  for (const r of REGIONS) {
    const existing = await payload.find({ collection: 'regions', where: { name: { equals: r.label } }, limit: 1 })
    if (existing.docs[0]) {
      regionId[r.value] = existing.docs[0].id as number
      await payload.update({
        collection: 'regions',
        id: existing.docs[0].id,
        data: { name: r.label, slug: existing.docs[0].slug, color: r.color, order: r.order },
      })
    } else {
      const doc = await payload.create({ collection: 'regions', data: { name: r.label, slug: r.value, color: r.color, order: r.order } })
      regionId[r.value] = doc.id as number
    }
  }
  console.log(`Regions: ${REGIONS.length} ensured`)

  // ── Exams ─────────────────────────────────────────────────────────────────
  const examId: Record<string, number> = {}
  let created = 0
  let updated = 0
  for (const [i, e] of EXAMS.entries()) {
    const existing = await payload.find({
      collection: 'exams',
      where: { and: [{ code: { equals: e.label } }, { country: { equals: e.country } }] },
      limit: 1,
    })
    const data = {
      code: e.label,
      name: e.full ?? e.label,
      country: e.country,
      region: regionId[e.region],
      status: 'active' as const,
      order: i,
    }
    if (existing.docs[0]) {
      await payload.update({ collection: 'exams', id: existing.docs[0].id, data })
      examId[e.value] = existing.docs[0].id as number
      updated++
    } else {
      const doc = await payload.create({ collection: 'exams', data })
      examId[e.value] = doc.id as number
      created++
    }
  }
  console.log(`Exams: ${created} created, ${updated} updated (total ${EXAMS.length})`)

  // ── Subjects ────────────────────────────────────────────────────────────────
  const subjectId: Record<string, number> = {}
  for (const name of ['Mathematics', 'English Language', 'Biology']) {
    const ex = await payload.find({ collection: 'subjects', where: { name: { equals: name } }, limit: 1 })
    if (ex.docs[0]) subjectId[name] = ex.docs[0].id as number
    else {
      const d = await payload.create({
        collection: 'subjects',
        data: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), exams: ['waec', 'neco', 'jamb'] },
      })
      subjectId[name] = d.id as number
    }
  }
  console.log(`Subjects: ${Object.keys(subjectId).length} ensured`)

  // ── Topics (first-class; linked to a subject) ───────────────────────────────
  const topicId: Record<string, number> = {} // key: `${subject}|${topic}`
  async function ensureTopic(subjectName: string, topicName: string): Promise<number> {
    const key = `${subjectName}|${topicName}`
    if (topicId[key]) return topicId[key]
    const sId = subjectId[subjectName]
    const existing = await payload.find({
      collection: 'topics',
      where: { and: [{ name: { equals: topicName } }, { subject: { equals: sId } }] },
      limit: 1,
    })
    if (existing.docs[0]) {
      topicId[key] = existing.docs[0].id as number
    } else {
      const d = await payload.create({ collection: 'topics', data: { name: topicName, subject: sId } })
      topicId[key] = d.id as number
    }
    return topicId[key]
  }

  // ── Sample questions (so the CBT engine has content to serve) ─────────────────
  const SAMPLE: Array<{ exam: string; subject: string; q: string; opts: string[]; a: string; d: '1' | '2' | '3'; topic: string; exp: string }> = [
    { exam: 'jamb', subject: 'Mathematics', q: 'If 2x + 3 = 11, find the value of x.', opts: ['3', '4', '5', '7'], a: '4', d: '1', topic: 'Linear equations', exp: 'Subtract 3 from both sides: 2x = 8, then divide by 2 to get x = 4.' },
    { exam: 'jamb', subject: 'Mathematics', q: 'Simplify 3(2x - 4).', opts: ['6x - 12', '6x - 4', '5x - 12', '6x + 12'], a: '6x - 12', d: '1', topic: 'Expansion', exp: 'Multiply 3 by each term: 3*2x = 6x and 3*(-4) = -12, giving 6x - 12.' },
    { exam: 'jamb', subject: 'Mathematics', q: 'What is 15% of 200?', opts: ['15', '30', '35', '300'], a: '30', d: '1', topic: 'Percentages', exp: '15% of 200 = 0.15 x 200 = 30.' },
    { exam: 'jamb', subject: 'Mathematics', q: 'Solve for x: x/3 = 9.', opts: ['3', '12', '27', '6'], a: '27', d: '2', topic: 'Linear equations', exp: 'Multiply both sides by 3: x = 9 x 3 = 27.' },
    { exam: 'jamb', subject: 'Mathematics', q: 'The value of 2^5 is:', opts: ['10', '16', '32', '25'], a: '32', d: '2', topic: 'Indices', exp: '2^5 = 2x2x2x2x2 = 32.' },
    { exam: 'jamb', subject: 'Mathematics', q: 'Find the average of 4, 8 and 12.', opts: ['6', '8', '12', '24'], a: '8', d: '1', topic: 'Statistics', exp: '(4 + 8 + 12) / 3 = 24 / 3 = 8.' },
    { exam: 'waec', subject: 'English Language', q: "Choose the word nearest in meaning to 'arduous'.", opts: ['Easy', 'Difficult', 'Pleasant', 'Brief'], a: 'Difficult', d: '1', topic: 'Vocabulary', exp: "'Arduous' means requiring great effort, so 'Difficult' is closest." },
    { exam: 'waec', subject: 'English Language', q: 'Choose the correctly spelt word.', opts: ['Accomodation', 'Accommodation', 'Acommodation', 'Accomodatian'], a: 'Accommodation', d: '2', topic: 'Spelling', exp: "'Accommodation' has a double 'c' and a double 'm'." },
    { exam: 'waec', subject: 'English Language', q: "Complete the sentence: 'She is the girl ___ won the prize.'", opts: ['which', 'who', 'whom', 'whose'], a: 'who', d: '1', topic: 'Relative pronouns', exp: "'Who' is the subject relative pronoun used for people performing an action." },
    { exam: 'waec', subject: 'English Language', q: "The plural of 'criterion' is:", opts: ['criterions', 'criteria', 'criterias', 'criterion'], a: 'criteria', d: '2', topic: 'Plurals', exp: "'Criterion' is Greek-derived; its plural is 'criteria'." },
  ]
  let qNew = 0
  let qUpd = 0
  for (const s of SAMPLE) {
    const eId = examId[s.exam]
    const sId = subjectId[s.subject]
    if (!eId || !sId) continue
    const tId = await ensureTopic(s.subject, s.topic)
    const ex = await payload.find({ collection: 'questions', where: { questionText: { equals: s.q } }, limit: 1 })
    const data = {
      exam: eId,
      subject: sId,
      topicRef: tId,
      topic: s.topic,
      difficulty: s.d,
      questionType: 'mcq' as const,
      status: 'published' as const,
      maxMarks: 1,
      questionText: s.q,
      options: s.opts.map((t) => ({ text: t })),
      correctAnswer: s.a,
      explanation: s.exp,
    }
    if (ex.docs[0]) {
      await payload.update({ collection: 'questions', id: ex.docs[0].id, data })
      qUpd++
    } else {
      await payload.create({ collection: 'questions', data })
      qNew++
    }
  }
  console.log(`Questions: ${qNew} created, ${qUpd} updated`)

  // ── Sample theory questions (so AI essay marking has content to grade) ────────
  const THEORY: Array<{ exam: string; subject: string; topic: string; d: '1' | '2' | '3'; q: string; scheme: string; marks: number }> = [
    {
      exam: 'waec',
      subject: 'Biology',
      topic: 'Photosynthesis',
      d: '2',
      q: 'State the word equation for photosynthesis and name two factors that affect its rate.',
      scheme:
        'Award up to 5 marks. Word equation: carbon dioxide + water -> glucose + oxygen (in the presence of light and chlorophyll) (3 marks: 1 for correct reactants, 1 for correct products, 1 for mentioning light/chlorophyll). Any TWO factors from: light intensity, carbon dioxide concentration, temperature, water availability (1 mark each, max 2).',
      marks: 5,
    },
    {
      exam: 'waec',
      subject: 'English Language',
      topic: 'Usage',
      d: '2',
      q: "Explain the difference between 'affect' and 'effect', giving one correct example sentence for each.",
      scheme:
        "Award up to 4 marks. 'Affect' is normally a verb meaning to influence (1 mark); correct example sentence using it as a verb (1 mark). 'Effect' is normally a noun meaning a result (1 mark); correct example sentence using it as a noun (1 mark).",
      marks: 4,
    },
    {
      exam: 'jamb',
      subject: 'Mathematics',
      topic: 'Simultaneous Equations',
      d: '2',
      q: 'Solve the simultaneous equations 2x + y = 7 and x - y = 2, showing your working.',
      scheme:
        'Award up to 4 marks. Valid method to eliminate a variable, e.g. adding the two equations to get 3x = 9 (2 marks for correct method/working). x = 3 (1 mark). y = 1 (1 mark). Full marks only if working is shown; answer alone earns 2 of 4.',
      marks: 4,
    },
  ]
  let tNew = 0
  let tUpd = 0
  for (const s of THEORY) {
    const eId = examId[s.exam]
    const sId = subjectId[s.subject]
    if (!eId || !sId) continue
    const tId = await ensureTopic(s.subject, s.topic)
    const ex = await payload.find({ collection: 'questions', where: { questionText: { equals: s.q } }, limit: 1 })
    const data = {
      exam: eId,
      subject: sId,
      topicRef: tId,
      topic: s.topic,
      difficulty: s.d,
      questionType: 'theory' as const,
      status: 'published' as const,
      maxMarks: s.marks,
      questionText: s.q,
      markingScheme: s.scheme,
    }
    if (ex.docs[0]) {
      await payload.update({ collection: 'questions', id: ex.docs[0].id, data })
      tUpd++
    } else {
      await payload.create({ collection: 'questions', data })
      tNew++
    }
  }
  console.log(`Theory questions: ${tNew} created, ${tUpd} updated`)

  console.log('✅ Seed complete')
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
