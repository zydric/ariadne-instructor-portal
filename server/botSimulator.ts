import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Finding, IntegrityFlag, Submission, GuardrailPack } from './types.ts';
import { runAriadneScan } from './scanner.ts';
import { runIntegrityAudit } from './integrity.ts';
import { computeSubmissionScore } from './scoring.ts';
import { store } from './store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface BotSimulationRequest {
  studentId: string;
  assignmentId: string;
  guardrailPackId?: string;
  sampleKey: 'v1-initial' | 'v2-bypassed' | 'v3-fixed' | 'custom';
  customPath?: string;
  commitMessage?: string;
}

export interface BotSimulationResult {
  submission: Submission;
  checkRun: {
    name: string;
    status: 'completed';
    conclusion: 'success' | 'failure';
    title: string;
    summary: string;
    detailsUrl: string;
  };
  prCommentMarkdown: string;
  computedScore: ReturnType<typeof computeSubmissionScore>;
}

export async function simulateBotPush(req: BotSimulationRequest): Promise<BotSimulationResult> {
  const student = store.getStudent(req.studentId);
  if (!student) throw new Error(`Student ${req.studentId} not found.`);

  const assignment = store.getAssignment(req.assignmentId);
  if (!assignment) throw new Error(`Assignment ${req.assignmentId} not found.`);

  const packId = req.guardrailPackId || assignment.guardrailPackId;
  const pack = store.getGuardrailPack(packId) || store.getGuardrailPack('pack-3rd-year')!;
  if (!pack) throw new Error(`Guardrail pack ${packId} not found.`);

  // Resolve directory to scan
  let targetPath = '';
  if (req.sampleKey === 'custom' && req.customPath) {
    targetPath = resolve(req.customPath);
  } else {
    targetPath = resolve(__dirname, `../samples/${req.sampleKey}`);
  }

  // 1. Run real scanner binary
  const findings: Finding[] = await runAriadneScan(targetPath);

  // 2. Retrieve previous submission for integrity comparison
  let latestPrior: Submission | null = null;
  if (req.sampleKey === 'v2-bypassed' || req.sampleKey === 'v3-fixed') {
    // Compare against v1-initial baseline to detect what was changed, fixed, or bypassed
    const priorSubmissions = store.getSubmissions(req.assignmentId, req.studentId);
    latestPrior = priorSubmissions.find(s => s.commitMessage?.includes('v1-initial') || s.id === 'sub-demo-initial') || priorSubmissions[0] || null;
  }

  // 3. Run Academic Integrity Audit
  const integrityFlags: IntegrityFlag[] = runIntegrityAudit(findings, latestPrior, targetPath);

  // 4. Compute score & policy checks
  const scoreResult = computeSubmissionScore(findings, integrityFlags, pack);

  // Generate simulated commit SHA
  const randSha = Math.random().toString(16).substring(2, 9);
  const commitMsg = req.commitMessage || `Simulated push: update backend logic (${req.sampleKey})`;

  const newSubmission: Submission = {
    id: `sub-${Date.now()}`,
    assignmentId: req.assignmentId,
    studentId: req.studentId,
    commitSha: randSha,
    commitMessage: commitMsg,
    source: 'simulate',
    scannedAt: new Date().toISOString(),
    findings,
    integrityFlags
  };

  store.addSubmission(newSubmission);

  // Determine Check Run outcome
  const conclusion = scoreResult.passedPolicy ? 'success' : 'failure';
  const isClean100 = scoreResult.passedPolicy && scoreResult.score === 100;
  const checkTitle = isClean100
    ? 'All Ariadne Security Guardrails Passed (100/100)'
    : scoreResult.passedPolicy
      ? `Ariadne Security Passed with Warnings — Score: ${scoreResult.score}/100`
      : `Ariadne Security Gatekeeper Failed — Score: ${scoreResult.score}/100`;

  const summary = scoreResult.passedPolicy
    ? `No policy violations detected under guardrail pack "${pack.name}". All rules verified.`
    : scoreResult.policyViolations.join(' | ');

  // Generate GitHub PR Comment Markdown
  const prCommentMarkdown = buildPrCommentMarkdown(
    student.name,
    randSha,
    pack,
    scoreResult,
    findings,
    integrityFlags
  );

  return {
    submission: newSubmission,
    checkRun: {
      name: 'Ariadne SAST Gatekeeper',
      status: 'completed',
      conclusion,
      title: checkTitle,
      summary,
      detailsUrl: `http://localhost:5173/#/gradebook?student=${student.id}`
    },
    prCommentMarkdown,
    computedScore: scoreResult
  };
}

function buildPrCommentMarkdown(
  studentName: string,
  sha: string,
  pack: GuardrailPack,
  score: ReturnType<typeof computeSubmissionScore>,
  findings: Finding[],
  flags: IntegrityFlag[]
): string {
  const isCleanPass = score.passedPolicy && score.score === 100;
  const isWarningPass = score.passedPolicy && score.score < 100;
  const statusBadge = isCleanPass
    ? '**PASSING (MERGE APPROVED)**'
    : isWarningPass
      ? `**PASSING WITH WARNINGS (${score.score}/100)**`
      : '**FAILING (MERGE BLOCKED)**';

  let md = `## Ariadne Security Gatekeeper — ${statusBadge}\n\n`;
  md += `**Commit:** \`${sha}\` | **Student:** ${studentName} | **Guardrail Pack:** ${pack.name}\n`;
  md += `**Computed Security Score:** \`${score.score}/100\`\n\n`;

  if (!score.passedPolicy) {
    md += `### Policy Violations\n`;
    for (const v of score.policyViolations) {
      md += `- **${v}**\n`;
    }
    md += `\n`;
  }

  if (flags.length > 0) {
    md += `### Academic Integrity Audit Warnings\n`;
    md += `The gatekeeper detected possible bypass attempts compared to your previous commit:\n\n`;
    for (const f of flags) {
      const cleanFlagPath = f.file_path.replace(/^.*\/samples\/[^/]+\//, '').replace(/^instructor-portal\/samples\/[^/]+\//, '');
      md += `> **[${f.kind.toUpperCase()}] ${f.title}** (${f.cwe_id})\n`;
      md += `> *Location:* \`${cleanFlagPath}:${f.line_number}\`\n`;
      md += `> *Evidence:* ${f.evidence.explanation}\n`;
      if (f.evidence.currentSnippet) {
        md += `>\n\`\`\`java\n${f.evidence.currentSnippet}\n\`\`\`\n`;
      }
      md += `\n`;
    }
  }

  if (score.activeFindings.length > 0) {
    md += `### Detected Vulnerabilities (${score.activeFindings.length})\n\n`;
    md += `| Severity | Vulnerability | Rule ID | Location |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const f of score.activeFindings) {
      const cleanPath = f.file_path.replace(/^.*\/samples\/[^/]+\//, '').replace(/^instructor-portal\/samples\/[^/]+\//, '');
      const sevLabel = f.severity === 'critical' ? 'Critical' : f.severity === 'high' ? 'High' : 'Medium';
      md += `| ${sevLabel} | **${f.type}** (${f.cwe_id}) | \`${f.rule_id}\` | \`${cleanPath}:${f.line_number}\` |\n`;
    }
    md += `\n`;

    md += `### Pedagogical Guidance (How to Remediate)\n`;
    const cwes = new Set(score.activeFindings.map(f => f.cwe_id));
    if (cwes.has('CWE-89')) {
      md += `- **SQL Injection (CWE-89):** Never concatenate user strings into queries. Use \`PreparedStatement\` with positional placeholders (\`?\`) to enforce strict type separation between SQL code and untrusted data.\n`;
    }
    if (cwes.has('CWE-798')) {
      md += `- **Hardcoded Credentials (CWE-798):** Remove all plain-text passwords and API keys from source files. Retrieve credentials at runtime using \`System.getenv("VARIABLE_NAME")\`.\n`;
    }
    if (cwes.has('CWE-22')) {
      md += `- **Path Traversal (CWE-22):** Verify that input filenames cannot traverse directories. Use \`file.getCanonicalFile().getPath().startsWith(baseDir)\` to confine file operations to the allowed storage directory.\n`;
    }
    if (cwes.has('CWE-79')) {
      md += `- **Cross-Site Scripting (CWE-79):** Escape untrusted data prior to rendering in HTML responses using \`HtmlUtils.htmlEscape()\` to prevent arbitrary script execution in client browsers.\n`;
    }
    md += `\n*Note: Ariadne never provides copy-paste solutions. Understand the underlying security principle to build resilient systems.*\n`;
  } else {
    md += `### Zero Security Findings Detected\n`;
    md += `All active guardrail rules satisfied. Good engineering hygiene!\n`;
  }

  return md;
}
