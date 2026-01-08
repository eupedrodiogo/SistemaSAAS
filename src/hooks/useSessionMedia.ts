import { useState, useRef, useCallback, useEffect } from 'react';


export const useSessionMedia = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            setIsVideoActive(true);
            setIsMicMuted(false);
            setIsVideoMuted(false);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            throw err;
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            setIsVideoActive(false);
        }
    }, [localStream]);

    const toggleMic = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    // Recording Logic
    const startRecording = useCallback(() => {
        if (!localStream) return;

        chunksRef.current = [];
        setRecordedChunks([]);

        try {
            const recorder = new MediaRecorder(localStream); // Note: Only recording local stream for now as standard

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedChunks(chunksRef.current); // trigger update
            };

            recorder.start(1000); // collect chunks every second
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

            // Start timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
        }
    }, [localStream]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return {
        localStream,
        isVideoActive,
        startCamera,
        stopCamera,
        toggleMic,
        toggleVideo,
        isMicMuted,
        isVideoMuted,
        isRecording,
        startRecording,
        stopRecording,
        recordingTime,
        recordedChunks,
        monitoredChunks: chunksRef.current // mostly for debug or direct access
    };
};
