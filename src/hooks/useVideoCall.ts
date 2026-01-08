import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';

interface UseVideoCallProps {
    myId: string;
    targetId: string;
    isInitiator: boolean; // Therapist initiates, Client answers
    localStream: MediaStream | null;
}

export const useVideoCall = ({ myId, targetId, isInitiator, localStream }: UseVideoCallProps) => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<any>(null);

    // 1. Initialize Peer (Only depends on myId)
    useEffect(() => {
        if (!myId) return;

        console.log(`Initializing Peer with ID: ${myId}`);
        const peer = new Peer(myId, {
            debug: 2
        });

        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            if (!isInitiator) {
                setConnectionStatus('connecting'); // Client is ready and waiting
            }
        });

        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            setConnectionStatus('disconnected');
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
            peerRef.current = null;
        };
    }, [myId]);

    // 2. Handle Incoming Calls (Receiver / Client)
    useEffect(() => {
        const peer = peerRef.current;
        if (!peer || isInitiator) return;

        const handleCall = (call: any) => {
            console.log('Receiving call from:', call.peer);
            setConnectionStatus('connecting');

            // Answer the call
            // If localStream is available, send it. Otherwise, answer without stream (receive only)
            // Note: PeerJS allows answering without stream, but usually we want 2-way.
            // If localStream comes later, we might need to renegotiate or replace tracks (complex).
            // For now, we assume localStream is ready because ClientSessionView forces startCamera.
            call.answer(localStream || undefined);

            call.on('stream', (remoteStream: MediaStream) => {
                console.log('Received remote stream (Receiver)');
                setRemoteStream(remoteStream);
                setConnectionStatus('connected');
            });

            call.on('close', () => {
                console.log('Call closed');
                setConnectionStatus('disconnected');
                setRemoteStream(null);
            });

            call.on('error', (e: any) => console.error('Call error:', e));

            callRef.current = call;
        };

        peer.on('call', handleCall);

        return () => {
            peer.off('call', handleCall);
        };
    }, [isInitiator, localStream]); // Re-bind if localStream changes? Ideally not, but we need the latest stream to answer.

    // 3. Initiate Call (Therapist)
    useEffect(() => {
        const peer = peerRef.current;
        if (!peer || !isInitiator || !targetId || !localStream) return;

        // Only call if we are connected to PeerServer
        if (peer.disconnected) {
            peer.reconnect();
        }

        // Simple debounce or check if already calling?
        // For now, we'll rely on the user manually triggering "Start Camera" which sets localStream

        console.log(`Initiating call to ${targetId}...`);
        setConnectionStatus('connecting');

        const call = peer.call(targetId, localStream);

        call.on('stream', (remoteStream: MediaStream) => {
            console.log('Received remote stream (Initiator)');
            setRemoteStream(remoteStream);
            setConnectionStatus('connected');
        });

        call.on('close', () => {
            setConnectionStatus('disconnected');
            setRemoteStream(null);
        });

        call.on('error', (err: any) => {
            console.error('Call initiation error:', err);
            setConnectionStatus('disconnected');
        });

        callRef.current = call;

        return () => {
            if (callRef.current) {
                callRef.current.close();
            }
        };
    }, [isInitiator, targetId, localStream]); // If stream changes, we might re-call. This is acceptable for now.

    const connect = () => {
        const peer = peerRef.current;
        if (!peer || !targetId || !localStream) {
            console.warn('Cannot connect: Missing peer, targetId, or localStream');
            return;
        }

        if (peer.disconnected) {
            peer.reconnect();
        }

        console.log(`Manually initiating call to ${targetId}...`);
        setConnectionStatus('connecting');

        const call = peer.call(targetId, localStream);

        call.on('stream', (remoteStream: MediaStream) => {
            console.log('Received remote stream (Manual)');
            setRemoteStream(remoteStream);
            setConnectionStatus('connected');
        });

        call.on('close', () => {
            setConnectionStatus('disconnected');
            setRemoteStream(null);
        });

        call.on('error', (err: any) => {
            console.error('Manual call error:', err);
            setConnectionStatus('disconnected');
        });

        callRef.current = call;
    };

    return { remoteStream, connectionStatus, connect };
};
