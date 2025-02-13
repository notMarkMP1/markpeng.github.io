import React from 'react';

interface FadeInProps {
    children: React.ReactNode;
    duration?: number;
    delay?: number;
}

export default function FadeIn({ duration = 1, delay = 0, children }: FadeInProps) {
    const fadeInStyle: React.CSSProperties = {
        opacity: 0,
        visibility: 'hidden',
        animationName: 'fadeIn',
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards',
    };

    const keyframes = `
        @keyframes fadeIn {
            to {
                opacity: 1;
                visibility: visible;
            }
        }
    `;

    return (
        <div style={fadeInStyle}>
            <style>{keyframes}</style>
            {children}
        </div>
    );
};