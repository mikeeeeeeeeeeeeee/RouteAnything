import type { ReactNode } from 'react';
import ElasticSlider from '@/components/reactbits/ElasticSlider/ElasticSlider';
import { useTokens } from '@/theme/tokens';

/** The page's slider: React Bits ElasticSlider, stretched like rubber past either end. */
export function Slider({
  value,
  onChange,
  max,
  color,
  left,
  right,
  ariaLabel,
  className = '',
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
  color?: string;
  left?: ReactNode;
  right?: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const tk = useTokens();
  const c = color ?? tk.accent;
  const end = (n: ReactNode) => (n === undefined ? null : <span className="font-mono text-[11px] text-ink-3">{n}</span>);
  return (
    <ElasticSlider
      value={value}
      onChange={(v) => onChange(Math.round(v))}
      maxValue={max}
      startingValue={0}
      valuePosition="none"
      thickness={6}
      activeThickness={10}
      rangeColor={c}
      trackColor={tk.rule}
      thumbColor={c}
      leftIcon={end(left)}
      rightIcon={end(right)}
      ariaLabel={ariaLabel}
      className={`!w-full ${className}`}
    />
  );
}
