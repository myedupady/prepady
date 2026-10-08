# Prepady — Content & Ingestion Design

_Last updated: 2026-10-05_

How questions, answers, marking guides, explanations, and videos get into Prepady —
the content model, the formats we accept, the tooling that loads them, and what we
need from the content team. §1 is written to share with the client; §2 onward is
the build spec.

---

## 1. For the content team (shareable)

**Your model is right:** organise by **topic**, with a **video solution** and an
**AI explainer** per question, and a **marking guide** for theory questions. Here's
how that comes together and what we need from you.

**How a student experiences one question**
1. They practise by **exam → subject → topic** (e.g. JAMB → Mathematics → Quadratic Equations).
2. They answer. For MCQs it's graded instantly; for theory, our AI marks it against **your marking guide**.
3. They can watch your **video solution** (if provided) and/or tap **"Explain this to me"** for an instant written explanation — and ask follow-up questions.

**What we need from you (any of these — easiest first):**
- **A filled spreadsheet** using our template (fastest, most reliable — see §4). Your team types questions, options, correct answers, topics, and marking guides into set columns; we import them in bulk.
- **Past-paper PDFs or clear photos/scans.** We extract the questions automatically, then **review every one** before it goes live (extraction isn't perfect, so a human checks it).
- **Diagrams** as separate image files (a scan can't be turned back into a clean diagram).
- **Videos**: just send us the **YouTube/Vimeo links** (unlisted is fine). They can be added gradually — every question works from day one via the AI explainer even before its video exists.

**Two things to decide with us:**
- **Marking guides are required for any theory question** you want AI-marked — one guide per question, as detailed as a real examiner's scheme.
- **Maths-heavy subjects**: tell us if you need proper formula formatting (fractions, powers, surds rendered like a textbook) so we set that up before loading a large maths bank.

**What you *don't* need to do:** write the explanations. Leave that column blank and
the system drafts and stores one automatically — free to every student thereafter.

> **Bottom line for the client:** _"Send content as a filled spreadsheet (fastest),
> or send the past-paper PDFs and we'll extract them for your review. Videos come in
> as links over time. Every theory question needs its marking guide. The AI explainer
> covers every question from launch."_

---

## 2. Content model & schema

Target hierarchy (matches the client's "topic by topic"):

```
Region → Exam → Subject → Topic → Question
                                     ├─ MCQ: options, correctAnswer            (auto-graded)
                                     ├─ Theory: markingScheme                  (AI-marked)
                                     ├─ explanation  (admin-written OR AI-generated)  ← free to students
                                     ├─ videoSolutionUrl  (YouTube/Vimeo link)        ← optional, premium feel
                                     └─ questionImage     (diagram upload)
```

**Current state vs. target — the gaps to close:**

| Need | Today | Change |
|---|---|---|
| Topic-by-topic navigation + gap analytics | `topic` is a free-text field on each question | **Promote `Topic` to a collection** (`Subject → Topic`), keep a text fallback during migration |
| Video solution per question | none | Add **`videoSolutionUrl`** (text/URL) to Questions |
| Bulk loading | manual entry only | Build the **importer** (§3–4) |
| Import auditing / re-import | none | Add **`sourceRef`** (text, e.g. "JAMB-2019-Maths-Q12") to Questions for idempotent re-import + dedup |

Already in place and reused as-is: `questionType` (mcq/theory), `options`,
`correctAnswer`, `markingScheme`, `maxMarks`, `questionImage`, `explanation` +
AI auto-generation, `difficulty`, `year`, `status` (draft/published).

---

## 3. Ingestion tiers

Cheapest and most reliable first. These are complementary, not alternatives.

### Tier A — Structured bulk import (the backbone) — **build first**
A spreadsheet/CSV (or JSON) in our template → imported straight into Payload.
**Deterministic, no AI, no error risk, scales to thousands.** This is the primary
path for anything typed up fresh, and the cheapest way for a VA/typist to work.

- Idempotent: rows are matched on `sourceRef` (or exam + question text) and
  **updated** on re-import rather than duplicated.
- Imported as **draft** by default; an admin bulk-publishes after a glance.
- Validates every row (missing correct answer, unknown exam/subject, <2 options,
  theory without a marking scheme) and reports errors per row — nothing half-imports.

### Tier B — AI-assisted PDF / image extraction — **build second, human-gated**
For past papers that exist only as scans/PDFs:
1. PDF → page images.
2. A **vision model** extracts structured questions (text, options, answer if printed).
3. Rows land as **drafts** in Payload; an admin **reviews/approves before publish** — never auto-published.

Mandatory human review because:
- **Maths notation** (fractions, surds, indices) extracts imperfectly.
- **Diagrams cannot be recreated** — they're cropped and uploaded as `questionImage`.
- Multi-column layouts and separate answer keys confuse extraction.

Cost is small and one-time: ~**$0.20–0.80 per 40-page paper** in tokens. The real
cost is **review time**, not AI. (Same "draft → senior-model gate" principle as the
explanation pipeline — extracted drafts are validated before students see them.)

### Diagrams / images (both tiers)
Diagrams are uploaded as image files and attached via `questionImage`. In the
spreadsheet, reference the filename; in extraction, crop from the page.
**Note:** auto-generated AI explanations are **skipped for image questions** (a
text model can't see the diagram) and flagged for a human/video instead.

---

## 4. The bulk-import template (Tier A spec)

One row per question. Column set:

| Column | Required | Notes |
|---|---|---|
| `type` | ✓ | `mcq` or `theory` |
| `exam` | ✓ | Exam **code**, e.g. `JAMB`, `WAEC`, `KCSE` |
| `subject` | ✓ | Subject name, e.g. `Mathematics` |
| `topic` | ✓ | e.g. `Quadratic Equations` |
| `difficulty` | ✓ | `1`/`2`/`3` (or `easy`/`medium`/`hard`) |
| `year` | – | e.g. `2019`; blank for original practice items |
| `question` | ✓ | The question text |
| `optionA`–`optionE` | mcq | 2–5 options; E optional |
| `correct` | mcq | The **letter** of the correct option (`A`–`E`) — mapped to its text on import |
| `marking_scheme` | theory | The examiner's marking guide |
| `max_marks` | – | Defaults to 1 |
| `explanation` | – | **Leave blank → AI generates & stores one** |
| `video_url` | – | YouTube/Vimeo link |
| `image` | – | Diagram filename (uploaded alongside) |
| `status` | – | `draft` (default) or `published` |
| `source_ref` | – | Stable ID for idempotent re-import, e.g. `JAMB-2019-MTH-Q12` |

We ship this as an `.xlsx`/`.csv` template with a filled example row and a data-
validation dropdown for `type`, `difficulty`, and `status`. Delivered as both a
CLI (`pnpm import:questions <file>`) and, later, an admin **Upload** screen.

---

## 5. Formats we accept

| Format | Path | Handling |
|---|---|---|
| **Spreadsheet** (`.xlsx`/`.csv`) | Tier A | Primary. Direct structured import. |
| **JSON** | Tier A | For programmatic/export-driven loads. |
| **PDF** (digital or scanned) | Tier B | Page-image extraction → review → publish. |
| **Images** (`.jpg`/`.png`) | Tier B / diagrams | Extraction, or attached as `questionImage`. |
| DOCX / other | — | **Not supported directly** — convert to the spreadsheet or PDF path. |

---

## 6. Review & quality flow

```
Import/extract → DRAFT (validated per row)
       → admin review in /admin (fix, attach diagrams, confirm answers)
       → PUBLISH
       → (MCQ, no explanation) AI auto-generates explanation  → free to students
       → (optional) Sonnet quality-gate on the draft explanation for bulk backfills
```

Theory questions can't publish usefully without a `marking_scheme`; the importer
flags any that are missing. Nothing goes live without passing validation.

---

## 7. Maths notation — decide before the big maths load

Explanations are currently **plain text** (`/` for division, `^` for powers) — fine
for English and light maths. For serious Further Maths/Physics you'll want **LaTeX/
MathML** rendering (textbook-style fractions, surds, matrices). This affects both
**capture** (how formulas enter the template) and **display** (a render step in the
quiz UI). Cheap to add, expensive to retrofit after thousands of rows — so pick now:
- **Plain text** (ship fast, acceptable for most WAEC/JAMB prose + light maths), or
- **LaTeX** (set up `$...$` capture + a KaTeX render step before loading maths-heavy banks).

---

## 8. Rollout sequence

1. **Bulk spreadsheet importer (Tier A)** + the template → unblocks the content team today.
2. **Promote `Topic` to a collection** + add `videoSolutionUrl` and `sourceRef` to Questions.
3. **AI-assisted PDF/image extractor (Tier B)** with admin review.
4. **Maths-notation decision** before the first large maths upload.
5. (Already built) AI explainer auto-fills explanations; AI marking grades theory.

---

## 9. Status & open decisions

**Decided & built:**
- [x] **Topic promoted to a first-class collection** (`topics`). Questions use a `topicRef`
  relationship; the old free-text `topic` column is **kept (hidden) as a fallback** so the
  migration was non-destructive. _Production cleanup:_ once content is fully on `topicRef`,
  drop the legacy `topic` column via a proper Payload migration.
- [x] **LaTeX chosen** for maths. Questions/options/explanations render `$...$` (inline) and
  `$$...$$` (display) via KaTeX (`src/components/MathText.tsx`); the AI prompts now emit LaTeX.
- [x] **Tier A importer built** — `pnpm import:questions -- <file.csv|json>` (template at
  `templates/questions-template.csv`), plus `videoSolutionUrl` and `sourceRef` fields.

**Still open (need client):**
- [ ] Spreadsheet vs. PDF as the client's **primary** delivery format (drives whether we build Tier B next).
- [ ] **Video hosting**: confirm unlisted YouTube/Vimeo links (recommended) vs. uploaded files.
- [ ] **Tier B (PDF/image extraction)** — build when the client confirms they have past-paper PDFs to digitise.
