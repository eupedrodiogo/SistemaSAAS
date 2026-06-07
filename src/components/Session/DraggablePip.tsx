import React, { useRef, useState, useEffect } from 'react';

interface DraggablePipProps {
    children: React.ReactNode;
    className?: string;
    containerRef: React.RefObject<HTMLElement | null>;
    defaultPosition?: { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string };
}

export const DraggablePip: React.FC<DraggablePipProps> = ({ children, className = '', containerRef, defaultPosition }) => {
    const pipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 0, height: 0 }); // 0 means default
    const draggingInfo = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0, bounds: { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 } });
    const resizeInfo = useRef({ isResizing: false, startX: 0, startY: 0, initWidth: 0, initHeight: 0 });

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current || !pipRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const pipRect = pipRef.current.getBoundingClientRect();

        // Calculate maximum movement allowed in each direction based on current position and container
        const minX = containerRect.left - pipRect.left + position.x;
        const maxX = containerRect.right - pipRect.right + position.x;
        const minY = containerRect.top - pipRect.top + position.y;
        const maxY = containerRect.bottom - pipRect.bottom + position.y;

        draggingInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initX: position.x,
            initY: position.y,
            bounds: { minX, maxX, minY, maxY }
        };
        
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingInfo.current.isDragging) return;
        
        let newX = draggingInfo.current.initX + (e.clientX - draggingInfo.current.startX);
        let newY = draggingInfo.current.initY + (e.clientY - draggingInfo.current.startY);

        const { minX, maxX, minY, maxY } = draggingInfo.current.bounds;
        
        // Clamp to container bounds
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        setPosition({ x: newX, y: newY });
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingInfo.current.isDragging) return;
        draggingInfo.current.isDragging = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pipRef.current) return;
        e.stopPropagation();
        const rect = pipRef.current.getBoundingClientRect();
        resizeInfo.current = {
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initWidth: rect.width,
            initHeight: rect.height
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!resizeInfo.current.isResizing) return;
        e.stopPropagation();
        
        // Let's only change width, the height will scale automatically with aspect-ratio
        let newWidth = resizeInfo.current.initWidth + (e.clientX - resizeInfo.current.startX);
        newWidth = Math.max(80, newWidth); // min 80px
        
        // Optional: limit max width to window innerWidth or container
        if (containerRef.current) {
            const maxW = containerRef.current.getBoundingClientRect().width * 0.8;
            newWidth = Math.min(newWidth, maxW);
        }

        setSize({ width: newWidth, height: 0 });
    };

    const onResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!resizeInfo.current.isResizing) return;
        e.stopPropagation();
        resizeInfo.current.isResizing = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // If window resizes, we might want to reset or re-clamp, but resetting is easier
    useEffect(() => {
        const handleResize = () => {
            setPosition({ x: 0, y: 0 });
            // keep size if user wants, or reset it:
            // setSize({ width: 0, height: 0 });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div 
            ref={pipRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`cursor-grab active:cursor-grabbing select-none ${className}`}
            style={{ 
                ...defaultPosition,
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: size.width > 0 ? `${size.width}px` : undefined,
                touchAction: 'none' // Prevent scrolling while dragging on mobile
            }}
        >
            {children}
            
            {/* Resize handle */}
            <div 
                className="absolute bottom-0 right-0 w-8 h-8 bg-transparent cursor-nwse-resize z-50 flex items-end justify-end p-1.5"
                onPointerDown={onResizeStart}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeEnd}
                onPointerCancel={onResizeEnd}
            >
                {/* Visual indicator for resize handle */}
                <div className="w-3 h-3 border-r-2 border-b-2 border-white/50 rounded-br-sm shadow-sm" />
            </div>
        </div>
    );
};
