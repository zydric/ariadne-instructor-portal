import type { Assignment, ComputedScore, Section, Student, Submission } from './types.ts';

export interface ExportRow {
  student: Student;
  section: Section;
  submission: Submission | null;
  score: ComputedScore;
}

export function generateCanvasCsv(assignment: Assignment, rows: ExportRow[]): string {
  const header = `Student,ID,SIS User ID,SIS Login ID,Section,${assignment.title} (Points)`;
  const pointsRow = `    Points Possible,,,,,100.00`;

  const dataRows = rows.map(r => {
    const nameFormatted = `"${r.student.name}"`;
    const sisId = r.student.studentNo;
    const loginId = r.student.githubUser;
    const sectionName = `"${r.section.name}"`;
    const scoreVal = r.submission ? r.score.score.toFixed(2) : '0.00';
    return `${nameFormatted},${r.student.id},${sisId},${loginId},${sectionName},${scoreVal}`;
  });

  return [header, pointsRow, ...dataRows].join('\n');
}

export function generateMoodleCsv(assignment: Assignment, rows: ExportRow[]): string {
  const header = `First name,Surname,ID number,Institution,Department,Email address,${assignment.title} (Real)`;

  const dataRows = rows.map(r => {
    const parts = r.student.name.split(' ');
    const firstName = parts.slice(0, -1).join(' ') || parts[0];
    const lastName = parts.slice(-1)[0] || '';
    const email = `${r.student.githubUser}@student.cit.edu`;
    const scoreVal = r.submission ? r.score.score.toFixed(2) : '0.00';
    return `"${firstName}","${lastName}","${r.student.studentNo}","CIT-University","CCS","${email}",${scoreVal}`;
  });

  return [header, ...dataRows].join('\n');
}

export function generateStandardCsv(assignment: Assignment, rows: ExportRow[]): string {
  const header = `Student ID,Name,Section,GitHub Username,Commit SHA,Score,Policy Status,Integrity Flags,Critical Vulns,High Vulns,Medium Vulns,Low Vulns,Scanned At`;

  const dataRows = rows.map(r => {
    const scoreVal = r.submission ? r.score.score : 0;
    const policy = r.score.passedPolicy ? 'PASS' : 'FAIL';
    const flagCount = r.score.flags.length;
    const crit = r.score.activeFindings.filter(f => f.severity === 'critical').length;
    const high = r.score.activeFindings.filter(f => f.severity === 'high').length;
    const med = r.score.activeFindings.filter(f => f.severity === 'medium').length;
    const low = r.score.activeFindings.filter(f => f.severity === 'low').length;
    const sha = r.submission?.commitSha || 'N/A';
    const time = r.submission?.scannedAt || 'No submission';

    return `"${r.student.studentNo}","${r.student.name}","${r.section.name}","${r.student.githubUser}","${sha}",${scoreVal},"${policy}",${flagCount},${crit},${high},${med},${low},"${time}"`;
  });

  return [header, ...dataRows].join('\n');
}
