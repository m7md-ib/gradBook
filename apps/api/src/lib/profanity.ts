/**
 * Basic profanity filtering. This is intentionally a small, editable wordlist —
 * not a substitute for human/admin moderation, which remains the primary
 * safeguard (see notebooks.approvalMode and the reports/moderation_actions tables).
 */
const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'whore',
  'كسم', 'كس أم', 'ابن كلب', 'يا كلب', 'شرموط', 'قحبة', 'زانية', 'حقير',
];

const pattern = new RegExp(
  `\\b(${BLOCKED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'giu',
);

export function containsProfanity(text: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

export function maskProfanity(text: string): string {
  pattern.lastIndex = 0;
  return text.replace(pattern, (match) => '*'.repeat(match.length));
}
