import { useCallback, useEffect, useState } from 'react';
import { consultationsApi } from '../../api/consultations';
import { consultationSocket } from '../../socket/consultations';
import { getSocket } from '../../socket/client';
import { getErrorMessage } from '../../utils/errors';
import type { Consultation, ConsultationMessage } from '../../types';

/**
 * Loads a consultation + its history, joins the /consultations room and keeps
 * the message list live. Sending uses the socket, falling back to HTTP.
 */
export function useConsultationChat(consultationId: string) {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);

  const addMessage = useCallback((m: ConsultationMessage) => {
    setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, msgs] = await Promise.all([
        consultationsApi.get(consultationId),
        consultationsApi.messages(consultationId),
      ]);
      setConsultation(c);
      setEnded(c.status === 'ENDED');
      setMessages(msgs);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket('/consultations');
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    const leave = consultationSocket.join(consultationId);
    const offMsg = consultationSocket.onMessage(addMessage);
    const offEnded = consultationSocket.onEnded(e => {
      if (e.consultationId === consultationId) {
        setEnded(true);
        setConsultation(c => (c ? { ...c, status: 'ENDED' } : c));
      }
    });
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      leave();
      offMsg();
      offEnded();
    };
  }, [consultationId, addMessage]);

  const send = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text) {
        return;
      }
      if (!consultationSocket.sendMessage(consultationId, text)) {
        // Socket offline: HTTP fallback; the server echoes the saved message.
        const saved = await consultationsApi.sendMessage(consultationId, text);
        addMessage(saved);
      }
    },
    [consultationId, addMessage],
  );

  return {
    consultation,
    setConsultation,
    messages,
    loading,
    error,
    connected,
    ended,
    setEnded,
    send,
    reload: load,
  };
}
