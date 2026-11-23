'use client';
import { motion } from 'framer-motion';

interface TimelineProps {
    items: {
        date: string;
        title: string;
        company: string;
        description: string;
        link: string;
    }[];
}

export default function Timeline({items}: TimelineProps) {
    return (
        <>
            {items.map((item, index) => (
                <motion.div key={index} className="relative mb-4 cursor-pointer"
                    whileHover={{ 
                        scale: 1.03,
                    }}
                    whileTap={{ 
                        scale: 0.99,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    onClick={() => window.open(item.link, "_blank")}
                >
                    <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true"></div>
                    <div className="ml-5">
                        <div className="flex justify-between items-center gap-2">
                            <h3 className="text-lg font-semibold font-body text-[var(--color-text-primary)]">{item.company}</h3>
                            <span className="text-sm text-[var(--color-text-muted)] shrink-0">{item.date}</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">{item.title}</p>
                        <p className="text-[var(--color-text-secondary)]">{item.description}</p>
                    </div>
                </motion.div>
            ))}
        </>
    );
}
