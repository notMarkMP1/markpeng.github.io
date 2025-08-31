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

    // Updated with more natural, earth-toned colors
    const colorDictionary: { [key: string]: string } = {
        "AWS": "bg-orange-600",
        "Java": "bg-amber-700",
        "JavaScript": "bg-yellow-600",
        "MongoDB": "bg-emerald-600",
        "Next.js": "bg-zinc-800",
        "Node.js": "bg-green-700",
        "OAuth2.0": "bg-slate-600",
        "Python": "bg-blue-800",
        "React": "bg-blue-600",
        "Tailwind CSS": "bg-teal-600",
        "Terraform": "bg-purple-700",
        "Three.js": "bg-gray-600",
        "TypeScript": "bg-blue-700",
        "WPILib": "bg-red-700",
        "C": "bg-slate-700",
        "C/C++": "bg-slate-700",
        "FFmpeg": "bg-red-800",
        "Linux": "bg-yellow-700",
        "WSL": "bg-blue-800",
        "Google Cloud": "bg-blue-500",
        "Arduino": "bg-teal-700",
        "Gradle": "bg-green-800"
    }

    const colorClasses = [
        "bg-emerald-700",
        "bg-teal-700", 
        "bg-green-700",
        "bg-blue-700",
        "bg-amber-700",
        "bg-orange-700",
        "bg-red-700",
        "bg-purple-700",
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
                        <h3 className="text-md font-semibold font-body">{item.title}</h3>
                        <p className="text-sm text-zinc-700">{item.description}</p>
                    </div>
                    <div className="col-span-1">
                        {item.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className={`inline-block text-xs rounded-full px-2 py-1 mr-0.5 mb-1 text-white ${colorDictionary[tech] || colorClasses[tech.length % colorClasses.length]} whitespace-nowrap`}>{tech}</span>
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