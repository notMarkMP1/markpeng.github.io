'use client'
import React from 'react';
import { motion } from 'framer-motion';

interface FadeInSectionProps {
    children: React.ReactNode;
    delay?: number;
}

export default function FadeInSection({ children, delay }: FadeInSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
};