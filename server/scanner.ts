import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Finding } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCAL_BIN = resolve(__dirname, '../bin/linux-x64/ariadne');
const EXT_BIN = resolve(__dirname, '../../ariadne-extension-vscode/bin/linux-x64/ariadne');
export const BINARY_PATH = existsSync(LOCAL_BIN) ? LOCAL_BIN : EXT_BIN;

export async function runAriadneScan(targetPath: string): Promise<Finding[]> {
  const absoluteTarget = resolve(targetPath);

  if (!existsSync(BINARY_PATH)) {
    throw new Error(`Ariadne binary not found at ${BINARY_PATH}`);
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(BINARY_PATH, ['scan', absoluteTarget], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('close', code => {
      if (code !== 0 && code !== 1) { // 0: no vulns, 1: vulns found or standard exit
        // If binary wrote output, attempt to parse JSON despite exit code
        const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]|\[\s*\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return resolvePromise(parsed);
          } catch {
            // pass
          }
        }
        return rejectPromise(new Error(`Ariadne scan exited with code ${code}: ${stderr || stdout}`));
      }

      // Scanner output may contain "[Ariadne] scanning..." before JSON.
      // Extract the JSON array from stdout.
      const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]|\[\s*\]/);
      if (!jsonMatch) {
        // Empty findings
        return resolvePromise([]);
      }

      try {
        const rawFindings: Finding[] = JSON.parse(jsonMatch[0]);
        // Normalize file_path to be clean repo-relative path (e.g. src/main/java/...)
        const normalized: Finding[] = rawFindings.map(f => {
          let p = (f.file_path || '').trim();
          if (p.startsWith(absoluteTarget)) {
            p = p.substring(absoluteTarget.length).replace(/^[/\\]+/, '');
          }
          // Also strip any leading path fragments
          p = p.replace(/^instructor-portal\/samples\/[^/]+\//, '');
          p = p.replace(/^.*\/samples\/[^/]+\//, '');
          return {
            ...f,
            file_path: p
          };
        });
        resolvePromise(normalized);
      } catch (err) {
        rejectPromise(new Error(`Failed to parse scanner JSON: ${(err as Error).message}\nRaw output:\n${stdout}`));
      }
    });

    child.on('error', err => {
      rejectPromise(err);
    });
  });
}
