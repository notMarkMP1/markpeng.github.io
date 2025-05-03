'use client';

import { motion } from 'framer-motion';

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

    const colorDictionary: { [key: string]: string } = {
        "React": "bg-blue-500",
        "Node.js": "bg-green-700",
        "Next.js": "bg-zinc-900",
        "Tailwind CSS": "bg-cyan-700",
        "JavaScript": "bg-yellow-700",
        "TypeScript": "bg-blue-700",
        "Python": "bg-indigo-700",
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

    return (
        <>
        {items.map((item, index) => (
            <motion.div key={index} className="grid grid-cols-2 gap-4 space-y-4 mb-4 cursor-pointer"
                whileHover= {{
                    scale: 1.05,
                    boxShadow: "0px 5px 0px rgba(0, 0, 0, 0.1)"
                }}
                whileTap= {{
                    scale: 0.98}}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
        </>
    );
}