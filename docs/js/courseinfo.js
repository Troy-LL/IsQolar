// js/courseinfo.js — requirements, sample curriculum, campus data
// All content here is sample/placeholder. See HANDOFF.md section 8.

/** Sample requirements list (labelled as sample in the UI). */
export const sampleRequirements = [
  'Signed SAR-FORM 1 (admission slip)',
  '2 pcs 2x2 ID photos (white background)',
  'Original and photocopy of Form 138 (high school card)',
  'Birth certificate (PSA-authenticated)',
  'Good moral certificate',
  'Chest X-ray result',
  'Medical certificate',
];

/** Campus zones with known building assignments. */
export const campuses = [
  {
    code: 'mabini',
    name: 'Mabini Campus',
    desc: 'Main campus. Pylon and Mural gate, Main Academic Building, Freedom Plaza, Ninoy Aquino Library, gym, Grandstand and Oval, Obelisk.',
    landmarks: ['Pylon and Mural', 'Freedom Plaza', 'Main Academic Building', 'Ninoy Aquino Library', 'Grandstand and Oval', 'Obelisk'],
  },
  {
    code: 'ndc',
    name: 'NDC Compound',
    desc: 'Holds Architecture and Fine Arts, Engineering, and Communication colleges.',
    landmarks: [],
  },
  {
    code: 'mh',
    name: 'M.H. del Pilar Campus',
    desc: 'Holds Tourism, Hospitality, and Transportation Management.',
    landmarks: [],
  },
];

/**
 * Sample curriculum for a program.
 * Returns { year: number, subjects: { name, units }[] }[]
 * Content is placeholder; replace with real data from the registrar.
 */
export function sampleCurriculum(programCode) {
  const ge = [
    { name: 'Mathematics in the Modern World', units: 3 },
    { name: 'Understanding the Self', units: 3 },
    { name: 'Readings in Philippine History', units: 3 },
    { name: 'The Contemporary World', units: 3 },
    { name: 'Ethics', units: 3 },
    { name: 'Art Appreciation', units: 3 },
    { name: 'Science, Technology and Society', units: 3 },
    { name: 'Purposive Communication', units: 3 },
  ];

  // Placeholder: split GE subjects across year 1 and 2; years 3-4 are empty (major subjects by department)
  return [
    { year: 1, subjects: ge.slice(0, 4), note: null },
    { year: 2, subjects: ge.slice(4),   note: null },
    { year: 3, subjects: [], note: 'Major subjects — provided by department' },
    { year: 4, subjects: [], note: 'Major subjects — provided by department' },
  ];
}
