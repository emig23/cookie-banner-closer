import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fixturesDir = join(import.meta.dirname, 'fixtures');

// jsdom can't replace the whole document, so copy head and body
export function loadFixture(name: string): void {
  const html = readFileSync(join(fixturesDir, name), 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
}

export function resetDocument(): void {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
}
