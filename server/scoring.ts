import type { ComputedScore, Finding, GuardrailPack, IntegrityFlag, Severity } from './types.ts';

const SEVERITY_PENALTIES: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3
};

const INTEGRITY_FLAG_PENALTY = 10;

export function computeSubmissionScore(
  findings: Finding[],
  flags: IntegrityFlag[],
  pack: GuardrailPack
): ComputedScore {
  const activeFindings: Finding[] = [];
  const ignoredFindings: Finding[] = [];

  for (const f of findings) {
    // If rule exists in pack.rules and is explicitly set to false, it's ignored.
    // If not specified or true, it is active.
    const isRuleEnabled = pack.rules[f.rule_id] !== false;
    if (isRuleEnabled) {
      activeFindings.push(f);
    } else {
      ignoredFindings.push(f);
    }
  }

  let penaltyCritical = 0;
  let penaltyHigh = 0;
  let penaltyMedium = 0;
  let penaltyLow = 0;

  for (const f of activeFindings) {
    const sev = (f.severity?.toLowerCase() || 'medium') as Severity;
    switch (sev) {
      case 'critical':
        penaltyCritical += SEVERITY_PENALTIES.critical;
        break;
      case 'high':
        penaltyHigh += SEVERITY_PENALTIES.high;
        break;
      case 'medium':
        penaltyMedium += SEVERITY_PENALTIES.medium;
        break;
      case 'low':
        penaltyLow += SEVERITY_PENALTIES.low;
        break;
    }
  }

  const penaltyIntegrity = flags.length * INTEGRITY_FLAG_PENALTY;
  const totalDeductions = penaltyCritical + penaltyHigh + penaltyMedium + penaltyLow + penaltyIntegrity;
  const rawScore = 100 - totalDeductions;
  const clampedScore = Math.max(0, Math.min(100, rawScore));

  const policyViolations: string[] = [];

  const MIN_PASSING_SCORE = 75;
  if (clampedScore < MIN_PASSING_SCORE) {
    policyViolations.push(`Failing Security Score: Score (${clampedScore}/100) is below the minimum passing threshold (${MIN_PASSING_SCORE}/100).`);
  }

  const hasCritical = activeFindings.some(f => f.severity.toLowerCase() === 'critical');
  const hasHighOrCritical = activeFindings.some(f => {
    const s = f.severity.toLowerCase();
    return s === 'critical' || s === 'high';
  });

  if (pack.policies.zeroCritical && hasCritical) {
    policyViolations.push('Zero Critical Policy: One or more Critical vulnerabilities detected.');
  }

  if (pack.policies.blockMergeOnHigh && hasHighOrCritical) {
    policyViolations.push('Block on High+ Policy: High or Critical severity findings present.');
  }

  if (flags.length > 0) {
    policyViolations.push(`Academic Integrity Flag: ${flags.length} potential bypass attempt(s) detected.`);
  }

  const passedPolicy = policyViolations.length === 0;

  return {
    score: clampedScore,
    baseScore: 100,
    penalties: {
      critical: penaltyCritical,
      high: penaltyHigh,
      medium: penaltyMedium,
      low: penaltyLow,
      integrity: penaltyIntegrity
    },
    passedPolicy,
    policyViolations,
    activeFindings,
    ignoredFindings,
    flags
  };
}
