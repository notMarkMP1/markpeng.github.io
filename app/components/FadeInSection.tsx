'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface FadeInSectionProps {
  children: React.ReactNode;
  delay?: number;
}

const SITE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function FadeInSection({ children, delay = 0 }: FadeInSectionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.46, delay, ease: SITE_EASE }}
    >
      {children}
    </motion.div>
  );
}