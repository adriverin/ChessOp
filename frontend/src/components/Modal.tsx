import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

interface ModalProps {
    children: React.ReactNode;
    onClose?: () => void;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
            return;
        }

        // Deterministic closing behavior
        if (location.state?.backgroundLocation) {
            // If we have a background location, explicitly navigate to it
            // This is safer than -1 which depends on history stack state
            const bg = location.state.backgroundLocation;
            navigate(bg.pathname + bg.search, { replace: true });
        } else {
            // Fallback to free-tier area
            navigate('/openings', { replace: true });
        }
    }, [navigate, onClose, location]);

    const handleOverlayMouseDown = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            handleClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    return (
        <div 
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onMouseDown={handleOverlayMouseDown}
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button 
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
                {children}
            </div>
        </div>
    );
};
