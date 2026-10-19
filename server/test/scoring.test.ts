import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeSubmissionScore } from '../scoring.ts';
import type { Finding, GuardrailPack, IntegrityFlag } from '../types.ts';
import { runIntegrityAudit } from '../integrity.ts';

describe('Ariadne Instructor Portal — Scoring Engine & Guardrails', () => {
  const basePack: GuardrailPack = {
    id: 'pack-test',
    name: 'Test Pack',
    yearLevel: '3rd Year',
    description: 'Unit test guardrail pack',
    policies: {
      zeroCritical: true,
      blockMergeOnHigh: true
    },
    rules: {
      'taint.sql.execute': true,
      'pattern.hardcoded.assignment': true,
      'taint.path.fileApi': true
    }
  };

  it('awards 100/100 and passes policy when zero findings and zero flags exist', () => {
    const result = computeSubmissionScore([], [], basePack);
    assert.equal(result.score, 100);
    assert.equal(result.passedPolicy, true);
    assert.equal(result.policyViolations.length, 0);
  });

  it('deducts 25 for Critical, 15 for High, and fails Zero Critical policy', () => {
    const findings: Finding[] = [
      {
        type: 'SQL Injection',
        cwe_id: 'CWE-89',
        owasp_category: 'A03:2021',
        severity: 'critical',
        file_path: 'LoginController.java',
        line_number: 25,
        rule_id: 'taint.sql.execute',
        description: 'SQLi'
      },
      {
        type: 'Hardcoded Credentials',
        cwe_id: 'CWE-798',
        owasp_category: 'A07:2021',
        severity: 'high',
        file_path: 'DatabaseConfig.java',
        line_number: 7,
        rule_id: 'pattern.hardcoded.assignment',
        description: 'Secret'
      }
    ];

    const result = computeSubmissionScore(findings, [], basePack);
    // 100 - 25 - 15 = 60
    assert.equal(result.score, 60);
    assert.equal(result.passedPolicy, false);
    assert.ok(result.policyViolations.some(v => v.includes('Zero Critical')));
  });

  it('deducts 10 points per Academic Integrity flag', () => {
    const flags: IntegrityFlag[] = [
      {
        id: 'f1',
        kind: 'comment-out',
        cwe_id: 'CWE-89',
        file_path: 'LoginController.java',
        line_number: 25,
        title: 'Comment-out bypass',
        evidence: { explanation: 'Masked query in comments' },
        reviewed: false
      }
    ];

    const result = computeSubmissionScore([], flags, basePack);
    // 100 - 10 = 90
    assert.equal(result.score, 90);
    assert.equal(result.passedPolicy, false); // Integrity flag triggers policy violation
  });

  it('ignores finding when the guardrail rule is toggled off', () => {
    const disabledPack: GuardrailPack = {
      ...basePack,
      rules: {
        'taint.sql.execute': false, // DISABLED
        'pattern.hardcoded.assignment': true
      }
    };

    const findings: Finding[] = [
      {
        type: 'SQL Injection',
        cwe_id: 'CWE-89',
        owasp_category: 'A03:2021',
        severity: 'critical',
        file_path: 'LoginController.java',
        line_number: 25,
        rule_id: 'taint.sql.execute',
        description: 'SQLi'
      }
    ];

    const result = computeSubmissionScore(findings, [], disabledPack);
    // Rule is disabled, so SQLi is ignored
    assert.equal(result.score, 100);
    assert.equal(result.ignoredFindings.length, 1);
    assert.equal(result.activeFindings.length, 0);
    assert.equal(result.passedPolicy, true);
  });

  it('clamps score at zero when cumulative penalties exceed 100', () => {
    const findings: Finding[] = Array(5).fill({
      type: 'SQL Injection',
      cwe_id: 'CWE-89',
      owasp_category: 'A03:2021',
      severity: 'critical', // 25 * 5 = 125
      file_path: 'Test.java',
      line_number: 10,
      rule_id: 'taint.sql.execute',
      description: 'SQLi'
    });

    const result = computeSubmissionScore(findings, [], basePack);
    assert.equal(result.score, 0);
  });
});
