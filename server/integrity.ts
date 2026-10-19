import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Finding, IntegrityFlag, Submission } from './types.ts';

export function runIntegrityAudit(
  currentFindings: Finding[],
  previousSubmission: Submission | null,
  targetDirectory?: string
): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  if (!previousSubmission) {
    return flags;
  }

  const prevFindings = previousSubmission.findings || [];
  const currentFingerprints = new Set(
    currentFindings.map(f => f.logical_fingerprint || `${f.rule_id}:${f.file_path}:${f.line_number}`)
  );

  // Check each previous finding that is no longer detected in the current submission
  for (const prevF of prevFindings) {
    const key = prevF.logical_fingerprint || `${prevF.rule_id}:${prevF.file_path}:${prevF.line_number}`;
    if (currentFingerprints.has(key)) {
      continue; // Still present, not bypassed or disappeared
    }

    // The finding disappeared! Now examine whether it was truly fixed or bypassed
    const cleanPrevPath = prevF.file_path
      .replace(/^.*\/samples\/[^/]+\//, '')
      .replace(/^instructor-portal\/samples\/[^/]+\//, '')
      .replace(/^[/\\]+/, '');
    const filePath = targetDirectory ? resolve(targetDirectory, cleanPrevPath) : resolve(cleanPrevPath);

    if (!existsSync(filePath)) {
      // Rule 3: File deleted
      flags.push({
        id: `flag-${Date.now()}-${flags.length + 1}`,
        kind: 'deleted-file',
        cwe_id: prevF.cwe_id,
        file_path: cleanPrevPath,
        line_number: prevF.line_number,
        title: `Deleted File with Unresolved ${prevF.type}`,
        evidence: {
          explanation: `File was removed from the project instead of remediating the underlying ${prevF.type} (${prevF.cwe_id}). Review architectural intent.`
        },
        reviewed: false
      });
      continue;
    }

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');

      // Check for suppression markers in the file
      const hasAriadneIgnore = lines.some(l => l.includes('ariadne:ignore'));
      if (hasAriadneIgnore) {
        const suppressionLineIdx = lines.findIndex(l => l.includes('ariadne:ignore'));
        const snippet = lines.slice(Math.max(0, suppressionLineIdx - 1), suppressionLineIdx + 3).join('\n');
        flags.push({
          id: `flag-${Date.now()}-${flags.length + 1}`,
          kind: 'suppression',
          cwe_id: prevF.cwe_id,
          file_path: cleanPrevPath,
          line_number: suppressionLineIdx + 1,
          title: `Unauthorized Scanner Suppression Marker`,
          evidence: {
            currentSnippet: snippet,
            explanation: `Found 'ariadne:ignore' directive in ${cleanPrevPath}. Student attempted to silence scanner warnings without fixing vulnerability.`
          },
          reviewed: false
        });
        continue;
      }

      // Check for comment-out around the previous finding's instance
      const queryPattern = prevF.instance_name || 'executeQuery';
      const commentedLine = lines.find(l => {
        const trimmed = l.trim();
        return (trimmed.startsWith('//') || trimmed.startsWith('/*')) && trimmed.includes(queryPattern);
      });

      if (commentedLine) {
        flags.push({
          id: `flag-${Date.now()}-${flags.length + 1}`,
          kind: 'comment-out',
          cwe_id: prevF.cwe_id,
          file_path: cleanPrevPath,
          line_number: prevF.line_number,
          title: `Comment-Out Bypass Detected (${prevF.type})`,
          evidence: {
            previousSnippet: `${prevF.instance_name || 'vulnerable call'}(...);`,
            currentSnippet: commentedLine.trim(),
            explanation: `The previously flagged call to '${queryPattern}' is commented out instead of properly sanitized with parameterized APIs.`
          },
          reviewed: false
        });
      }
    } catch {
      // Ignore file reading errors
    }
  }

  return flags;
}
