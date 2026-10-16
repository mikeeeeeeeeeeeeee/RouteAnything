import { useCallback, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { motion } from 'motion/react';
import { Slider } from '@/components/ui/Slider';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';

// Fig. 1c of the paper, live. Axes are normalised: x = S / c̄ (share of the reference's cost
// saved), y = Q / v̄ (quality change as a share of the reference's value). Then
//   eta / eta_B = (1 + y) / (1 - x),
// so every iso-efficiency line passes through (1, -1), and eta > eta_B  <=>  y > -x.

const VW = 620;
const VH = 470;
const PL = 58;
const PR = 600;
const PT = 26;
const PB = 420;
const XMIN = -0.5;
const XMAX = 1;
const YMIN = -1;
const YMAX = 0.5;
const X = (x: number) => PL + ((x - XMIN) / (XMAX - XMIN)) * (PR - PL);
const Y = (y: number) => PT + ((YMAX - y) / (YMAX - YMIN)) * (PB - PT);
const invX = (px: number) => XMIN + ((px - PL) / (PR - PL)) * (XMAX - XMIN);
const invY = (py: number) => YMAX - ((py - PT) / (PB - PT)) * (YMAX - YMIN);

const PRESETS = [
  { key: 'ratio', label: 'The paper’s trap', x: 0.9, y: -0.85, note: 'Accept every output of a primary that is right on 15% of tasks, at a tenth of the cost.' },
  { key: 'cheap', label: 'Cheaper, same quality', x: 0.6, y: 0, note: 'Saves 60% of the reference’s cost and keeps its quality.' },
  { key: 'better', label: 'Better, but dearer', x: -0.3, y: 0.18, note: 'Gains quality but spends 30% more: efficiency falls.' },
] as const;

const FAN = [0.25, 0.5, 2, 4, 10];

export function QSPlane() {
  const tk = useTokens();
  const svgRef = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState<{ x: number; y: number }>({ x: 0.9, y: -0.85 });
  const [eps, setEps] = useState(10); // percent of v̄
  const [drag, setDrag] = useState(false);
  const [note, setNote] = useState<string>(PRESETS[0].note);

  const e = eps / 100;
  const ratio = (1 + pt.y) / (1 - pt.x);
  const gains = pt.y + pt.x > 1e-9;
  const floorOk = pt.y >= -e - 1e-9;
  const verdict = gains && floorOk ? 'admissible' : !floorOk ? 'floor' : 'loss';

  const move = useCallback((ev: RPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * VW;
    const py = ((ev.clientY - r.top) / r.height) * VH;
    const x = Math.min(0.97, Math.max(XMIN, invX(px)));
    const y = Math.min(YMAX, Math.max(YMIN + 0.02, invY(py)));
    setPt({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    setNote('');
  }, []);

  // region polygons (clipped to the plot)
  const yF = -e;
  const admissible = [
    [X(XMIN), Y(YMAX)],
    [X(XMAX), Y(YMAX)],
    [X(XMAX), Y(Math.max(yF, -XMAX))],
    ...(yF > -XMAX ? [[X(-yF), Y(yF)]] : []),
    [X(Math.max(XMIN, -YMAX)), Y(Math.min(YMAX, -XMIN))],
  ];
  // efficiency-loss region above the floor: y < -x and y >= yF
  const loss = [
    [X(XMIN), Y(Math.min(YMAX, -XMIN))],
    [X(-Math.min(YMAX, -XMIN)), Y(Math.min(YMAX, -XMIN))],
    [X(-yF), Y(yF)],
    [X(XMIN), Y(yF)],
  ];

  const statusColor = verdict === 'admissible' ? 'var(--teal)' : verdict === 'floor' ? 'var(--coral)' : 'var(--ink-3)';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className={`h-auto w-full touch-none select-none overflow-visible ${drag ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          role="img"
          aria-label={`Quality change against resource saving. The candidate router sits at saving ${pt.x}, quality change ${pt.y}; its efficiency is ${ratio.toFixed(2)} times the reference.`}
          onPointerDown={(ev) => {
            (ev.target as Element).setPointerCapture?.(ev.pointerId);
            setDrag(true);
            move(ev);
          }}
          onPointerMove={(ev) => drag && move(ev)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
        >
          <defs>
            <pattern id="qs-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="var(--coral)" strokeWidth="1.2" strokeOpacity="0.45" />
            </pattern>
            <clipPath id="qs-clip">
              <rect x={PL} y={PT} width={PR - PL} height={PB - PT} />
            </clipPath>
          </defs>

          <g clipPath="url(#qs-clip)">
            {/* regions */}
            <motion.polygon points={admissible.map((p) => p.join(',')).join(' ')} fill="var(--teal-wash)" animate={{ opacity: 1 }} />
            <polygon points={loss.map((p) => p.join(',')).join(' ')} fill="var(--surface-2)" />
            <rect x={PL} y={Y(yF)} width={PR - PL} height={PB - Y(yF)} fill="var(--coral-wash)" />
            <rect x={PL} y={Y(yF)} width={PR - PL} height={PB - Y(yF)} fill="url(#qs-hatch)" />

            {/* iso-efficiency fan through (1, -1) */}
            {FAN.map((r) => {
              const x0 = XMIN;
              const y0 = r * (1 - x0) - 1;
              return <line key={r} x1={X(x0)} y1={Y(y0)} x2={X(1)} y2={Y(-1)} stroke="var(--ink-3)" strokeWidth={0.8} strokeDasharray="2 5" opacity={0.7} />;
            })}
            {/* eta = eta_B */}
            <line x1={X(XMIN)} y1={Y(-XMIN)} x2={X(1)} y2={Y(-1)} stroke="var(--ink)" strokeWidth={1.6} />
            {/* floor */}
            <line x1={PL} y1={Y(yF)} x2={PR} y2={Y(yF)} stroke="var(--coral)" strokeWidth={1.8} strokeDasharray="7 5" />
          </g>

          {/* fan labels: where each line leaves the plot (top edge, else left edge) */}
          {FAN.map((r) => {
            const xTop = 1 - (1 + YMAX) / r;
            const one = r === 1;
            if (xTop >= XMIN + 0.05) {
              return (
                <text key={r} x={X(xTop)} y={PT - 7} textAnchor="middle" fontSize={10.5} fontWeight={one ? 700 : 400} fill={one ? 'var(--ink)' : 'var(--ink-3)'} style={{ fontFamily: 'var(--font-mono)' }}>
                  {r}×
                </text>
              );
            }
            const yLeft = r * (1 - XMIN) - 1;
            return (
              <text key={r} x={PL - 8} y={Y(yLeft) + 4} textAnchor="end" fontSize={10.5} fontWeight={one ? 700 : 400} fill={one ? 'var(--ink)' : 'var(--ink-3)'} style={{ fontFamily: 'var(--font-mono)' }}>
                {r}×
              </text>
            );
          })}

          {/* axes */}
          <line x1={X(0)} y1={PT} x2={X(0)} y2={PB} stroke="var(--ink-4)" strokeWidth={1} />
          <line x1={PL} y1={Y(0)} x2={PR} y2={Y(0)} stroke="var(--ink-4)" strokeWidth={1} />
          <rect x={PL} y={PT} width={PR - PL} height={PB - PT} fill="none" stroke="var(--rule-2)" />
          {[-0.5, 0, 0.5, 1].map((v) => (
            <text key={v} x={X(v)} y={PB + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
              {v > 0 ? `+${v}` : v}
            </text>
          ))}
          {[-1, 0, 0.5].map((v) => (
            <text key={v} x={PL - 8} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
              {v > 0 ? `+${v}` : v}
            </text>
          ))}
          <foreignObject x={PR - 160} y={PB + 24} width={160} height={26}>
            <div className="text-right text-[14px] text-ink-2" dangerouslySetInnerHTML={{ __html: tex('\\text{saving } \\mathcal S/\\bar c \\;\\to') }} />
          </foreignObject>
          <foreignObject x={PL - 4} y={PT - 30} width={200} height={24}>
            <div className="text-[14px] text-ink-2" dangerouslySetInnerHTML={{ __html: tex('\\uparrow\\ \\text{quality } Q/\\bar v') }} />
          </foreignObject>

          {/* region names */}
          <text x={X(0.62)} y={Y(0.33)} textAnchor="middle" fontSize={13} fill="var(--teal)" fontWeight={650} style={{ fontFamily: 'var(--font-sans)' }}>
            Admissible gain
          </text>
          <text x={X((-1 - yF) / 3)} y={Y((0.5 + 2 * yF) / 3) + 4} textAnchor="middle" fontSize={12.5} fill="var(--ink-3)" fontWeight={600} style={{ fontFamily: 'var(--font-sans)' }}>
            Efficiency loss
          </text>
          <text x={X(-0.3)} y={Math.min(PB - 12, Y(yF) + 24)} textAnchor="middle" fontSize={12.5} fill="var(--coral)" fontWeight={650} style={{ fontFamily: 'var(--font-sans)' }}>
            Below the floor
          </text>
          <foreignObject x={PR - 128} y={Y(yF) - 26} width={124} height={24}>
            <div className="text-right text-[13px] text-coral" dangerouslySetInnerHTML={{ __html: tex('Q = -\\epsilon') }} />
          </foreignObject>
          <g transform={`translate(${X(0.5)},${Y(-0.5)}) rotate(${(Math.atan2(PB - PT, PR - PL) * 180) / Math.PI})`}>
            <foreignObject x={-150} y={-25} width={140} height={22}>
              <div className="text-right text-[12.5px] text-ink" dangerouslySetInnerHTML={{ __html: tex('Q+\\eta_B\\mathcal S=0') }} />
            </foreignObject>
          </g>

          {/* reference */}
          <circle cx={X(0)} cy={Y(0)} r={7} fill="var(--surface)" stroke="var(--amber)" strokeWidth={2.2} />
          <text x={X(0) + 11} y={Y(0) - 9} textAnchor="start" fontSize={12} fill="var(--amber)" fontWeight={650} style={{ fontFamily: 'var(--font-sans)' }}>
            reference B
          </text>

          {/* guide lines from the candidate */}
          <line x1={X(pt.x)} y1={Y(pt.y)} x2={X(pt.x)} y2={Y(0)} stroke={statusColor} strokeWidth={1} strokeDasharray="3 3" />
          <line x1={X(pt.x)} y1={Y(pt.y)} x2={X(0)} y2={Y(pt.y)} stroke={statusColor} strokeWidth={1} strokeDasharray="3 3" />
          {/* candidate's own iso-efficiency line */}
          <line x1={X(pt.x)} y1={Y(pt.y)} x2={X(1)} y2={Y(-1)} stroke={statusColor} strokeWidth={1.2} opacity={0.5} />

          <motion.g animate={{ x: X(pt.x), y: Y(pt.y) }} transition={drag ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26 }}>
            <circle r={18} fill={statusColor} opacity={0.14} />
            <circle r={8} fill={statusColor} stroke="var(--surface)" strokeWidth={2.5} />
          </motion.g>
          <circle cx={X(1)} cy={Y(-1)} r={3} fill="var(--ink-3)" />
          <text x={X(1) - 6} y={Y(-1) - 8} textAnchor="end" fontSize={10} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
            V = D = 0
          </text>
        </svg>
        <p className="smallcaps mt-1 text-center text-[10px] text-ink-3">Drag the point · iso-efficiency lines all meet where nothing is delivered and nothing is spent</p>
      </div>

      {/* read-out */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-rule bg-surface p-4">
          <div className="smallcaps text-[10px] text-ink-3">efficiency vs the reference</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-[54px] font-semibold leading-none tabular-nums text-ink">{ratio >= 100 ? '≫99' : ratio.toFixed(2)}</span>
            <span className="font-display text-[28px] text-ink-3">×</span>
          </div>
          <div className="mt-3 text-[15px] text-ink-2" dangerouslySetInnerHTML={{ __html: tex(`\\dfrac{\\eta}{\\eta_B}=\\dfrac{1+Q/\\bar v}{1-\\mathcal S/\\bar c}=\\dfrac{${(1 + pt.y).toFixed(2)}}{${(1 - pt.x).toFixed(2)}}`) }} />
        </div>
        <div className="rounded-2xl border border-rule bg-surface p-4 text-[14px]">
          <Check ok={gains} label={tex('Q+\\eta_B\\mathcal S>0')} hint="more efficient than B" />
          <div className="my-2 border-t border-dashed border-rule" />
          <Check ok={floorOk} label={tex('Q\\ge-\\epsilon')} hint="meets the quality floor" />
          <div
            className="mt-3 rounded-xl px-3 py-2 text-center font-sans text-[13px] font-semibold"
            style={{ background: `color-mix(in oklab, ${statusColor} 14%, transparent)`, color: statusColor }}
          >
            {verdict === 'admissible' ? 'Admissible gain' : verdict === 'floor' ? (gains ? 'More efficient, but below the floor' : 'Below the floor') : 'Efficiency loss'}
          </div>
        </div>
        <div className="rounded-2xl border border-rule bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <span className="smallcaps text-[10px] text-ink-3">tolerance</span>
            <span className="text-[14px] text-ink" dangerouslySetInnerHTML={{ __html: tex(`\\epsilon = ${(e).toFixed(2)}\\,\\bar v`) }} />
          </div>
          <Slider value={eps} onChange={setEps} max={40} color={tk.coral} left="0" right="0.4" ariaLabel="Tolerance epsilon" className="mt-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPt({ x: p.x, y: p.y });
                setNote(p.note);
              }}
              className="rounded-full border border-rule bg-surface px-3 py-1.5 font-sans text-[12.5px] text-ink-2 transition-colors hover:border-blue hover:text-blue"
            >
              {p.label}
            </button>
          ))}
        </div>
        {note && <p className="font-serif text-[14px] italic leading-snug text-ink-3">{note}</p>}
      </div>
    </div>
  );
}

function Check({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-bold ${ok ? 'bg-teal-wash text-teal' : 'bg-coral-wash text-coral'}`}
        aria-label={ok ? 'holds' : 'fails'}
      >
        {ok ? '✓' : '✗'}
      </span>
      <span className="text-ink" dangerouslySetInnerHTML={{ __html: label }} />
      <span className="ml-auto text-right font-sans text-[12px] leading-tight text-ink-3">{hint}</span>
    </div>
  );
}
