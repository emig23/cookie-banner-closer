import { detect } from '@/src/detector';
import type { Detection } from '@/src/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log(`[Cookie Banner Closer] Loaded on ${location.hostname}`);

    // temporary, phase 2 replaces this with a MutationObserver
    logDetection('initial check');
    setTimeout(() => logDetection('after 3 seconds'), 3000);
  },
});

function logDetection(when: string): void {
  const result = detect();
  if (!result) {
    console.log(`[Cookie Banner Closer] No banner found (${when})`);
    return;
  }
  console.log(
    `[Cookie Banner Closer] Banner found (${when}): ${describe(result)}`,
    result,
  );
}

function describe(result: Detection): string {
  const source =
    result.source === 'cmp' ? result.cmpName : 'unknown platform (text match)';
  const reject = result.rejectButton ? 'found' : 'none';
  const necessary = result.necessaryButton ? 'found' : 'none';
  return `${source} | reject button: ${reject} | necessary-only button: ${necessary}`;
}
