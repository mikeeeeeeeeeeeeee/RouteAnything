import { useEffect, useMemo, useRef, useState } from 'react';
import { paper } from '@/data/paper';
import { Desktop, Phone } from '@/site/icons';
import { currentSection, switchView } from './mode';

/** a phone's screen in CSS pixels (an iPhone 15): the phone layout inside the frame lays itself out at this size */
const SCREEN = { w: 390, h: 844 };
const BEZEL = 12;

/**
 * The phone layout as a computer shows it: the page in a phone-sized frame, so that every figure inside lays itself
 * out at a phone's width, exactly as on a phone. A window shorter than the phone scales the phone down as a whole.
 */
export default function PhonePreview() {
  const src = useMemo(() => {
    const u = new URL(location.href);
    u.searchParams.set('view', 'phone');
    u.searchParams.set('frame', '1');
    return u.toString();
  }, []);
  const scale = useFit();
  const frame = useRef<HTMLIFrameElement>(null);
  // back to the desktop page at the section the phone is showing
  const back = () => {
    let at = '';
    try {
      const doc = frame.current?.contentDocument;
      if (doc) at = currentSection(doc);
    } catch {
      /* a frame we cannot read */
    }
    switchView('desktop', at);
  };
  const address = `${location.host}${location.pathname}`.replace(/\/$/, '');
  const outer = { w: SCREEN.w + 2 * BEZEL, h: SCREEN.h + 2 * BEZEL };

  return (
    <div className="preview">
      <aside className="preview-side">
        <p className="eyebrow">The phone layout</p>
        <h1>{paper.title}, on a phone.</h1>
        <p className="lede">The same figures, laid out for one column. Cards that sit side by side become a row to swipe. A phone opens this layout by itself.</p>
        <button type="button" className="cta" onClick={back}>
          <Desktop />
          Back to the desktop layout
        </button>
        <p className="preview-addr">
          <Phone />
          Or open <b>{address}</b> on your phone.
        </p>
      </aside>
      <div className="preview-stage">
        <button type="button" className="preview-back" onClick={back}>
          <Desktop />
          Back to the desktop layout
        </button>
        <div style={{ width: outer.w * scale, height: outer.h * scale }}>
          <div className="preview-phone" style={{ width: outer.w, height: outer.h, padding: BEZEL, transform: `scale(${scale})` }}>
            <iframe ref={frame} src={src} title={`${paper.title}, the phone layout`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** how much the phone has to shrink to fit the window's height (never grown past its size) */
function useFit() {
  const fit = () => Math.min(1, (window.innerHeight - 48) / (SCREEN.h + 2 * BEZEL));
  const [s, setS] = useState(fit);
  useEffect(() => {
    const on = () => setS(fit());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return Math.max(0.55, s);
}
