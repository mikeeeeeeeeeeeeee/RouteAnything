/**
 * Which layout the page shows: the phone layout (src/phone) or the desktop page (src/App).
 *   ?view=phone / ?view=desktop   choose one and remember it
 *   a remembered choice           wins over the device
 *   otherwise                     a phone gets the phone layout: a phone's browser (by its user agent, so a phone
 *                                 held sideways still counts), or any window narrower than 640 px
 * Both layouts carry a switch to the other one; switching keeps the section being read. A computer that chooses the
 * phone layout sees it in a phone-sized frame (PhonePreview): inside the frame the page has a phone's width, so every
 * figure lays itself out exactly as on a phone.
 */
export type View = 'phone' | 'desktop';

const KEY = 'ra-view';
const SWITCHED = 'ra-view-switched';

/** the sections both layouts share, in page order */
export const SECTIONS = ['top', 'how', 'gain', 'recover', 'pay', 'cite'] as const;

/** a phone's browser, by what it says it is */
export function isPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return !!nav.userAgentData?.mobile || /iPhone|iPod|Android.+Mobile|Windows Phone|IEMobile|Opera Mini/i.test(nav.userAgent);
}

export function isPhone(): boolean {
  return isPhoneDevice() || (typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
}

/** this page is the phone layout inside PhonePreview's frame */
export const inFrame = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('frame') === '1';

/** the phone layout chosen on a screen wider than a phone (not a phone held sideways): show it in a phone's frame */
export const wantsPreview = (v: View) => v === 'phone' && !inFrame() && !isPhoneDevice() && window.innerWidth >= 640;

function saved(): View | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'phone' || v === 'desktop' ? v : null;
  } catch {
    return null;
  }
}

export function chooseView(): View {
  try {
    const q = new URLSearchParams(location.search).get('view');
    if (q === 'phone' || q === 'desktop') {
      // the preview's frame asks for the phone layout without making it the visitor's choice
      if (!inFrame()) localStorage.setItem(KEY, q);
      return q;
    }
  } catch {
    /* private mode */
  }
  return saved() ?? (isPhone() ? 'phone' : 'desktop');
}

/** the section under the top bar, if any */
export function currentSection(doc: Document = document, line = 120): string {
  let id = '';
  for (const s of SECTIONS) {
    const el = doc.getElementById(s);
    if (el && el.getBoundingClientRect().top <= line) id = s;
  }
  return id;
}

/**
 * Remember the choice and reload into the other layout at the same section. The page fades out first, so the
 * switch reads as one movement rather than a reload.
 */
export function switchView(v: View, anchor = currentSection()) {
  try {
    localStorage.setItem(KEY, v);
    sessionStorage.setItem(SWITCHED, '1');
  } catch {
    /* private mode */
  }
  // from inside the preview's frame, the whole window switches, not the frame
  let w: Window = window;
  try {
    if (window.top && window.top !== window && window.top.document) w = window.top;
  } catch {
    /* a frame of another origin (a page opened from disk): switch the frame */
  }
  const u = new URL(w.location.href);
  u.searchParams.delete('view');
  u.searchParams.delete('frame');
  u.hash = anchor && anchor !== 'top' ? `#${anchor}` : '';
  const veil = w.document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:var(--page,#fff);opacity:0;transition:opacity .22s ease;pointer-events:none';
  w.document.body.appendChild(veil);
  w.requestAnimationFrame(() => (veil.style.opacity = '1'));
  window.setTimeout(() => {
    w.history.scrollRestoration = 'manual';
    w.history.replaceState(null, '', u.toString());
    w.location.reload();
  }, 230);
}

/** after a switch: start from the top (or the section's anchor), not from the old layout's scroll position */
export function settleAfterSwitch() {
  try {
    if (sessionStorage.getItem(SWITCHED) !== '1') return;
    sessionStorage.removeItem(SWITCHED);
  } catch {
    return;
  }
  history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  window.setTimeout(() => (history.scrollRestoration = 'auto'), 2500);
}
