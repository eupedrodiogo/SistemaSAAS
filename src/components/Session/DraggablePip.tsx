import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface DraggablePipProps {
    children: React.ReactNode;
    className?: string;
    containerRef?: React.RefObject<HTMLElement | null>;
    defaultPosition?: { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string };
    disabled?: boolean;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const DraggablePip = forwardRef<HTMLDivElement, DraggablePipProps>(({ 
    children, 
    className = '', 
    containerRef, 
    defaultPosition,
    disabled = false,
    style,
    onClick,
    onMouseMove
}, ref) => {
    const pipRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => pipRef.current as HTMLDivElement);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 0, height: 0 }); // 0 means default
    const draggingInfo = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0, bounds: { minX: -5000, maxX: 5000, minY: -5000, maxY: 5000 } });
    const resizeInfo = useRef({ isResizing: false, startX: 0, startY: 0, initWidth: 0, initHeight: 0 });

    useEffect(() => {
        if (disabled) {
            setPosition({ x: 0, y: 0 });
            setSize({ width: 0, height: 0 });
        }
    }, [disabled]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !pipRef.current) return;
        
        let minX = -5000, maxX = 5000, minY = -5000, maxY = 5000;
        const pipRect = pipRef.current.getBoundingClientRect();

        if (containerRef && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            minX = containerRect.left - pipRect.left + position.x;
            maxX = containerRect.right - pipRect.right + position.x;
            minY = containerRect.top - pipRect.top + position.y;
            maxY = containerRect.bottom - pipRect.bottom + position.y;
        } else {
            // Fallback to window bounds with a margin
            minX = 0 - pipRect.left + position.x;
            maxX = window.innerWidth - pipRect.right + position.x;
            minY = 0 - pipRect.top + position.y;
            maxY = window.innerHeight - pipRect.bottom + position.y;
        }

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
        if (disabled || !draggingInfo.current.isDragging) return;
        
        let newX = draggingInfo.current.initX + (e.clientX - draggingInfo.current.startX);
        let newY = draggingInfo.current.initY + (e.clientY - draggingInfo.current.startY);

        const { minX, maxX, minY, maxY } = draggingInfo.current.bounds;
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        setPosition({ x: newX, y: newY });
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !draggingInfo.current.isDragging) return;
        draggingInfo.current.isDragging = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !pipRef.current) return;
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
        if (disabled || !resizeInfo.current.isResizing) return;
        e.stopPropagation();
        
        let newWidth = resizeInfo.current.initWidth + (e.clientX - resizeInfo.current.startX);
        newWidth = Math.max(80, newWidth); 
        
        if (containerRef && containerRef.current) {
            const maxW = containerRef.current.getBoundingClientRect().width * 0.9;
            newWidth = Math.min(newWidth, maxW);
        } else {
            newWidth = Math.min(newWidth, window.innerWidth * 0.9);
        }

        setSize({ width: newWidth, height: 0 });
    };

    const onResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !resizeInfo.current.isResizing) return;
        e.stopPropagation();
        resizeInfo.current.isResizing = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        const handleResize = () => {
            if (!disabled) {
                // Ao rotacionar ou redimensionar a tela, voltamos a zero para evitar que saia da tela
                setPosition({ x: 0, y: 0 });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [disabled]);

    return (
        <div 
            ref={pipRef}
            onClick={onClick}
            onMouseMove={onMouseMove}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`${!disabled ? 'cursor-grab active:cursor-grabbing' : ''} select-none ${className}`}
            style={{ 
                ...style,
                ...defaultPosition,
                transform: !disabled ? `translate(${position.x}px, ${position.y}px)` : undefined,
                width: (!disabled && size.width > 0) ? `${size.width}px` : undefined,
                touchAction: !disabled ? 'none' : undefined 
            }}
        >
            {children}
            
            {!disabled && (
                <div 
                    className="absolute bottom-0 right-0 w-8 h-8 bg-transparent cursor-nwse-resize z-50 flex items-end justify-end p-1.5"
                    onPointerDown={onResizeStart}
                    onPointerMove={onResizeMove}
                    onPointerUp={onResizeEnd}
                    onPointerCancel={onResizeEnd}
                >
                    <div className="w-3 h-3 border-r-2 border-b-2 border-white/50 rounded-br-sm shadow-sm" />
                </div>
            )}
        </div>
    );
});

