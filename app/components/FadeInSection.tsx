'use client'
import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface FadeInSectionProps {
    children: React.ReactNode;
    delay?: number;
}

export default function FadeInSection({ children, delay }: FadeInSectionProps) {
    const divRef = useRef<HTMLDivElement>(null);
    
    return (
        <motion.div
            ref={divRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeInOut" }}
            style={{ pointerEvents: "none" }}
            onAnimationComplete={() => {
                if (divRef.current) divRef.current.style.pointerEvents = "auto";
            }}
        >
            {children}
        </motion.div>
    );
};