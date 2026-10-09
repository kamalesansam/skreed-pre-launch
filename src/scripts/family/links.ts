// FamilyLinksNav.astro's script (mounted through FamilyLinks.astro): wires nav#families on the page that mounts it (the
// landing's section 2). Runs on every path, poster and 3D; the section 2 island adds the canvas part with installRockNav
// and placeLinkBoxes.
import { installFamilyLinks, isReturnVisit } from './rock-links.ts';

const nav = document.getElementById('families');
if (nav) {
  installFamilyLinks(nav);
  // Back from a family page without the back-forward cache, on the poster path: the landing keeps manual scroll
  // restoration (the loader), so bring the visitor back to the links they left from. The 3D path's return to section
  // 2's rest position is the island's (isReturnVisit in the loader's skip path, spec 2.2).
  if (isReturnVisit() && !document.documentElement.classList.contains('hero3d')) nav.scrollIntoView({ block: 'center', behavior: 'instant' });
}
