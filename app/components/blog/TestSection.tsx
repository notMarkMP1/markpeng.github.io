'use client';

import { useState } from 'react';

export default function TestSection() {
    const [count, setCount] = useState(0);
    const increment = () => setCount(count + 1);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Test Section</h1>
            <p className="text-lg mb-4">Current Count: {count}</p>
            <button 
                onClick={increment} 
                className="px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-600 transition duration-300"
            >
                Increment Count
            </button>
        </div>
    )
}
