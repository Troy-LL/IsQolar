// Placeholder course content. Replace with the registrar's and departments' own text before the pilot.
export const REQUIREMENTS = ['req.1', 'req.2', 'req.3', 'req.4', 'req.5'];
export const SAMPLE_SUBJECTS = [
  'Understanding the Self', 'Readings in Philippine History', 'Mathematics in the Modern World',
  'Purposive Communication', 'Art Appreciation', 'Physical Fitness (PATHFIT 1)', 'National Service Training Program (NSTP 1)',
];
export const COLLEGES_URL = 'https://www.pup.edu.ph/academic/colleges';

// Sample general education curriculum by year. Major subjects are set by each department, so years 3 and 4 stay empty until they are added.
export const CURRICULUM = {
  1: [['GE 1', 'Understanding the Self', 3], ['GE 2', 'Readings in Philippine History', 3], ['GE 4', 'Mathematics in the Modern World', 3], ['GE 5', 'Purposive Communication', 3], ['GE 6', 'Art Appreciation', 3], ['PATHFIT 1', 'Movement Competency Training', 2], ['NSTP 1', 'National Service Training Program 1', 3]],
  2: [['GE 3', 'The Contemporary World', 3], ['GE 7', 'Science, Technology and Society', 3], ['GE 8', 'Ethics', 3], ['PATHFIT 2', 'Exercise-based Fitness Activities', 2], ['PATHFIT 3', 'Menu of Physical Activities', 2], ['NSTP 2', 'National Service Training Program 2', 3]],
  3: [['RIZAL', 'The Life and Works of Rizal', 3]],
  4: [],
};

// Campus guide. Campuses and landmarks are from pup.edu.ph (Mabini Campus, NDC Compound, M.H. del Pilar Campus).
// Which building each Mabini college sits in is not published there, so it is left as "to be confirmed". The layout is schematic, not to scale.
export const CAMPUSES = {
  mabini: { name: 'Mabini Campus', tag: 'Main campus', where: 'Sta. Mesa, Manila · 10.71 hectares', guide: 'Enter through the PUP Pylon and Mural. Look for the Main Academic Building and Freedom Plaza in front of it.', landmarks: ['PUP Pylon and Mural (gate)', 'Freedom Plaza', 'Main Academic Building', 'Ninoy Aquino Library', 'Gym and open courts', 'Grandstand and Oval', 'The Obelisk'] },
  ndc: { name: 'NDC Compound', tag: 'Near the Mabini Campus', where: 'Sta. Mesa, Manila', guide: 'A separate campus in Sta. Mesa, near the Mabini Campus. Home of the PUP MassCom Theater.', landmarks: ['PUP MassCom Theater'] },
  mhdp: { name: 'M.H. del Pilar Campus', tag: 'One of three Sta. Mesa campuses', where: 'Sta. Mesa, Manila', guide: 'A separate campus in Sta. Mesa. It also houses the Graduate School and Hasmin Hostel.', landmarks: ['Graduate School', 'Hasmin Hostel'] },
};
export const COLLEGE_CAMPUS = { CADBE: 'ndc', CE: 'ndc', COC: 'ndc', CTHTM: 'mhdp' };   // everything else defaults to Mabini (building to be confirmed)
export const campusOf = (college) => COLLEGE_CAMPUS[college] || 'mabini';
