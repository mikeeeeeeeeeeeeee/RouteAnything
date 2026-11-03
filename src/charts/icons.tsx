// Line pictograms shared by the routing diagrams: one per output type (the candidate pools) and one per
// kind of input a router reads. Each is drawn centred on (x, y) in a box of about 18 × 18.

export type Pool = 'language' | 'image' | 'video' | 'speech' | 'robot';
export type InputKind = 'question' | 'image-question' | 'task-files' | 'prompt' | 'cameras';

const stroke = (color: string, width = 1.5) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  
});

/** a small line pictogram for each output type, drawn inside a candidate's node */
export function PoolIcon({ pool, x, y, color }: { pool: Pool; x: number; y: number; color: string }) {
  const common = stroke(color);
  return (
    <g transform={`translate(${x} ${y})`}>
      {pool === 'language' && (
        <g {...common}>
          <path d="M-8,-6.5 h16 a2.5,2.5 0 0 1 2.5,2.5 v6.5 a2.5,2.5 0 0 1 -2.5,2.5 h-8.5 l-4.5,3.6 v-3.6 h-3 a2.5,2.5 0 0 1 -2.5,-2.5 v-6.5 a2.5,2.5 0 0 1 2.5,-2.5 z" />
          <path d="M-5,-2.2 h10 M-5,1.4 h6" />
        </g>
      )}
      {pool === 'image' && (
        <g {...common}>
          <rect x={-9} y={-7} width={18} height={14} rx={2.5} />
          <path d="M-6.5,4.5 L-1.5,-0.8 L1.8,2.4 L4,0.4 L7,4.5" />
          <circle cx={3.6} cy={-3} r={1.5} fill={color} stroke="none" />
        </g>
      )}
      {pool === 'video' && (
        <g {...common}>
          <rect x={-9} y={-7} width={18} height={14} rx={2.5} />
          <path d="M-2.4,-3.6 L4,0 L-2.4,3.6 Z" fill={color} />
        </g>
      )}
      {pool === 'speech' && (
        <g {...common} strokeWidth={1.8}>
          <path d="M-8,-1.5 v3 M-4,-5 v10 M0,-7.5 v15 M4,-4 v8 M8,-1.5 v3" />
        </g>
      )}
      {pool === 'robot' && (
        <g {...common}>
          <rect x={-7.5} y={-4} width={15} height={11} rx={3} />
          <path d="M0,-4 v-3.2" />
          <circle cx={0} cy={-8.2} r={1.3} fill={color} stroke="none" />
          <circle cx={-3} cy={1.2} r={1.2} fill={color} stroke="none" />
          <circle cx={3} cy={1.2} r={1.2} fill={color} stroke="none" />
          <path d="M-2.4,4.3 h4.8" />
        </g>
      )}
    </g>
  );
}


/** what the router reads: a question, an image with a question, a task with files, a prompt, camera frames */
export function InputIcon({ kind, x, y, color, bg = 'var(--page)' }: { kind: InputKind; x: number; y: number; color: string; bg?: string }) {
  const common = stroke(color);
  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === 'question' && (
        <g {...common}>
          <path d="M-8,-6.5 h16 a2.5,2.5 0 0 1 2.5,2.5 v6.5 a2.5,2.5 0 0 1 -2.5,2.5 h-8.5 l-4.5,3.6 v-3.6 h-3 a2.5,2.5 0 0 1 -2.5,-2.5 v-6.5 a2.5,2.5 0 0 1 2.5,-2.5 z" />
          <path d="M-1.8,-3.2 a1.9,1.9 0 1 1 2.6,1.8 c-0.6,0.3 -0.8,0.7 -0.8,1.3" />
          <circle cx={0} cy={3.2} r={0.9} fill={color} stroke="none" />
        </g>
      )}
      {kind === 'image-question' && (
        <g {...common}>
          <rect x={-9.5} y={-7} width={14} height={11} rx={2} />
          <path d="M-7.5,2.5 L-3.5,-1.5 L-1,1 L2.5,-2 L2.5,2.5" />
          <circle cx={6} cy={4.5} r={4.2} fill={bg} />
          <path d="M5,3.3 a1.1,1.1 0 1 1 1.5,1 c-0.4,0.2 -0.5,0.4 -0.5,0.8" strokeWidth={1.2} />
        </g>
      )}
      {kind === 'task-files' && (
        <g {...common}>
          <path d="M-6.5,-8.5 h8 l5,5 v13 h-13 z" />
          <path d="M1.5,-8.5 v5 h5" />
          <path d="M-3.5,1 h7 M-3.5,4.5 h5" />
        </g>
      )}
      {kind === 'prompt' && (
        <g {...common}>
          <path d="M-8.5,-5.5 h12 M-8.5,-1 h9 M-8.5,3.5 h6" />
          <path d="M6.5,-1.5 l1.2,2.6 l2.6,1.2 l-2.6,1.2 l-1.2,2.6 l-1.2,-2.6 l-2.6,-1.2 l2.6,-1.2 z" fill={color} strokeWidth={0.8} />
        </g>
      )}
      {kind === 'cameras' && (
        <g {...common}>
          <rect x={-9} y={-5} width={18} height={12} rx={2.5} />
          <path d="M-4,-5 l1.6,-2.6 h4.8 l1.6,2.6" />
          <circle cx={0} cy={1} r={3.4} />
        </g>
      )}
    </g>
  );
}
