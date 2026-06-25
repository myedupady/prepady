/**
 * Exam catalogue for Prepady — pan-African coverage.
 *
 * 6 regions, each with a soft pastel "tone" (TopHat-style category colour), and
 * the full list of national exams within them. The tone classes are written as
 * literal Tailwind strings so the JIT compiler picks them up.
 *
 * `exam` on the Questions collection is generated from EXAMS; region is derived
 * from the exam, so question authors pick one exam and the UI groups/colours by
 * region automatically.
 */

export interface Region {
  value: string
  label: string
  /** Tailwind classes for this region's pastel pill + dot. */
  pill: string
  dot: string
}

export const REGIONS: Region[] = [
  { value: 'west-africa', label: 'West Africa', pill: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  { value: 'east-africa', label: 'East Africa', pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'southern-africa', label: 'Southern Africa', pill: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { value: 'north-africa', label: 'North Africa', pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { value: 'francophone', label: 'Francophone Africa', pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'island-nations', label: 'Island Nations', pill: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
]

export type RegionValue = (typeof REGIONS)[number]['value']

export interface Exam {
  value: string
  label: string
  region: RegionValue
  country: string
  full?: string
}

export const EXAMS: Exam[] = [
  // ── West Africa ──────────────────────────────────────────────────────────
  { value: 'waec', label: 'WAEC', region: 'west-africa', country: 'Regional', full: 'West African Examinations Council' },
  { value: 'wassce', label: 'WASSCE', region: 'west-africa', country: 'Regional', full: 'West African Senior School Certificate Examination' },
  { value: 'jamb', label: 'JAMB / UTME', region: 'west-africa', country: 'Nigeria', full: 'Joint Admissions and Matriculation Board' },
  { value: 'post-utme', label: 'Post-UTME', region: 'west-africa', country: 'Nigeria', full: 'Post-Unified Tertiary Matriculation Examination' },
  { value: 'neco', label: 'NECO', region: 'west-africa', country: 'Nigeria', full: 'National Examinations Council' },
  { value: 'nabteb', label: 'NABTEB', region: 'west-africa', country: 'Nigeria', full: 'National Business and Technical Examinations Board' },
  { value: 'bece-gh', label: 'BECE', region: 'west-africa', country: 'Ghana', full: 'Basic Education Certificate Examination' },
  { value: 'npse', label: 'NPSE', region: 'west-africa', country: 'Sierra Leone', full: 'National Primary School Examination' },
  { value: 'bssl', label: 'BSSL', region: 'west-africa', country: 'Sierra Leone', full: 'Basic Secondary School Leaving Certificate' },
  { value: 'wasce-lr', label: 'WASCE', region: 'west-africa', country: 'Liberia', full: 'West African School Certificate Examination' },
  { value: 'gbce', label: 'GBCE', region: 'west-africa', country: 'Gambia', full: 'Gambia Basic Certificate Examination' },

  // ── East Africa ──────────────────────────────────────────────────────────
  { value: 'kcpe', label: 'KCPE', region: 'east-africa', country: 'Kenya', full: 'Kenya Certificate of Primary Education' },
  { value: 'kcse', label: 'KCSE', region: 'east-africa', country: 'Kenya', full: 'Kenya Certificate of Secondary Education' },
  { value: 'uneb-uce', label: 'UNEB UCE', region: 'east-africa', country: 'Uganda', full: 'Uganda Certificate of Education' },
  { value: 'uneb-uace', label: 'UNEB UACE', region: 'east-africa', country: 'Uganda', full: 'Uganda Advanced Certificate of Education' },
  { value: 'necta-psle', label: 'NECTA PSLE', region: 'east-africa', country: 'Tanzania', full: 'Primary School Leaving Examination' },
  { value: 'necta-csee', label: 'NECTA CSEE', region: 'east-africa', country: 'Tanzania', full: 'Certificate of Secondary Education Examination' },
  { value: 'necta-acsee', label: 'NECTA ACSEE', region: 'east-africa', country: 'Tanzania', full: 'Advanced Certificate of Secondary Education Examination' },
  { value: 'rnec-primary', label: 'RNEC (Primary)', region: 'east-africa', country: 'Rwanda', full: 'Rwanda National Examination Council — Primary Leaving' },
  { value: 'rnec-olevel', label: 'RNEC (O Level)', region: 'east-africa', country: 'Rwanda', full: 'Rwanda National Examination Council — O Level' },
  { value: 'rnec-alevel', label: 'RNEC (A Level)', region: 'east-africa', country: 'Rwanda', full: 'Rwanda National Examination Council — A Level' },
  { value: 'nebb', label: 'NEBB', region: 'east-africa', country: 'Burundi', full: 'National Examinations Board Burundi' },
  { value: 'sece', label: 'SECE', region: 'east-africa', country: 'South Sudan', full: 'South Sudan Certificate of Secondary Education' },

  // ── Southern Africa ────────────────────────────────────────────────────────
  { value: 'nsc', label: 'NSC (Matric)', region: 'southern-africa', country: 'South Africa', full: 'National Senior Certificate' },
  { value: 'get', label: 'GET', region: 'southern-africa', country: 'South Africa', full: 'General Education and Training Certificate' },
  { value: 'zimsec-o', label: 'ZIMSEC O Level', region: 'southern-africa', country: 'Zimbabwe', full: 'ZIMSEC Ordinary Level' },
  { value: 'zimsec-a', label: 'ZIMSEC A Level', region: 'southern-africa', country: 'Zimbabwe', full: 'ZIMSEC Advanced Level' },
  { value: 'ecz-g9', label: 'ECZ Grade 9', region: 'southern-africa', country: 'Zambia', full: 'Examinations Council of Zambia — Grade 9' },
  { value: 'ecz-g12', label: 'ECZ Grade 12', region: 'southern-africa', country: 'Zambia', full: 'Examinations Council of Zambia — Grade 12' },
  { value: 'maneb-jce', label: 'MANEB JCE', region: 'southern-africa', country: 'Malawi', full: 'Junior Certificate Examination' },
  { value: 'maneb-msce', label: 'MANEB MSCE', region: 'southern-africa', country: 'Malawi', full: 'Malawi School Certificate of Education' },
  { value: 'bgcse', label: 'BGCSE', region: 'southern-africa', country: 'Botswana', full: 'Botswana General Certificate of Secondary Education' },
  { value: 'nssc', label: 'NSSC', region: 'southern-africa', country: 'Namibia', full: 'Namibia Senior Secondary Certificate' },
  { value: 'exco-jc', label: 'EXCO JC', region: 'southern-africa', country: 'Lesotho', full: 'Junior Certificate' },
  { value: 'exco-cosc', label: 'EXCO COSC', region: 'southern-africa', country: 'Lesotho', full: 'Cambridge Overseas School Certificate' },
  { value: 'egcse', label: 'EGCSE', region: 'southern-africa', country: 'Eswatini', full: 'Eswatini General Certificate of Secondary Education' },
  { value: 'moec', label: 'MOEC', region: 'southern-africa', country: 'Mozambique', full: 'Mozambique National Examinations' },

  // ── North Africa ───────────────────────────────────────────────────────────
  { value: 'thanawiya', label: 'Thanawiya Amma', region: 'north-africa', country: 'Egypt', full: 'Egyptian Secondary Leaving Certificate' },
  { value: 'sudan-ssc', label: 'Sudan SSC', region: 'north-africa', country: 'Sudan', full: 'Sudanese Secondary School Certificate' },
  { value: 'libya-bac', label: 'Libyan Baccalaureate', region: 'north-africa', country: 'Libya' },
  { value: 'morocco-bac', label: 'Moroccan Baccalauréat', region: 'north-africa', country: 'Morocco' },
  { value: 'tunisia-bac', label: 'Tunisian Baccalauréat', region: 'north-africa', country: 'Tunisia' },
  { value: 'algeria-bac', label: 'Algerian Baccalauréat', region: 'north-africa', country: 'Algeria' },

  // ── Francophone Central & West Africa ───────────────────────────────────────
  { value: 'bac-senegal', label: 'BAC Sénégal', region: 'francophone', country: 'Senegal' },
  { value: 'bac-civ', label: "BAC Côte d'Ivoire", region: 'francophone', country: "Côte d'Ivoire" },
  { value: 'bac-cameroon', label: 'BAC Cameroon', region: 'francophone', country: 'Cameroon (Francophone)' },
  { value: 'gce-cameroon', label: 'GCE Cameroon', region: 'francophone', country: 'Cameroon (Anglophone) — O & A Level' },
  { value: 'bac-gabon', label: 'BAC Gabon', region: 'francophone', country: 'Gabon' },
  { value: 'bac-drc', label: 'BAC DRC', region: 'francophone', country: 'DR Congo' },
  { value: 'bac-congo', label: 'BAC Congo', region: 'francophone', country: 'Congo-Brazzaville' },
  { value: 'bac-mali', label: 'BAC Mali', region: 'francophone', country: 'Mali' },
  { value: 'bac-burkina', label: 'BAC Burkina Faso', region: 'francophone', country: 'Burkina Faso' },
  { value: 'bac-niger', label: 'BAC Niger', region: 'francophone', country: 'Niger' },
  { value: 'bac-guinea', label: 'BAC Guinea', region: 'francophone', country: 'Guinea' },
  { value: 'bac-togo', label: 'BAC Togo', region: 'francophone', country: 'Togo' },
  { value: 'bac-benin', label: 'BAC Benin', region: 'francophone', country: 'Benin' },
  { value: 'bac-chad', label: 'BAC Chad', region: 'francophone', country: 'Chad' },
  { value: 'bac-car', label: 'BAC CAR', region: 'francophone', country: 'Central African Republic' },
  { value: 'bac-mauritania', label: 'BAC Mauritania', region: 'francophone', country: 'Mauritania' },

  // ── Island Nations ──────────────────────────────────────────────────────────
  { value: 'seen', label: 'SEEN', region: 'island-nations', country: 'São Tomé & Príncipe', full: 'São Tomé and Príncipe National Exams' },
  { value: 'cape-verde', label: 'Cape Verde SLC', region: 'island-nations', country: 'Cape Verde', full: 'Secondary Leaving Certificate' },
  { value: 'comoros-bac', label: 'Comoros Baccalaureate', region: 'island-nations', country: 'Comoros' },
  { value: 'madagascar-bac', label: 'Madagascar Baccalauréat', region: 'island-nations', country: 'Madagascar' },
  { value: 'mauritius-sc', label: 'Mauritius SC', region: 'island-nations', country: 'Mauritius', full: 'School Certificate' },
  { value: 'mauritius-hsc', label: 'Mauritius HSC', region: 'island-nations', country: 'Mauritius', full: 'Higher School Certificate' },
  { value: 'seychelles', label: 'Seychelles IGCSE', region: 'island-nations', country: 'Seychelles', full: 'Cambridge IGCSE' },
  { value: 'reunion-bac', label: 'Réunion BAC', region: 'island-nations', country: 'Réunion' },
]

export const EXAM_LABELS: Record<string, string> = Object.fromEntries(
  EXAMS.map((e) => [e.value, e.label]),
)

export const REGION_BY_VALUE: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.value, r]),
)

/** Exams grouped under their region (in REGIONS order). */
export function examsByRegion(): { region: Region; exams: Exam[] }[] {
  return REGIONS.map((region) => ({
    region,
    exams: EXAMS.filter((e) => e.region === region.value),
  }))
}

/** The pastel pill classes for whichever region an exam belongs to. */
export function examPill(examValue: string): string {
  const exam = EXAMS.find((e) => e.value === examValue)
  return exam ? REGION_BY_VALUE[exam.region]?.pill ?? '' : ''
}

/** Difficulty levels used by the adaptive engine. */
export const DIFFICULTIES = [
  { value: '1', label: '1 — Easy' },
  { value: '2', label: '2 — Medium' },
  { value: '3', label: '3 — Hard' },
] as const
