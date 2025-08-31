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
                        scale: 1.05,
                    }}
                    whileTap={{ 
                        scale: 0.98,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => window.open(item.link, "_blank")}
                >
                    <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true"></div>
                    <div className="ml-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold font-body">{item.company}</h3>
                            <span className="text-sm text-gray-500">{item.date}</span>
                        </div>
                        <p className="text-sm text-gray-500">{item.title}</p>
                        <p className="text-gray-300">{item.description}</p>
                    </div>
                </motion.div>
            ))}
        </>
    );
}