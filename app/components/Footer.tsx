'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation'
import Image from 'next/image';
export default function Footer() {

    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    if (pathname === "/") {
        return null;
    }

    return (
        <footer className="w-full flex flex-col items-center mt-auto py-4">
            <div className="max-w-lg w-full mx-auto px-2 py-0.5 sm:px-6 bg-white/10 backdrop-blur-sm rounded-md mb-4"></div>
            <div className="flex gap-3">
                <motion.a 
                    href="https://github.com/notMarkMP1/markpeng.github.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                        scale: 1.1,
                        color: "#ffffff"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="relative group"
                >
                    <Image src="./code.svg" alt="Source Code" width={26} height={26}/>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-zinc-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        view source code
                    </span>
                </motion.a>


                <motion.a 
                    href="https://linkedin.com/in/markminpeng"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                        scale: 1.1,
                        color: "#ffffff"
                    }}
                    className="relative group"
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <Image src="./linkedin.svg" alt="LinkedIn" width={24} height={24}/>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-zinc-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        view my linkedin
                    </span>
                </motion.a>
                <motion.a 
                    href="https://github.com/notMarkMP1"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                        scale: 1.1,
                        color: "#ffffff"
                    }}
                    className="relative group"
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <Image src="./github.svg" alt="GitHub" width={24} height={24}/>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-zinc-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        view my github
                    </span>
                </motion.a>

            </div>
            <div className="text-xs text-zinc-700 mt-3">
                &copy; {currentYear} Mark Peng. All rights reserved.
            </div>
        </footer>
    );

}