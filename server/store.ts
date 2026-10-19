import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSchema, GuardrailPack, Student, Submission } from './types.ts';
import { generateSeedData } from './seedGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = resolve(__dirname, '../data');
const SEED_FILE = resolve(DATA_DIR, 'seed.json');
const DB_FILE = resolve(DATA_DIR, 'db.json');

export class JsonStore {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.ensureDataFiles();
  }

  private ensureDataFiles(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!existsSync(SEED_FILE)) {
      const initialSeed = generateSeedData();
      writeFileSync(SEED_FILE, JSON.stringify(initialSeed, null, 2), 'utf-8');
    }

    if (!existsSync(DB_FILE)) {
      const seedContent = readFileSync(SEED_FILE, 'utf-8');
      writeFileSync(DB_FILE, seedContent, 'utf-8');
    }
  }

  public getDb(): DatabaseSchema {
    if (!this.cache) {
      this.ensureDataFiles();
      const raw = readFileSync(DB_FILE, 'utf-8');
      this.cache = JSON.parse(raw);
    }
    return this.cache!;
  }

  public saveDb(data: DatabaseSchema): void {
    this.cache = data;
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public resetToSeed(): DatabaseSchema {
    const seed = generateSeedData();
    writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    this.cache = seed;
    return seed;
  }

  public getCourses() {
    return this.getDb().courses;
  }

  public getSections(courseId?: string) {
    const db = this.getDb();
    return courseId ? db.sections.filter(s => s.courseId === courseId) : db.sections;
  }

  public getStudents(sectionId?: string) {
    const db = this.getDb();
    return sectionId ? db.students.filter(s => s.sectionId === sectionId) : db.students;
  }

  public getStudent(id: string) {
    return this.getDb().students.find(s => s.id === id);
  }

  public getAssignments(courseId?: string) {
    const db = this.getDb();
    return courseId ? db.assignments.filter(a => a.courseId === courseId) : db.assignments;
  }

  public getAssignment(id: string) {
    return this.getDb().assignments.find(a => a.id === id);
  }

  public getGuardrailPacks() {
    return this.getDb().guardrailPacks;
  }

  public getGuardrailPack(id: string) {
    return this.getDb().guardrailPacks.find(p => p.id === id);
  }

  public updateGuardrailPack(id: string, update: Partial<GuardrailPack>): GuardrailPack {
    const db = this.getDb();
    const idx = db.guardrailPacks.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error(`Guardrail pack with ID ${id} not found.`);
    }
    db.guardrailPacks[idx] = {
      ...db.guardrailPacks[idx],
      ...update,
      id: db.guardrailPacks[idx].id
    };
    this.saveDb(db);
    return db.guardrailPacks[idx];
  }

  public updateAssignmentGuardrail(assignmentId: string, packId: string): void {
    const db = this.getDb();
    const asg = db.assignments.find(a => a.id === assignmentId);
    if (!asg) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }
    asg.guardrailPackId = packId;
    this.saveDb(db);
  }

  public getSubmissions(assignmentId?: string, studentId?: string) {
    let list = this.getDb().submissions;
    if (assignmentId) list = list.filter(s => s.assignmentId === assignmentId);
    if (studentId) list = list.filter(s => s.studentId === studentId);
    return list;
  }

  public addSubmission(submission: Submission): void {
    const db = this.getDb();
    db.submissions.push(submission);
    this.saveDb(db);
  }

  public registerStudent(studentData: Omit<Student, 'id'>): Student {
    const db = this.getDb();
    const newStudent: Student = {
      ...studentData,
      id: `stu-${db.students.length + 1}`
    };
    db.students.push(newStudent);
    this.saveDb(db);
    return newStudent;
  }
}

export const store = new JsonStore();
