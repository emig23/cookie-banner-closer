import type { CmpRule } from '../types';

// selectors checked against duckduckgo/autoconsent (MPL-2.0), nov 2026
// sourcepoint and trustarc iframe banners come in phase 2
export const cmpRules: CmpRule[] = [
  {
    id: 'onetrust',
    name: 'OneTrust',
    banner: ['#onetrust-banner-sdk'],
    reject: ['#onetrust-reject-all-handler', '.ot-pc-refuse-all-handler'],
    necessary: [],
  },
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    banner: ['#CybotCookiebotDialog'],
    reject: [
      '#CybotCookiebotDialogBodyButtonDecline',
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
    ],
    necessary: [],
  },
  {
    id: 'didomi',
    name: 'Didomi',
    banner: ['#didomi-notice', '#didomi-popup'],
    reject: [
      '#didomi-notice-disagree-button',
      '.didomi-continue-without-agreeing',
    ],
    necessary: [],
  },
  {
    id: 'quantcast',
    name: 'Quantcast Choice',
    banner: ['#qc-cmp2-ui'],
    reject: ['#disagree-btn'],
    necessary: [],
  },
  {
    id: 'trustarc',
    name: 'TrustArc',
    banner: ['#truste-consent-track'],
    reject: [
      '#truste-consent-required',
      'button[data-button-key="decline_all"]',
      '.trustarc-declineall-btn',
    ],
    necessary: [],
  },
  {
    id: 'usercentrics',
    name: 'Usercentrics',
    // lives inside a shadow root
    banner: ['[data-testid="uc-container"]'],
    reject: ['[data-testid="uc-deny-all-button"]'],
    necessary: [],
  },
];
