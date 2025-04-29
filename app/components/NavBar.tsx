'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, LayoutGroup } from 'framer-motion';

export default function NavBar() {
    const pathname = usePathname();

    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/projects', label: 'Projects' },
        { path: '/contact', label: 'Contact' },
    ];

    return (
        <nav className="flex justify-center items-center p-4">
                <div className="flex justify-center items-center space-x-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`px-3 py-2 text-md rounded-xl transition-colors relative
                                ${pathname === item.path ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {item.label}
                            {pathname === item.path && (
                                <motion.div
                                    className="absolute inset-0 rounded-lg -z-10"
                                    layoutId="bubble"
                                    style={{ backgroundColor: "#222222" }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "easeInOut"}}
                                />
                            )}
                        </Link>
                    ))}
                </div>
        </nav>
    );
}