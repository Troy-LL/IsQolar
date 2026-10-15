// tests/landing_check.mjs
// Static checks for the M3 landing page.
// Run: node tests/landing_check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
let _pass = 0, _fail = 0;
function ok(label, cond) {
  if (cond) { console.log('  PASS  ' + label); _pass++; }
  else { console.error('  FAIL  ' + label); _fail++; }
}
// Test 1: frozen exports
console.log('\nTest 1: frozen store exports');
{
  const src = readFileSync(join(ROOT, 'source/js/store.js'), 'utf8');
  const REQ = ['init','start','subscribe','tick','getColleges','stepOrder','isDemo','join','view','myTicketNo','leave','guardianCodeFor','guardianView','guardianRequest','guardianLogin','setAccess','setGuardianPhone','takeControl','staffView','staffCallNext','staffMarkDone','staffHold','staffRecall','undo','undoEnrolled','lookup','adminView','boardScreens','boardView','coursesView','exploreView','collegeView','estimate','mask','formatCode','ticketLabel','resetAll','toggleOffline','isOffline','GUARDIAN_STALE_MS','advance','callMe','markDone'];
  const miss = REQ.filter(n => !src.includes('export function '+n) && !src.includes('export const '+n) && !src.includes('export let '+n));
  ok('all 43 frozen exports present', miss.length === 0);
  if (miss.length) console.error('    Missing: ' + miss.join(', '));
}
// Test 2: en strings
console.log('\nTest 2: landing strings in strings.en.js');
{
  const src = readFileSync(join(ROOT, 'source/js/strings.en.js'), 'utf8');
  const KEYS = ['navFeatures','navHowItWorks','navLiveCount','navPreview','navFaqs','personaStudent','personaGuardian','personaStaff','personaBoard','personaStudentDesc','personaGuardianDesc','personaStaffDesc','personaBoardDesc','featureTitle1','featureDesc1','featureTitle2','featureDesc2','featureTitle3','featureDesc3','benefit1Title','benefit1Desc','benefit2Title','benefit2Desc','benefit3Title','benefit3Desc','benefit4Title','benefit4Desc','benefit5Title','benefit5Desc','benefit6Title','benefit6Desc','howTitle1','howDesc1','howTitle2','howDesc2','howTitle3','howDesc3','howTitle4','howDesc4','previewHeading','previewSub','nowServing','waiting','liveCountHeading','liveCountSub','liveCountSelect','liveCountSlots','liveCountFull','liveCountTotal','bannerText','footerTagline','footerBuilt','footerTeam','toolsOfflineOn','toolsOfflineOff','heroHeading','heroSub','tryPrototype','featuresHeading','benefitsHeading','howHeading','faqHeading','toolsHeading','toolsReset','toolsOffline'];
  const miss = KEYS.filter(k => !src.includes(k + ':'));
  ok('all ' + KEYS.length + ' landing keys in strings.en.js', miss.length === 0);
  if (miss.length) console.error('    Missing: ' + miss.join(', '));
}
// Test 3: fil strings
console.log('\nTest 3: landing strings in strings.fil.js');
{
  const src = readFileSync(join(ROOT, 'source/js/strings.fil.js'), 'utf8');
  const KEYS = ['navFeatures','navHowItWorks','personaStudent','personaGuardian','personaStaff','personaBoard','featureTitle1','featureTitle2','featureTitle3','benefit1Title','benefit2Title','benefit3Title','benefit4Title','benefit5Title','benefit6Title','howTitle1','howTitle2','howTitle3','howTitle4','previewHeading','liveCountHeading','bannerText','footerTagline'];
  const miss = KEYS.filter(k => !src.includes(k + ':'));
  ok('key landing strings in strings.fil.js', miss.length === 0);
  if (miss.length) console.error('    Missing: ' + miss.join(', '));
}
// Test 4: home.js frozen imports
console.log('\nTest 4: home.js frozen store imports');
{
  const src = readFileSync(join(ROOT, 'source/js/views/home.js'), 'utf8');
  const m = src.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/store\.js['"]/);
  if (!m) { ok('home.js imports store.js', false); }
  else {
    const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const FROZEN = new Set(['init','start','subscribe','tick','getColleges','stepOrder','isDemo','join','view','myTicketNo','leave','guardianCodeFor','guardianView','guardianRequest','guardianLogin','setAccess','setGuardianPhone','takeControl','staffView','staffCallNext','staffMarkDone','staffHold','staffRecall','undo','undoEnrolled','lookup','adminView','boardScreens','boardView','coursesView','exploreView','collegeView','estimate','mask','formatCode','ticketLabel','resetAll','toggleOffline','isOffline','GUARDIAN_STALE_MS','advance','callMe','markDone','SPEED','timeSinceTick']);
    const bad = names.filter(n => !FROZEN.has(n));
    ok('home.js imports only frozen names (' + names.join(', ') + ')', bad.length === 0);
    if (bad.length) console.error('    Unauthorised: ' + bad.join(', '));
  }
}
// Test 5: data-* hooks
console.log('\nTest 5: data-* hooks in home.js');
{
  const src = readFileSync(join(ROOT, 'source/js/views/home.js'), 'utf8');
  const HOOKS = ['data-go','data-tool','data-langset','data-faq'];
  const miss = HOOKS.filter(h => !src.includes(h));
  ok('expected data-* hooks', miss.length === 0);
  if (miss.length) console.error('    Missing: ' + miss.join(', '));
}
// Test 6: landing.css
console.log('\nTest 6: landing.css');
{
  const css = readFileSync(join(ROOT, 'source/css/landing.css'), 'utf8');
  ok('.lp-ghost pointer-events:none', css.includes('.lp-ghost') && css.includes('pointer-events: none'));
  ok('.lp-navwrap.lp-navwrap--static doubled selector', css.includes('.lp-navwrap.lp-navwrap--static'));
  ok('prefers-reduced-motion', css.includes('prefers-reduced-motion'));
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const hexMatch = noComments.match(/:\s*#[0-9a-fA-F]{3,6}(?!\s*\))/);
  ok('no raw hex colors (only var(--...))', !hexMatch);
  if (hexMatch) console.error('    Found: ' + hexMatch[0]);
}
// Test 7: CSS load order
console.log('\nTest 7: index.html CSS order');
{
  const html = readFileSync(join(ROOT, 'source/index.html'), 'utf8');
  const order = ['tokens.css','components.css','gradient.css','screens.css','landing.css'];
  let last = -1, ok7 = true;
  for (const f of order) { const idx = html.indexOf(f); if (idx === -1 || idx <= last) { ok7 = false; break; } last = idx; }
  ok('tokens > components > gradient > screens > landing', ok7);
}
// Test 8: mount export
console.log('\nTest 8: home.js exports mount');
{
  const src = readFileSync(join(ROOT, 'source/js/views/home.js'), 'utf8');
  ok('export function mount', src.includes('export function mount'));
}
console.log('\n' + _pass + ' passed, ' + _fail + ' failed');
if (_fail > 0) process.exit(1);
console.log('\nManual checks (no browser -- M7 Playwright audit):');
console.log('  1. Load #home, check console errors.');
console.log('  2. Click each nav link: scroll to section.');
console.log('  3. Click Try the prototype: go to #student.');
console.log('  4. Click 4 persona cards: correct hash.');
console.log('  5. Reset button: data resets.');
console.log('  6. Network loss button: label changes.');
console.log('  7. Click 8 FAQs: expand/collapse, aria-expanded.');
console.log('  8. EN|FIL switch: all strings change.');
console.log('  9. At 320, 360, 390, 430, 1280px: no horizontal scroll, no clipped text.');