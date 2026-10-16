import { useSyncExternalStore } from 'react';
import SwipeToast from '@/components/reactbits/SwipeToast/SwipeToast';

interface ToastMsg {
  id: number;
  title: string;
  description?: string;
}

let current: ToastMsg | null = null;
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Show a short confirmation (React Bits SwipeToast: swipe down to dismiss, fuse shows time left). */
export function toast(title: string, description?: string) {
  current = { id: ++seq, title, description };
  emit();
}

export function ToastHost() {
  const msg = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => current
  );
  if (!msg) return null;
  return (
    <SwipeToast
      key={msg.id}
      title={msg.title}
      description={msg.description}
      background="var(--ink)"
      color="var(--bg)"
      fuseColor="var(--accent)"
      width={340}
      radius={14}
      duration={2600}
      closeButton
      onClose={() => {
        if (current?.id === msg.id) {
          current = null;
          emit();
        }
      }}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      }
    />
  );
}
