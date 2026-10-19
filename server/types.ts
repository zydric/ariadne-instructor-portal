export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  type: string;
  cwe_id: string;
  owasp_category: string;
  severity: Severity;
  file_path: string;
  line_number: number;
  column_number?: number;
  rule_id: string;
  description: string;
  instance_name?: string;
  instance_kind?: string;
  enclosing_symbol_path?: string;
  logical_fingerprint?: string;
}

export type IntegrityKind = 'comment-out' | 'suppression' | 'deleted-file';

export interface IntegrityFlag {
  id: string;
  kind: IntegrityKind;
  cwe_id: string;
  file_path: string;
  line_number: number;
  title: string;
  evidence: {
    previousSnippet?: string;
    currentSnippet?: string;
    explanation: string;
  };
  reviewed: boolean;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  commitSha: string;
  commitMessage: string;
  source: 'bot' | 'upload' | 'seed' | 'simulate';
  scannedAt: string;
  findings: Finding[];
  integrityFlags: IntegrityFlag[];
}

export interface GuardrailPolicies {
  zeroCritical: boolean;
  blockMergeOnHigh: boolean;
}

export interface GuardrailPack {
  id: string;
  name: string;
  yearLevel: string;
  description: string;
  isDefault?: boolean;
  policies: GuardrailPolicies;
  rules: Record<string, boolean>; // rule_id -> enabled
}

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  sectionId: string;
  githubUser: string;
  repoUrl: string;
}

export interface Section {
  id: string;
  courseId: string;
  name: string;
  joinCode: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  term: string;
  instructorId: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: string;
  guardrailPackId: string;
}

export interface DatabaseSchema {
  instructor: Instructor;
  courses: Course[];
  sections: Section[];
  students: Student[];
  assignments: Assignment[];
  guardrailPacks: GuardrailPack[];
  submissions: Submission[];
}

export interface ComputedScore {
  score: number; // 0 - 100
  baseScore: number;
  penalties: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    integrity: number;
  };
  passedPolicy: boolean;
  policyViolations: string[];
  activeFindings: Finding[];
  ignoredFindings: Finding[];
  flags: IntegrityFlag[];
}
