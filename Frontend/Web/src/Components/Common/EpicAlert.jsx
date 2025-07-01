import React, { useEffect, useState } from 'react';

const ALERT_STYLES = {
    success: {
        bg: 'bg-green-500',
        icon: '✅',
    },
    error: {
        bg: 'bg-red-500',
        icon: '❌',
    },
    warning: {
        bg: 'bg-yellow-400',
        icon: '⚠️',
    },
    info: {
        bg: 'bg-blue-500',
        icon: 'ℹ️',
    },
};

const EpicAlert = ({
    type = 'info',
    message,
    isVisible,
    onClose,
    duration = 3500,
}) => {
    const [show, setShow] = useState(isVisible);

    useEffect(() => {
        setShow(isVisible);
        if (isVisible) {
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(() => onClose && onClose(), 250);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!show) return null;

    const { bg, icon } = ALERT_STYLES[type] || ALERT_STYLES.info;

    return (
        <>
            <style>
                {`
                    .epic-alert {
                        z-index: 999999 !important;
                        position: fixed !important;
                    }
                `}
            </style>
            <div
                className={`
                    epic-alert
                    fixed top-4 right-4 z-[999999]
                    min-w-[280px] max-w-sm
                    flex items-center gap-3
                    px-5 py-4 rounded-lg shadow-2xl
                    text-white ${bg}
                    transition-all duration-300 ease-out
                    transform
                    ${show ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-full scale-95'}
                    border border-white/20
                    backdrop-blur-sm
                `}
                style={{ 
                    pointerEvents: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                    zIndex: 999999,
                    position: 'fixed'
                }}
            >
            <span className="text-2xl drop-shadow-sm">{icon}</span>
            <span className="flex-1 font-semibold text-base leading-tight">{message}</span>
            <button
                onClick={() => {
                    setShow(false);
                    setTimeout(() => onClose && onClose(), 250);
                }}
                className="ml-3 text-white/90 hover:text-white text-xl font-bold transition-colors duration-200 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Cerrar"
            >
                ×
            </button>
        </div>
        </>
    );
};

export default EpicAlert;
