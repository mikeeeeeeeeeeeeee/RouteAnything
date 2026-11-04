import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import { paper } from '@/data/paper';
import { trial } from '@/data/trial';
import { COPY } from './copy';
import { Chevron, Close } from './icons';
import { d, StoryHead } from './ui';

// The API trial: a section that says what an applicant gets and how, and one application form in a sheet. The
// form opens from the section, from the bar, and from a link to the page with #apply, so the team can hand that
// link out on its own.

/* ------------------------------------------------------------------ */
/* whether the form is open, shared by every button that opens it      */
/* ------------------------------------------------------------------ */

let isOpen = false;
const subs = new Set<() => void>();
const set = (v: boolean) => {
  isOpen = v;
  subs.forEach((f) => f());
};
const useOpen = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => isOpen
  );

/** open the form; the address gains #apply, so Back (and a phone's back gesture) closes it */
export function openApply() {
  if (isOpen) return;
  history.pushState({ apply: true }, '', '#apply');
  set(true);
}
function closeApply() {
  if (!isOpen) return;
  if (history.state?.apply) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    set(false);
  }
}

/* ------------------------------------------------------------------ */
/* the section                                                         */
/* ------------------------------------------------------------------ */

const STEP_ICONS: ReactNode[] = [
  // a form
  <svg key="0" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="3.5" width="14" height="17" rx="2.6" />
    <path d="M8.6 8.5h6.8M8.6 12h6.8M8.6 15.5h4" />
  </svg>,
  // reviewed
  <svg key="1" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.3 12.2l2.6 2.6 4.9-5.2" />
  </svg>,
  // a key
  <svg key="2" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="8.2" cy="15.8" r="3.9" />
    <path d="M11 13l8-8M16 8l2.6 2.6M14 10l1.8 1.8" />
  </svg>,
];

export function TrySection() {
  const c = COPY.trial;
  return (
    <section id="try" className="sec band">
      <StoryHead eyebrow={c.eyebrow} h={c.h} lede={c.lede} />
      <div className="wrap-mid stage">
        <ol className="steps">
          {c.steps.map((s, i) => (
            <li key={s.h} className="card step rv" style={d(i)}>
              <span className="step-i">{STEP_ICONS[i]}</span>
              <p className="card-k">Step {i + 1}</p>
              <h3>{s.h}</h3>
              <p className="card-note">{s.note}</p>
            </li>
          ))}
        </ol>
        <div className="try-cta rv">
          <button type="button" className="cta big" onClick={openApply}>
            {c.cta}
          </button>
          <p>{c.fine}</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* the form                                                            */
/* ------------------------------------------------------------------ */

const ROLES = ['Student', 'Researcher', 'Engineer', 'Other'] as const;
const VOLUMES = ['Under 1,000 calls', '1,000–10,000', 'Over 10,000'] as const;
const MODALITIES = ['Text', 'Image–text', 'Image generation', 'Video generation', 'Speech generation', 'Code & agents', 'Robots'] as const;

interface Draft {
  name: string;
  email: string;
  affiliation: string;
  role: string;
  link: string;
  use: string;
  modalities: string[];
  volume: string;
  agree: boolean;
  /** a field people never see; bots fill it */
  botcheck: string;
}
const EMPTY: Draft = { name: '', email: '', affiliation: '', role: '', link: '', use: '', modalities: [], volume: '', agree: false, botcheck: '' };
type Errors = Partial<Record<keyof Draft, string>>;

const MIN_USE = 40;

function check(v: Draft): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Enter your name.';
  if (!v.email.trim()) e.email = 'Enter your email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'This email doesn’t look right.';
  if (!v.affiliation.trim()) e.affiliation = 'Enter your university, lab or company.';
  if (!v.role) e.role = 'Choose one.';
  if (v.link.trim() && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/.test(v.link.trim())) e.link = 'Enter a web address, or leave this empty.';
  if (v.use.trim().length < MIN_USE) e.use = `A sentence or two, please (at least ${MIN_USE} characters).`;
  if (!v.volume) e.volume = 'Choose one.';
  if (!v.agree) e.agree = 'Please agree to the trial terms.';
  return e;
}

type Sent = { state: 'idle' } | { state: 'sending' } | { state: 'done'; email: string } | { state: 'failed'; reason: string };

/** the request as the team's email shows it: one readable line per answer, the applicant as reply-to */
function message(v: Draft, page = location.href.split('#')[0]) {
  const given = (x: string) => x || '(not given)';
  return {
    access_key: trial.accessKey,
    subject: `[${paper.title} API] ${v.name.trim()}, ${v.affiliation.trim()}`,
    from_name: `${paper.title} API trial`,
    replyto: v.email.trim(),
    Name: v.name.trim(),
    Email: v.email.trim(),
    Affiliation: v.affiliation.trim(),
    Role: v.role,
    'Homepage, Scholar or GitHub': given(v.link.trim()),
    'What they will route': v.use.trim(),
    Modalities: given(v.modalities.join(', ')),
    'Calls in the first month': v.volume,
    'Trial terms': `Agreed (version of ${trial.termsDate})`,
    'Sent from': page,
  };
}

/** the same request as plain text, for the email fallback */
function plain(v: Draft) {
  const { access_key: _k, subject: _s, from_name: _f, replyto: _r, ...fields } = message(v);
  return [`${paper.title} API request`, '', ...Object.entries(fields).map(([k, x]) => `${k}: ${x}`)].join('\n');
}

const UNREACHABLE = 'our form service can’t be reached from your network';

async function send(v: Draft): Promise<void> {
  if (v.botcheck) return; // a bot filled the hidden field: pretend it worked, send nothing
  // the dev server shows the whole flow without emailing anyone: ?send=1 sends from it for real, ?fail=1 fails
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search);
    if (q.has('fail')) return new Promise((_, no) => setTimeout(() => no(new Error(UNREACHABLE)), 500));
    if (!q.has('send')) return new Promise((r) => setTimeout(r, 700));
  }
  if (!trial.endpoint || !trial.accessKey) throw new Error('the form is not connected yet');
  let r: Response;
  try {
    r = await fetch(trial.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(message(v)) });
  } catch {
    // a blocked or failed connection, or Cloudflare's challenge page, which carries no CORS headers
    throw new Error(UNREACHABLE);
  }
  const data: { success?: boolean; message?: string; body?: { message?: string } } | null = await r.json().catch(() => null);
  if (!r.ok || data?.success === false) {
    const why = data?.message ?? data?.body?.message;
    throw new Error(r.status === 429 ? 'too many requests from this network; wait a few minutes' : why ? why.replace(/[.!]+$/, '') : `the form service answered ${r.status}`);
  }
}

/** When sending fails: the same request by email, answers filled in, or copied to paste anywhere. */
function Fallback({ v, reason }: { v: Draft; reason: string }) {
  const [copied, setCopied] = useState(false);
  const to = trial.fallbackEmail;
  const subject = message(v).subject;
  const text = plain(v);
  const copy = () =>
    navigator.clipboard?.writeText(`To: ${to}\nSubject: ${subject}\n\n${text}`).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  if (!to)
    return (
      <p className="ap-fail" role="alert">
        We couldn’t send your request ({reason}). Please try again in a few minutes.
      </p>
    );
  return (
    <div className="ap-fail" role="alert">
      <p>
        We couldn’t send your request: {reason}. Email it to us instead, at <b>{to}</b>. Your answers are already filled in.
      </p>
      <div className="ap-fail-btns">
        <a className="btn solid" href={`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
          Open in your mail app
        </a>
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy your answers'}
        </button>
      </div>
    </div>
  );
}

/** the terms, folded under the agreement so the form stays short */
function Terms({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const t = COPY.trial.terms;
  return (
    <div className={`terms${open ? ' open' : ''}`}>
      <button type="button" className="terms-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide the trial terms' : 'Read the trial terms'}
        <Chevron />
      </button>
      <div id={id} className="terms-body" hidden={!open}>
        <p className="terms-t">{t.title}</p>
        <dl>
          {t.items.map((it) => (
            <div key={it.k}>
              <dt>{it.k}</dt>
              <dd>{it.t}</dd>
            </div>
          ))}
        </dl>
        <p className="terms-date">{t.date}</p>
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, wide, children }: { id: string; label: ReactNode; hint?: ReactNode; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`f${wide ? ' wide' : ''}${error ? ' bad' : ''}`}>
      <label className="f-l" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="f-e" id={`${id}-e`} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="f-h" id={`${id}-h`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** one of a few choices, as a segmented control */
function Segments({ id, options, value, onChange, error }: { id: string; options: readonly string[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-labelledby={`${id}-l`} aria-invalid={!!error}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function ApplySheet() {
  const open = useOpen();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const [v, setV] = useState<Draft>(EMPTY);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<Sent>({ state: 'idle' });
  const card = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const errors = tried ? check(v) : {};
  const put = <K extends keyof Draft>(k: K, x: Draft[K]) => setV((p) => ({ ...p, [k]: x }));

  // #apply in the address opens the form: a shared link, a link on the page, or Forward after closing it. Behind the
  // form the page waits at the trial section, scrolled again once the charts above it have measured themselves.
  useEffect(() => {
    const timers: number[] = [];
    const arrive = () => {
      const go = () => document.getElementById('try')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      go();
      timers.push(window.setTimeout(go, 450), window.setTimeout(go, 1200));
      set(true);
    };
    const sync = () => {
      if (location.hash === '#apply') {
        if (!isOpen) arrive();
      } else if (isOpen) set(false);
    };
    if (location.hash === '#apply') arrive();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // while open: no page scroll behind, focus inside, Escape closes, Tab stays in the sheet
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    // a mouse starts in the first field; a touch screen starts on Close, so the keyboard doesn't jump up at once
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const t = window.setTimeout(() => card.current?.querySelector<HTMLElement>(touch ? 'button.ap-x' : 'input')?.focus({ preventScroll: true }), 60);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeApply();
      if (e.key !== 'Tab' || !card.current) return;
      const f = [...card.current.querySelectorAll<HTMLElement>('input, textarea, button, a[href]')].filter((x) => !x.hasAttribute('disabled') && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', key);
      root.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // a finished request starts over the next time the form opens
  useEffect(() => {
    if (open || sent.state !== 'done') return;
    const t = window.setTimeout(() => {
      setV(EMPTY);
      setTried(false);
      setSent({ state: 'idle' });
    }, 400);
    return () => window.clearTimeout(t);
  }, [open, sent.state]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    const errs = check(v);
    if (Object.keys(errs).length) {
      const firstBad = Object.keys(errs)[0];
      card.current?.querySelector<HTMLElement>(`[data-f="${firstBad}"]`)?.focus();
      return;
    }
    setSent({ state: 'sending' });
    try {
      await send(v);
      setSent({ state: 'done', email: v.email.trim() });
      card.current?.scrollTo({ top: 0 });
    } catch (err) {
      setSent({ state: 'failed', reason: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  };

  const f = COPY.trial.form;
  const described = (k: keyof Draft, hint?: boolean) => (errors[k] ? `${id(k)}-e` : hint ? `${id(k)}-h` : undefined);

  return (
    <>
      <div className={`ap-veil${open ? ' on' : ''}`} onClick={closeApply} aria-hidden />
      <div className={`ap${open ? ' on' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id('t')} aria-hidden={!open}>
        <div className="ap-card" ref={card}>
          <header className="ap-head">
            <div>
              <p className="ap-k">{f.k}</p>
              <h2 id={id('t')}>{sent.state === 'done' ? f.doneTitle : f.title}</h2>
            </div>
            <button type="button" className="icon-btn ap-x" onClick={closeApply} aria-label="Close the form" tabIndex={open ? 0 : -1}>
              <Close />
            </button>
          </header>

          {sent.state === 'done' ? (
            <div className="ap-done">
              <span className="ap-tick" aria-hidden>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 12.5l3.6 3.6 7.4-8" />
                </svg>
              </span>
              <p className="ap-done-t">
                We will reply to <b>{sent.email}</b> {trial.reply}.
              </p>
              <p className="ap-done-n">{f.doneNote}</p>
              <button type="button" className="btn" onClick={closeApply}>
                Done
              </button>
            </div>
          ) : (
            <form className="ap-form" noValidate onSubmit={submit}>
              <p className="ap-sub">{f.sub}</p>
              <div className="ap-grid">
                <Field id={id('name')} label="Name" error={errors.name}>
                  <input id={id('name')} data-f="name" autoComplete="name" value={v.name} onChange={(e) => put('name', e.target.value)} aria-invalid={!!errors.name} aria-describedby={described('name')} />
                </Field>
                <Field id={id('email')} label="Email" hint={f.emailHint} error={errors.email}>
                  <input
                    id={id('email')}
                    data-f="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={v.email}
                    onChange={(e) => put('email', e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={described('email', true)}
                  />
                </Field>
                <Field id={id('affiliation')} label="Affiliation" error={errors.affiliation}>
                  <input
                    id={id('affiliation')}
                    data-f="affiliation"
                    autoComplete="organization"
                    placeholder="University, lab or company"
                    value={v.affiliation}
                    onChange={(e) => put('affiliation', e.target.value)}
                    aria-invalid={!!errors.affiliation}
                    aria-describedby={described('affiliation')}
                  />
                </Field>
                <Field
                  id={id('link')}
                  label={
                    <>
                      Homepage, Scholar or GitHub <span className="f-opt">optional</span>
                    </>
                  }
                  hint={f.linkHint}
                  error={errors.link}
                >
                  <input
                    id={id('link')}
                    data-f="link"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://"
                    value={v.link}
                    onChange={(e) => put('link', e.target.value)}
                    aria-invalid={!!errors.link}
                    aria-describedby={described('link', true)}
                  />
                </Field>
                <div className={`f wide${errors.role ? ' bad' : ''}`}>
                  <p className="f-l" id={`${id('role')}-l`}>
                    Role
                  </p>
                  <div data-f="role" tabIndex={-1}>
                    <Segments id={id('role')} options={ROLES} value={v.role} onChange={(x) => put('role', x)} error={errors.role} />
                  </div>
                  {errors.role && (
                    <p className="f-e" role="alert">
                      {errors.role}
                    </p>
                  )}
                </div>
                <Field id={id('use')} label="What will you route?" hint={f.useHint} error={errors.use} wide>
                  <textarea
                    id={id('use')}
                    data-f="use"
                    rows={4}
                    placeholder={f.usePlaceholder}
                    value={v.use}
                    onChange={(e) => put('use', e.target.value)}
                    aria-invalid={!!errors.use}
                    aria-describedby={described('use', true)}
                  />
                </Field>
                <div className="f wide">
                  <p className="f-l" id={`${id('mod')}-l`}>
                    Modalities <span className="f-opt">optional</span>
                  </p>
                  <div className="chips" role="group" aria-labelledby={`${id('mod')}-l`}>
                    {MODALITIES.map((m) => {
                      const on = v.modalities.includes(m);
                      return (
                        <button key={m} type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => put('modalities', on ? v.modalities.filter((x) => x !== m) : [...v.modalities, m])}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={`f wide${errors.volume ? ' bad' : ''}`}>
                  <p className="f-l" id={`${id('volume')}-l`}>
                    Calls in the first month
                  </p>
                  <div data-f="volume" tabIndex={-1}>
                    <Segments id={id('volume')} options={VOLUMES} value={v.volume} onChange={(x) => put('volume', x)} error={errors.volume} />
                  </div>
                  {errors.volume && (
                    <p className="f-e" role="alert">
                      {errors.volume}
                    </p>
                  )}
                </div>
                <div className={`f wide${errors.agree ? ' bad' : ''}`}>
                  <Terms id={id('terms')} />
                  <label className="agree">
                    <input type="checkbox" data-f="agree" checked={v.agree} onChange={(e) => put('agree', e.target.checked)} aria-invalid={!!errors.agree} />
                    <span className="box" aria-hidden>
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.5 8.4l2.9 2.9 6-6.4" />
                      </svg>
                    </span>
                    <span>{f.agree}</span>
                  </label>
                  {errors.agree && (
                    <p className="f-e" role="alert">
                      {errors.agree}
                    </p>
                  )}
                </div>
                {/* bots fill every field; people never see this one */}
                <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={v.botcheck} onChange={(e) => put('botcheck', e.target.value)} name="botcheck" />
              </div>
              {sent.state === 'failed' && <Fallback v={v} reason={sent.reason} />}
              <footer className="ap-foot">
                <p>{f.privacy}</p>
                <button type="submit" className="cta" disabled={sent.state === 'sending'}>
                  {sent.state === 'sending' ? 'Sending…' : 'Send request'}
                </button>
              </footer>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
