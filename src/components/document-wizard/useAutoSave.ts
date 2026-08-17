import { useEffect, useRef, useState } from 'react';

type SaveFn<T> = (payload: T) => Promise<unknown>;

function hashObject(obj: unknown, depth = 0): number {
  const MAX_DEPTH = 4;
  let hash = 5381;
  const mix = (v: string) => {
    for (let i = 0; i < v.length; i++) {
      hash = (hash * 33) ^ v.charCodeAt(i);
    }
    return hash >>> 0;
  };

  if (obj === null || obj === undefined) return mix(String(obj));
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return mix(String(obj));
  if (depth > MAX_DEPTH) return mix('[DEPTH]');
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      hash ^= hashObject(obj[i], depth + 1);
    }
    return hash >>> 0;
  }
  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    for (const k of keys) {
      hash ^= mix(k);
      hash ^= hashObject(record[k], depth + 1);
    }
    return hash >>> 0;
  }

  return mix(String(obj));
}

export function useAutoSave<T = unknown>(payload: T, saveFn: SaveFn<T>, delay = 1000) {
  const timer = useRef<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastSavedAt = useRef<string | null>(null);
  const lastHash = useRef<number | null>(null);
  const saveFnRef = useRef(saveFn);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    if (!saveFnRef.current) return;
    const nextHash = hashObject(payload);
    if (lastHash.current !== null && nextHash === lastHash.current) return;
    lastHash.current = nextHash;

    setStatus('saving');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await saveFnRef.current(payload);
        setStatus('saved');
        lastSavedAt.current = new Date().toISOString();
      } catch (error) {
        console.error('autosave failed', error);
        setStatus('error');
      }
    }, delay);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [delay, payload]);

  return { status, lastSavedAt: lastSavedAt.current };
}
