import { afterEach, describe, expect, it } from 'vitest';

import { detect } from '../../src/detector';
import { loadFixture, resetDocument } from '../helpers';

afterEach(resetDocument);

describe('known consent platforms', () => {
  it.each([
    ['onetrust.html', 'onetrust', 'onetrust-reject-all-handler'],
    ['cookiebot.html', 'cookiebot', 'CybotCookiebotDialogBodyButtonDecline'],
    ['didomi.html', 'didomi', 'didomi-notice-disagree-button'],
    ['quantcast.html', 'quantcast', 'disagree-btn'],
    ['trustarc.html', 'trustarc', 'truste-consent-required'],
  ])('%s is detected with its reject button', (fixture, cmpId, rejectId) => {
    loadFixture(fixture);
    const result = detect();

    expect(result).not.toBeNull();
    expect(result!.source).toBe('cmp');
    expect(result!.cmpId).toBe(cmpId);
    expect(result!.rejectButton?.id).toBe(rejectId);
  });

  it('detects Usercentrics inside a shadow root', () => {
    document.body.innerHTML = '<div id="usercentrics-root"></div>';
    const shadow = document
      .getElementById('usercentrics-root')!
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <div data-testid="uc-container">
        <p>We use cookies.</p>
        <button data-testid="uc-deny-all-button">Deny</button>
        <button data-testid="uc-accept-all-button">Accept All</button>
      </div>`;

    const result = detect();

    expect(result?.cmpId).toBe('usercentrics');
    expect(result?.rejectButton?.dataset.testid).toBe('uc-deny-all-button');
  });

  it('ignores a banner that is hidden after the user already chose', () => {
    loadFixture('onetrust-dismissed.html');
    expect(detect()).toBeNull();
  });

  it('skips a disabled reject button', () => {
    loadFixture('quantcast.html');
    (document.getElementById('disagree-btn') as HTMLButtonElement).disabled =
      true;

    const result = detect();

    expect(result?.cmpId).toBe('quantcast');
    expect(result?.rejectButton).toBeNull();
  });

  it('uses the next selector when the first reject button is hidden', () => {
    loadFixture('onetrust.html');
    document.getElementById('onetrust-reject-all-handler')!.style.display =
      'none';
    document
      .getElementById('onetrust-banner-sdk')!
      .insertAdjacentHTML(
        'beforeend',
        '<button class="ot-pc-refuse-all-handler">Reject All</button>',
      );

    const result = detect();

    expect(result?.rejectButton?.className).toBe('ot-pc-refuse-all-handler');
  });

  it('never returns a "consent or pay" button', () => {
    loadFixture('didomi-paywall.html');
    const result = detect();

    expect(result?.cmpId).toBe('didomi');
    expect(result?.rejectButton).toBeNull();
  });
});

describe('text fallback', () => {
  it('finds a reject button in a fixed cookie banner', () => {
    loadFixture('generic-reject.html');
    const result = detect();

    expect(result?.source).toBe('heuristic');
    expect(result?.cmpId).toBeNull();
    expect(result?.rejectButton?.textContent).toBe('Reject all');
    expect(result?.banner.classList.contains('banner')).toBe(true);
  });

  it('finds a necessary-only button when there is no reject button', () => {
    loadFixture('generic-necessary.html');
    const result = detect();

    expect(result?.rejectButton).toBeNull();
    expect(result?.necessaryButton?.textContent).toBe('Only necessary');
  });

  it('finds a banner that is named like a cookie notice', () => {
    loadFixture('generic-named.html');
    const result = detect();

    expect(result?.banner.className).toBe('site-cookie-notice');
    expect((result?.rejectButton as HTMLInputElement).value).toBe('Decline');
  });

  it('prefers a known platform over the text fallback', () => {
    loadFixture('onetrust.html');
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div style="position: fixed">Cookies! <button>Reject all</button></div>',
    );
    expect(detect()?.source).toBe('cmp');
  });
});

describe('false positives', () => {
  it('ignores "Decline" and "No thanks" outside cookie banners', () => {
    loadFixture('no-banner.html');
    expect(detect()).toBeNull();
  });

  it('returns nothing for a banner with no reject or necessary button', () => {
    loadFixture('accept-only.html');
    expect(detect()).toBeNull();
  });

  it('ignores long text that only contains a reject phrase', () => {
    document.body.innerHTML = `
      <div style="position: fixed">
        <p>We use cookies.</p>
        <a href="/policy">Learn how to reject all cookies in your browser settings</a>
      </div>`;
    expect(detect()).toBeNull();
  });

  it('returns nothing on an empty page', () => {
    expect(detect()).toBeNull();
  });
});
