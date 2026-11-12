#!/usr/bin/env node
/**
 * Generates TypeScript types from the API's OpenAPI document (`/openapi/v1.json`) with openapi-typescript,
 * fetched through `pnpm dlx` so no dependency is added to package.json.
 *
 * The output is a reference for the response and request shapes the assemblers map. Nothing in the app
 * imports it, so it cannot change runtime behaviour; mappers stay hand-written and tolerant of additive
 * fields. The output folder is git-ignored.
 *
 * Inputs:
 *   OPENAPI_SOURCE  a URL or a local file with the OpenAPI document
 *   API_ORIGIN      used when OPENAPI_SOURCE is unset; defaults to http://localhost:8080
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/app/shared/infrastructure/api/generated/openapi.ts');

const explicit = process.env.OPENAPI_SOURCE?.trim() ?? '';
const origin = (process.env.API_ORIGIN?.trim() || 'http://localhost:8080').replace(/\/+$/, '');
const source = explicit === '' ? `${origin}/openapi/v1.json` : explicit;

mkdirSync(dirname(target), { recursive: true });
console.log(`[api-types] ${source} -> ${target}`);

const result = spawnSync('pnpm', ['dlx', 'openapi-typescript@7', source, '-o', target], {
  stdio: 'inherit',
  shell: true,
});
if (result.error) {
  console.error(`[api-types] could not start pnpm: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`[api-types] generation failed (exit ${result.status}). Is the API running at ${origin}?`);
  process.exit(result.status ?? 1);
}
