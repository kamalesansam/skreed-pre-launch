// Section 3's ground (docs/specs/quiz.md 5, amended 2026-11-06): the flat colour the hero island draws under the quiz
// on the 3D path, in place of section 2's fog (E-S3-bg, withdrawn). The site review of 2026-11-05, sent by Jyotika and
// forwarded by Sam with "deploy directly": "Change the quiz background. Remove the light-to-dark gradient or shifting
// background effect so the text remains clearly readable at all times. Make sure there's enough contrast between the
// background and text." The quiz's own ground where no island draws, the page's --night (tokens.css), so the section
// reads the same on every tier: Pearl Whisper on it is about 19:1. Exact sRGB, as section 5's SIGNUP_GROUND: the
// composite copies the texel as it is.
export const QUIZ_GROUND = '#050506';
