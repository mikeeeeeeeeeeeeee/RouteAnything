import { memo } from 'react';
import { tex } from '@/lib/tex';

/** Inline math. `<M>{'\\eta_B'}</M>` */
export const M = memo(function M({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`m-inline ${className}`} dangerouslySetInnerHTML={{ __html: tex(children) }} />;
});
