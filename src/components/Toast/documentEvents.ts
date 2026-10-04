import { useEffect, useRef } from 'react';

export type DocumentEventPayload = {
  document_id?: string;
  status?: string;
  document_type?: string;
  [key: string]: unknown;
};

type DocumentEventListener = (event: string, payload: DocumentEventPayload) => void;

const listeners = new Set<DocumentEventListener>();

export function publishDocumentEvent(event: string, payload: DocumentEventPayload) {
  listeners.forEach((listener) => listener(event, payload));
}

export function useDocumentEventListener(listener: DocumentEventListener) {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const subscription: DocumentEventListener = (event, payload) => listenerRef.current(event, payload);
    listeners.add(subscription);
    return () => {
      listeners.delete(subscription);
    };
  }, []);
}