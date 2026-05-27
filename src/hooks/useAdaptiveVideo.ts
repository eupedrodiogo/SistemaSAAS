import { useEffect, useRef, useState, RefObject } from 'react';

export type VideoOrientation = 'landscape' | 'portrait' | 'square' | 'unknown';

export interface AdaptiveVideoState {
    orientation: VideoOrientation;
    aspectRatio: number | null;
    /** Tailwind-compatible object-fit value */
    objectFitClass: string;
    /** Inline style for the video element */
    videoStyle: React.CSSProperties;
    /** Inline style for the container (background bars) */
    containerStyle: React.CSSProperties;
}

/**
 * Detects the real aspect ratio of a MediaStream through the HTMLVideoElement
 * metadata and returns adaptive CSS values so the video fills the container
 * correctly in all device combinations:
 *
 *   PC × PC       → both landscape  → no bars
 *   PC × Mobile   → remote portrait → letterbox (side bars)
 *   Mobile × PC   → remote landscape → pillarbox (top/bottom bars)
 *   Mobile × Mobile → both portrait → no bars
 *
 * @param videoRef - ref to the <video> element showing the stream
 * @param stream   - the MediaStream being displayed (triggers re-detection on change)
 */
export function useAdaptiveVideo(
    videoRef: RefObject<HTMLVideoElement | null>,
    stream: MediaStream | null
): AdaptiveVideoState {
    const [orientation, setOrientation] = useState<VideoOrientation>('unknown');
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !stream) {
            setOrientation('unknown');
            setAspectRatio(null);
            return;
        }

        const detectRatio = () => {
            const { videoWidth, videoHeight } = el;
            if (!videoWidth || !videoHeight) return;

            const ratio = videoWidth / videoHeight;
            setAspectRatio(ratio);

            if (ratio > 1.05) {
                setOrientation('landscape');
            } else if (ratio < 0.95) {
                setOrientation('portrait');
            } else {
                setOrientation('square');
            }
        };

        // Fires when video dimensions are available
        el.addEventListener('loadedmetadata', detectRatio);
        // Also check immediately in case metadata is already loaded
        detectRatio();

        // Watch for runtime orientation changes (e.g. user rotates phone mid-call)
        const trackHandler = () => {
            // Small delay to let the browser update videoWidth/videoHeight
            setTimeout(detectRatio, 300);
        };
        stream.getTracks().forEach(track => {
            track.addEventListener('ended', trackHandler);
        });

        return () => {
            el.removeEventListener('loadedmetadata', detectRatio);
            stream.getTracks().forEach(track => {
                track.removeEventListener('ended', trackHandler);
            });
        };
    }, [videoRef, stream]);

    // Derive CSS from the detected orientation
    const state: AdaptiveVideoState = {
        orientation,
        aspectRatio,
        // Always contain so no part of the remote video is cropped
        objectFitClass: 'object-contain',
        videoStyle: {
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            display: 'block',
        },
        // Dark background fills the letterbox/pillarbox bars seamlessly
        containerStyle: {
            backgroundColor: '#020617', // slate-950
        },
    };

    return state;
}
