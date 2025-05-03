'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

interface ProjectProps {
    items: {
        title: string;
        description: string;
        technologies: string[];
        link: string;
        imagePath: string;
    }[];
}


export default function Projects({items}: ProjectProps){
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const colorDictionary: { [key: string]: string } = {
        "React": "bg-blue-500",
        "Node.js": "bg-green-700",
        "Next.js": "bg-zinc-900",
        "Tailwind CSS": "bg-cyan-700",
        "JavaScript": "bg-yellow-700",
        "TypeScript": "bg-blue-700",
        "Terraform": "bg-indigo-700",
        "MongoDB": "bg-green-500",
        "AWS": "bg-orange-500",
        "Python": "bg-blue-900",
        "OAuth2.0": "bg-zinc-700"
    }

    const colorClasses = [
        "bg-blue-700",
        "bg-green-700",
        "bg-yellow-700",
        "bg-red-700",
        "bg-purple-700",
        "bg-pink-700",
        "bg-indigo-700",
        "bg-teal-700",
    ];

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePosition({
            x: e.clientX,
            y: e.clientY
        });
    };

    return (
        <div className="relative" onMouseMove={handleMouseMove}>
            {items.map((item, index) => (
                <motion.div 
                    key={index} 
                    className="grid grid-cols-2 gap-4 space-y-4 mb-4 cursor-pointer px-1 relative"
                    whileHover= {{
                        scale: 1.05,
                        boxShadow: "0px 5px 0px rgba(0, 0, 0, 0.1)"
                    }}
                    whileTap= {{
                        scale: 0.98
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => {
                        window.open(item.link, "_blank");
                        setHoveredIndex(null);
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div className="col-span-1 flex flex-col space-y-0.5">
                        <h3 className="text-md font-semibold">{item.title}</h3>
                        <p className="text-sm text-zinc-700">{item.description}</p>
                    </div>
                    <div className="col-span-1">
                        {item.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className={`inline-block text-xs rounded-full px-2 py-1 mr-0.5 text-white ${colorDictionary[tech] || colorClasses[tech.length % colorClasses.length]} whitespace-nowrap`}>{tech}</span>
                        ))}
                    </div>
                </motion.div>        
            ))}
            {hoveredIndex !== null && items[hoveredIndex].imagePath && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="fixed z-50 rounded-lg overflow-hidden"
                    style={{ 
                        left: `${mousePosition.x - 150}px`,
                        top: `${mousePosition.y - 220}px`,
                        width: '300px',
                        height: '200px'
                    }}
                >
                    <Image 
                        src={items[hoveredIndex].imagePath} 
                        alt={items[hoveredIndex].title} 
                        data-loaded = 'false'
                        onLoad = {(e) => {e.currentTarget.setAttribute('data-loaded', 'true')}}
                        width={300}
                        height={200}
                        className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-zinc-100/50 w-full h-full object-cover"
                    />
                </motion.div>
            )}
        </div>
    );
}