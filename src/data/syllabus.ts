/* ============================================================================
 * MISSION 100 — Preloaded 90-day syllabus (source of truth)
 * ----------------------------------------------------------------------------
 * The schedule below is transcribed exactly from the supplied study plan for
 * October 13, 2026 – January 10, 2027. Topic titles, day numbers, and dates
 * are preserved verbatim. Nothing here is independently verified against any
 * examination syllabus; this is the supplied plan, not a coverage guarantee.
 * Computer Science is intentionally excluded.
 * ==========================================================================*/

import type { Assessment, Day, Subject, TaskType, Topic } from '../types';
import { DATA_VERSION } from '../types';
import { dateForDay, PLAN_END, PLAN_START, TOTAL_DAYS } from '../lib/dates';

/** Each entry: [Physics, Chemistry, Mathematics] — index 0 = Day 1. */
const SCHEDULE: [string, string, string][] = [
  // ── OCTOBER 2026 — DAYS 1–19 ──────────────────────────────────────────────
  ['Electric charge basics', 'Solutions: basics', 'Relations: basics'], // Day 1 — Oct 13
  ['Properties of charge', 'Concentration terms', 'Types of relations'], // Day 2 — Oct 14
  ["Coulomb's law", 'Mole fraction, molarity', 'Types of functions'], // Day 3 — Oct 15
  ['Superposition principle', "Henry's law", 'Composition of functions'], // Day 4 — Oct 16
  ['Electric field', "Raoult's law", 'Invertible functions'], // Day 5 — Oct 17
  ['Electric field lines', 'Ideal and nonideal solutions', 'Chapter practice'], // Day 6 — Oct 18
  ['Electric dipole', 'Colligative properties', 'Inverse trigonometric functions'], // Day 7 — Oct 19
  ['Dipole in electric field', 'Elevation of boiling point', 'Principal values'], // Day 8 — Oct 20
  ['Electric flux', 'Depression of freezing point', 'Inverse trig identities'], // Day 9 — Oct 21
  ["Gauss's law", 'Osmotic pressure', 'Inverse trig practice'], // Day 10 — Oct 22
  ["Applications of Gauss's law", 'Abnormal molar mass', 'Matrices: introduction'], // Day 11 — Oct 23
  ['Chapter 1 test', 'Solutions chapter test', 'Types of matrices'], // Day 12 — Oct 24
  ['Potential and capacitance', 'Electrochemistry: basics', 'Matrix operations'], // Day 13 — Oct 25
  ['Electric potential', 'Electrochemical cells', 'Matrix multiplication'], // Day 14 — Oct 26
  ['Potential due to charges', 'Electrode potential', 'Transpose of matrices'], // Day 15 — Oct 27
  ['Equipotential surfaces', 'Nernst equation', 'Symmetric matrices'], // Day 16 — Oct 28
  ['Potential energy', 'Conductance', 'Inverse of matrices'], // Day 17 — Oct 29
  ['Conductors and dielectrics', "Kohlrausch's law", 'Matrix practice'], // Day 18 — Oct 30
  ['Capacitors', 'Electrolysis', 'Matrices chapter test'], // Day 19 — Oct 31
  // ── NOVEMBER 2026 — DAYS 20–49 ───────────────────────────────────────────
  ['Capacitor combinations', 'Batteries and fuel cells', 'Determinants: basics'], // Day 20 — Nov 1
  ['Energy stored in capacitor', 'Corrosion', 'Properties of determinants'], // Day 21 — Nov 2
  ['Chapter 2 test', 'Electrochemistry test', 'Minors and cofactors'], // Day 22 — Nov 3
  ['Current electricity: basics', 'Chemical kinetics: basics', 'Adjoint and inverse'], // Day 23 — Nov 4
  ['Drift velocity', 'Rate of reaction', 'Applications of determinants'], // Day 24 — Nov 5
  ["Ohm's law", 'Rate law', 'Linear equations'], // Day 25 — Nov 6
  ['Resistance and resistivity', 'Order of reaction', 'Determinants test'], // Day 26 — Nov 7
  ['Electrical energy and power', 'Integrated rate equations', 'Continuity: introduction'], // Day 27 — Nov 8
  ['Cells and internal resistance', 'Half-life', 'Limits revision'], // Day 28 — Nov 9
  ["Kirchhoff's laws", 'Arrhenius equation', 'Continuity problems'], // Day 29 — Nov 10
  ['Wheatstone bridge', 'Kinetics test', 'Differentiability'], // Day 30 — Nov 11
  ['Current electricity test', 'd- and f-block: introduction', 'Derivative rules'], // Day 31 — Nov 12
  ['Moving charges: basics', 'Electronic configuration', 'Chain rule'], // Day 32 — Nov 13
  ['Magnetic force', 'Transition elements', 'Implicit differentiation'], // Day 33 — Nov 14
  ['Motion in magnetic field', 'Oxidation states', 'Logarithmic differentiation'], // Day 34 — Nov 15
  ['Biot–Savart law', 'Lanthanoids', 'Parametric differentiation'], // Day 35 — Nov 16
  ["Ampere's circuital law", 'Actinoids', 'Second-order derivatives'], // Day 36 — Nov 17
  ['Force between conductors', 'd- and f-block test', 'Differentiation test'], // Day 37 — Nov 18
  ['Moving coil galvanometer', 'Coordination compounds: basics', 'Applications of derivatives'], // Day 38 — Nov 19
  ['Moving charges test', 'Nomenclature', 'Rate of change'], // Day 39 — Nov 20
  ['Magnetism and matter', 'Isomerism', 'Increasing/decreasing functions'], // Day 40 — Nov 21
  ['Bar magnet', 'Bonding', 'Maxima and minima'], // Day 41 — Nov 22
  ['Magnetic properties', 'Crystal field theory', 'AOD problems'], // Day 42 — Nov 23
  ['Magnetism chapter test', 'Coordination compounds test', 'AOD test'], // Day 43 — Nov 24
  ['Electromagnetic induction', 'Haloalkanes: basics', 'Integrals: introduction'], // Day 44 — Nov 25
  ["Faraday's law", 'Preparation of haloalkanes', 'Basic integration formulas'], // Day 45 — Nov 26
  ["Lenz's law", 'Chemical reactions', 'Integration by substitution'], // Day 46 — Nov 27
  ['Motional EMF', 'Reaction mechanisms', 'Integration by parts'], // Day 47 — Nov 28
  ['Inductance', 'Haloarenes', 'Partial fractions'], // Day 48 — Nov 29
  ['EMI chapter test', 'Haloalkanes test', 'Integration practice'], // Day 49 — Nov 30
  // ── DECEMBER 2026 — DAYS 50–80 ───────────────────────────────────────────
  ['Alternating current', 'Alcohols: basics', 'Integration methods'], // Day 50 — Dec 1
  ['AC voltage and current', 'Preparation of alcohols', 'Trigonometric integrals'], // Day 51 — Dec 2
  ['Reactance', 'Chemical reactions', 'Definite integrals'], // Day 52 — Dec 3
  ['Impedance', 'Phenols', 'Properties of definite integrals'], // Day 53 — Dec 4
  ['Resonance', 'Ethers', 'Definite integral practice'], // Day 54 — Dec 5
  ['Transformers', 'Alcohols chapter test', 'Integrals test'], // Day 55 — Dec 6
  ['AC chapter test', 'Aldehydes: basics', 'Applications of integrals'], // Day 56 — Dec 7
  ['Electromagnetic waves', 'Ketones', 'Area under curves'], // Day 57 — Dec 8
  ['EM spectrum', 'Preparation methods', 'Area between curves'], // Day 58 — Dec 9
  ['EM waves test', 'Chemical reactions', 'Applications test'], // Day 59 — Dec 10
  ['Ray optics: reflection', 'Nucleophilic addition', 'Differential equations: basics'], // Day 60 — Dec 11
  ['Spherical mirrors', 'Carboxylic acids', 'Formation of differential equations'], // Day 61 — Dec 12
  ['Refraction', 'Chemical properties', 'Variable separable method'], // Day 62 — Dec 13
  ['Total internal reflection', 'Carbonyl compounds test', 'Homogeneous equations'], // Day 63 — Dec 14
  ['Refraction at spherical surfaces', 'Amines: basics', 'Linear differential equations'], // Day 64 — Dec 15
  ['Lenses', 'Preparation of amines', 'Differential equations test'], // Day 65 — Dec 16
  ["Lens maker's formula", 'Chemical reactions', 'Vectors: introduction'], // Day 66 — Dec 17
  ['Prism', 'Diazonium salts', 'Vector operations'], // Day 67 — Dec 18
  ['Optical instruments', 'Amines test', 'Dot product'], // Day 68 — Dec 19
  ['Ray optics test', 'Biomolecules: carbohydrates', 'Cross product'], // Day 69 — Dec 20
  ['Wave optics: basics', 'Proteins', 'Vector applications'], // Day 70 — Dec 21
  ["Huygens' principle", 'Vitamins', 'Vectors test'], // Day 71 — Dec 22
  ['Interference', 'Nucleic acids', 'Three-dimensional geometry'], // Day 72 — Dec 23
  ["Young's double-slit experiment", 'Biomolecules test', 'Direction cosines'], // Day 73 — Dec 24
  ['Diffraction', 'Chemistry revision', 'Equation of a line'], // Day 74 — Dec 25
  ['Wave optics test', 'Chemistry revision', 'Angle between lines'], // Day 75 — Dec 26
  ['Dual nature of radiation', 'Physical Chemistry test', 'Shortest distance'], // Day 76 — Dec 27
  ['Photoelectric effect', 'Inorganic Chemistry test', '3D geometry test'], // Day 77 — Dec 28
  ['Matter waves', 'Organic Chemistry test', 'Linear programming'], // Day 78 — Dec 29
  ['Dual nature test', 'Weak topics', 'Probability: basics'], // Day 79 — Dec 30
  ['Atoms: Bohr\'s model', 'Full syllabus revision', 'Conditional probability'], // Day 80 — Dec 31
  // ── JANUARY 2027 — DAYS 81–90 ────────────────────────────────────────────
  ['Atoms: energy levels', 'Solutions revision', "Bayes' theorem"], // Day 81 — Jan 1
  ['Atoms chapter test', 'Electrochemistry revision', 'Random variables'], // Day 82 — Jan 2
  ['Nuclei: composition', 'Chemical kinetics revision', 'Probability distributions'], // Day 83 — Jan 3
  ['Binding energy', 'Inorganic revision', 'Probability practice'], // Day 84 — Jan 4
  ['Nuclear reactions', 'Organic revision', 'Probability test'], // Day 85 — Jan 5
  ['Nuclei test', 'Chemistry board practice', 'Calculus revision'], // Day 86 — Jan 6
  ['Semiconductor electronics', 'Chemistry numericals', 'Algebra revision'], // Day 87 — Jan 7
  ['Diodes and applications', 'Chemistry chapter tests', 'Vectors and 3D revision'], // Day 88 — Jan 8
  ['Semiconductor test', 'Full Chemistry test', 'Mathematics board practice'], // Day 89 — Jan 9
  ['Full Physics revision test', 'Chemistry error correction', 'Mathematics revision test'], // Day 90 — Jan 10
];

function chapterFor(subject: Subject, day: number): string {
  if (subject === 'Physics') {
    if (day <= 12) return 'Electric Charges and Fields';
    if (day <= 22) return 'Electrostatic Potential & Capacitance';
    if (day <= 31) return 'Current Electricity';
    if (day <= 39) return 'Moving Charges and Magnetism';
    if (day <= 43) return 'Magnetism and Matter';
    if (day <= 49) return 'Electromagnetic Induction';
    if (day <= 56) return 'Alternating Current';
    if (day <= 59) return 'Electromagnetic Waves';
    if (day <= 69) return 'Ray Optics & Optical Instruments';
    if (day <= 75) return 'Wave Optics';
    if (day <= 79) return 'Dual Nature of Radiation and Matter';
    if (day <= 82) return 'Atoms';
    if (day <= 86) return 'Nuclei';
    if (day <= 89) return 'Semiconductor Electronics';
    return 'Full Syllabus';
  }
  if (subject === 'Chemistry') {
    if (day <= 12) return 'Solutions';
    if (day <= 22) return 'Electrochemistry';
    if (day <= 30) return 'Chemical Kinetics';
    if (day <= 37) return 'd- and f-Block Elements';
    if (day <= 43) return 'Coordination Compounds';
    if (day <= 49) return 'Haloalkanes and Haloarenes';
    if (day <= 55) return 'Alcohols, Phenols and Ethers';
    if (day <= 63) return 'Aldehydes, Ketones & Carboxylic Acids';
    if (day <= 68) return 'Amines';
    if (day <= 73) return 'Biomolecules';
    if (day <= 75) return 'Revision';
    if (day === 76) return 'Physical Chemistry';
    if (day === 77) return 'Inorganic Chemistry';
    if (day === 78) return 'Organic Chemistry';
    if (day === 79) return 'Weak Areas';
    if (day === 80) return 'Full Syllabus';
    if (day === 81) return 'Solutions';
    if (day === 82) return 'Electrochemistry';
    if (day === 83) return 'Chemical Kinetics';
    if (day === 84) return 'Inorganic Chemistry';
    if (day === 85) return 'Organic Chemistry';
    if (day === 86) return 'Board Practice';
    if (day === 87) return 'Numericals';
    if (day === 88) return 'Chapter Tests';
    return 'Full Syllabus';
  }
  // Mathematics
  if (day <= 6) return 'Relations and Functions';
  if (day <= 10) return 'Inverse Trigonometric Functions';
  if (day <= 19) return 'Matrices';
  if (day <= 26) return 'Determinants';
  if (day <= 37) return 'Continuity and Differentiability';
  if (day <= 43) return 'Applications of Derivatives';
  if (day <= 55) return 'Integrals';
  if (day <= 59) return 'Applications of Integrals';
  if (day <= 65) return 'Differential Equations';
  if (day <= 71) return 'Vectors';
  if (day <= 77) return 'Three-Dimensional Geometry';
  if (day === 78) return 'Linear Programming';
  if (day <= 85) return 'Probability';
  if (day === 86) return 'Calculus';
  if (day === 87) return 'Algebra';
  if (day === 88) return 'Vectors and 3D';
  return 'Board Practice';
}

function taskTypeFor(title: string): TaskType {
  const t = title.toLowerCase();
  if (/\btest\b/.test(t)) return 'Test';
  if (/revision|revise/.test(t)) return 'Revision';
  if (/practice|numericals|problems|error correction|weak topics/.test(t)) return 'Practice';
  return 'Concept';
}

function subjectKey(subject: Subject): string {
  return subject === 'Physics' ? 'phy' : subject === 'Chemistry' ? 'chem' : 'math';
}

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

/** Build the immutable 90-day schedule: days + topic records. */
export function buildSchedule(): { topics: Record<string, Topic>; days: Record<string, Day> } {
  const topics: Record<string, Topic> = {};
  const days: Record<string, Day> = {};
  const subjects: Subject[] = ['Physics', 'Chemistry', 'Mathematics'];

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dayNumber = i + 1;
    const date = dateForDay(dayNumber);
    days[String(dayNumber)] = {
      id: `day-${pad(dayNumber)}`,
      dayNumber,
      date,
      notes: '',
    };
    const row = SCHEDULE[i];
    subjects.forEach((subject, si) => {
      const title = row[si];
      const id = `d${pad(dayNumber)}-${subjectKey(subject)}-0`;
      topics[id] = {
        id,
        dayNumber,
        subject,
        chapter: chapterFor(subject, dayNumber),
        title,
        taskType: taskTypeFor(title),
        status: 'Not Started',
        originalScheduledDate: date,
        revisedTargetDate: null,
        completedAt: null,
        confidence: null,
        needsRevision: false,
        notes: '',
        actualDurationMinutes: null,
      };
    });
  }
  return { topics, days };
}

/**
 * Assessment records for scheduled test-type tasks. Completing the scheduled
 * task and entering a score are separate actions — these records are linked to
 * the checklist item via relatedTopicIds. No scores or maximum marks are
 * invented; they start empty ("Not graded").
 */
export function buildScheduledAssessments(topics: Record<string, Topic>): Assessment[] {
  return Object.values(topics)
    .filter((t) => t.taskType === 'Test')
    .map((t) => ({
      id: `as-${t.id}`,
      title: t.title,
      date: t.originalScheduledDate,
      subject: t.subject,
      relatedTopicIds: [t.id],
      status: 'Upcoming' as const,
      maximumMarks: null,
      marksObtained: null,
      mistakes: '',
      nextAction: '',
      isCustom: false,
    }));
}

export const SCHEDULE_META = {
  name: 'MISSION 100 — 90-Day PCM Execution Plan',
  startDate: PLAN_START,
  endDate: PLAN_END,
  totalDays: TOTAL_DAYS,
  dayCount: SCHEDULE.length,
  notes:
    'Supplied study plan transcribed exactly as provided. Not independently verified as complete coverage of any examination syllabus.',
  dataVersion: DATA_VERSION,
};

/* Guard: keep the transcription honest. */
if (SCHEDULE.length !== TOTAL_DAYS) {
  console.error(`[MISSION 100] Schedule has ${SCHEDULE.length} entries; expected ${TOTAL_DAYS}.`);
}
