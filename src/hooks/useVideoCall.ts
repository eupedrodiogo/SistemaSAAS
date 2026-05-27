import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export interface ChatMessage {
    id: string;
    sender: 'me' | 'remote';
    text: string;
    timestamp: number;
}

interface UseVideoCallProps {
    myId: string;
    targetId: string;
    isInitiator: boolean; // Therapist initiates, Client answers
    localStream: MediaStream | null;
}

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelay',
        credential: 'openrelay'
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelay',
        credential: 'openrelay'
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelay',
        credential: 'openrelay'
    }
];

export const useVideoCall = ({ myId, targetId, isInitiator, localStream }: UseVideoCallProps) => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<any>(null);
    const dataConnectionRef = useRef<any>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const connectionStatusRef = useRef<string>('disconnected');
    const isUnmountedRef = useRef(false);
    const retryIntervalRef = useRef<any>(null);

    // Keep refs in sync
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { remoteStreamRef.current = remoteStream; }, [remoteStream]);
    useEffect(() => { connectionStatusRef.current = connectionStatus; }, [connectionStatus]);

    const sendMessage = useCallback((text: string) => {
        if (!dataConnectionRef.current?.open) {
            console.warn('Cannot send message: data connection not open');
            return;
        }
        dataConnectionRef.current.send({ type: 'chat', text });
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text, timestamp: Date.now() }]);
    }, []);

    // ─── Initiator (Therapist): make & retry calls ───────────────────────────
    const makeCall = useCallback(() => {
        const peer = peerRef.current;
        if (!peer || peer.destroyed || !targetId) return;
        if (!localStreamRef.current) {
            console.log('[Initiator] Local stream not ready, skipping makeCall');
            return;
        }

        // Already fully connected — skip
        if (connectionStatusRef.current === 'connected' && remoteStreamRef.current) return;

        // Ensure data channel
        if (!dataConnectionRef.current?.open) {
            const conn = peer.connect(targetId, { reliable: true });
            dataConnectionRef.current = conn;
            conn.on('data', (data: any) => {
                if (data.type === 'chat') {
                    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'remote', text: data.text, timestamp: Date.now() }]);
                }
            });
            conn.on('close', () => { dataConnectionRef.current = null; });
        }

        // Close stale call
        if (callRef.current) {
            try { callRef.current.close(); } catch (_) {}
            callRef.current = null;
        }

        console.log(`[Initiator] Calling ${targetId}…`);
        setConnectionStatus('connecting');

        const call = peer.call(targetId, localStreamRef.current!);
        callRef.current = call;

        call.on('stream', (rStream: MediaStream) => {
            if (isUnmountedRef.current) return;
            console.log('[Initiator] Remote stream received');
            setRemoteStream(rStream);
            setConnectionStatus('connected');
        });

        call.on('close', () => {
            if (isUnmountedRef.current) return;
            setConnectionStatus('disconnected');
            setRemoteStream(null);
            callRef.current = null;
        });

        call.on('error', (err: any) => {
            console.error('[Initiator] Call error:', err);
            if (!isUnmountedRef.current) setConnectionStatus('disconnected');
            callRef.current = null;
        });
    }, [targetId]);

    // ─── Single unified Peer lifecycle ───────────────────────────────────────
    useEffect(() => {
        if (!myId) return;
        isUnmountedRef.current = false;

        let peer: Peer;
        let retryAvailableId: ReturnType<typeof setTimeout> | null = null;

        const initPeer = () => {
            if (isUnmountedRef.current) return;

            console.log(`[PeerJS] Initializing as ${myId} (initiator=${isInitiator})`);

            peer = new Peer(myId, {
                debug: 2,
                config: { iceServers: ICE_SERVERS }
            });
            peerRef.current = peer;

            peer.on('open', (id) => {
                if (isUnmountedRef.current) return;
                console.log(`[PeerJS] Open: ${id}`);

                if (!isInitiator) {
                    // Receiver (Client): ready and waiting for incoming call
                    setConnectionStatus('connecting');
                } else {
                    // Initiator (Therapist): start calling immediately then retry every 3s
                    makeCall();
                    retryIntervalRef.current = setInterval(() => {
                        if (connectionStatusRef.current !== 'connected' || !remoteStreamRef.current) {
                            makeCall();
                        }
                    }, 3000);
                }
            });

            peer.on('call', (call) => {
                // Receiver (Client) answers incoming call
                if (isUnmountedRef.current || isInitiator) return;

                const stream = localStreamRef.current;
                if (!stream) {
                    console.warn('[Receiver] Got call but local stream not ready — ignoring, therapist will retry');
                    return;
                }

                console.log('[Receiver] Answering call from:', call.peer);
                setConnectionStatus('connecting');
                call.answer(stream);
                callRef.current = call;

                call.on('stream', (rStream: MediaStream) => {
                    if (isUnmountedRef.current) return;
                    console.log('[Receiver] Remote stream received');
                    setRemoteStream(rStream);
                    setConnectionStatus('connected');
                });

                call.on('close', () => {
                    if (isUnmountedRef.current) return;
                    setConnectionStatus('disconnected');
                    setRemoteStream(null);
                    callRef.current = null;
                });

                call.on('error', (e: any) => {
                    console.error('[Receiver] Call error:', e);
                    if (!isUnmountedRef.current) setConnectionStatus('disconnected');
                    callRef.current = null;
                });
            });

            // Data channel (receiver side)
            peer.on('connection', (conn) => {
                if (isUnmountedRef.current) return;
                dataConnectionRef.current = conn;
                conn.on('data', (data: any) => {
                    if (data.type === 'chat') {
                        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'remote', text: data.text, timestamp: Date.now() }]);
                    }
                });
                conn.on('close', () => { dataConnectionRef.current = null; });
            });

            peer.on('disconnected', () => {
                if (isUnmountedRef.current) return;
                console.warn('[PeerJS] Disconnected from signaling server. Reconnecting…');
                if (!peer.destroyed) {
                    try { peer.reconnect(); } catch (e) { console.error(e); }
                }
            });

            peer.on('error', (err: any) => {
                console.error('[PeerJS] Error:', err.type, err);
                if (err.type === 'unavailable-id') {
                    console.warn(`[PeerJS] ID "${myId}" is taken. Retrying in 3s…`);
                    try { peer.destroy(); } catch (_) {}
                    retryAvailableId = setTimeout(() => {
                        if (!isUnmountedRef.current) initPeer();
                    }, 3000);
                } else {
                    if (!isUnmountedRef.current) setConnectionStatus('disconnected');
                }
            });
        };

        initPeer();

        return () => {
            isUnmountedRef.current = true;
            if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
            if (retryAvailableId) clearTimeout(retryAvailableId);
            if (callRef.current) { try { callRef.current.close(); } catch (_) {} callRef.current = null; }
            if (peer) { try { peer.destroy(); } catch (_) {} }
            peerRef.current = null;
        };
    }, [myId, isInitiator, makeCall]);

    // ─── Re-trigger calls when localStream becomes available (Initiator only) ─
    // If the peer is already open but localStream just became available, retry.
    useEffect(() => {
        if (!isInitiator || !localStream || !peerRef.current) return;
        const peer = peerRef.current;
        if (peer.destroyed || peer.disconnected) return;
        if (connectionStatusRef.current !== 'connected') {
            console.log('[Initiator] localStream now available, attempting call…');
            makeCall();
        }
    }, [localStream, isInitiator, makeCall]);

    const connect = useCallback(() => {
        if (!peerRef.current || !targetId || !localStreamRef.current) {
            console.warn('Cannot connect: missing peer, targetId or localStream');
            return;
        }
        makeCall();
    }, [targetId, makeCall]);

    return { remoteStream, connectionStatus, connect, messages, sendMessage };
};
