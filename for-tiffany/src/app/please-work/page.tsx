'use client'

import { useState, useEffect } from 'react';
import Wrapped from '@/app/components/Wrapped';
import Survey from '@/app/components/Survey';

export default function Main() {
    const [clicked, setClicked] = useState(false);
    const [faded, setFaded] = useState(false);
    const [uiNumber, setUINumber] = useState(0);

    useEffect(() => {
        if (clicked) {
            const fadeTimer = setTimeout(() => {
                setFaded(true);
            }, 2000);
            return () => clearTimeout(fadeTimer);
        }
    }, [clicked]);

    useEffect(() => {
        if (faded) {
            const buttonTimer = setTimeout(() => {
                setUINumber(1);
            }, 500);
            return () => clearTimeout(buttonTimer);
        }
    }, [faded]);

    const handleCloseSurvey = () => {
        if (uiNumber <= 4) {
            setUINumber(uiNumber + 1);
        }
    };

    if (uiNumber === 1) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Survey onClose={handleCloseSurvey} />
            </div>
        );
    }

    if (uiNumber === 2) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Wrapped />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen">
            {clicked ? (
                <div className={`text-6xl font-bold text-center transition-opacity duration-500 ${faded ? 'opacity-0' : 'opacity-100'}`}>
                    good girlllllll LMFAOAOAOAO
                </div>
            ) : (
                <div>
                    <button
                        className="bg-yellow-300 hover:bg-yellow-200 text-gray-800 py-2 px-4 rounded-md shadow"
                        onClick={() => setClicked(true)}
                    >
                        click me
                    </button>
                    <button
                        className="bg-yellow-300 hover:bg-yellow-200 text-gray-800 py-2 px-4 rounded-md shadow"
                        onClick={() => setUINumber(2)}
                    >
                        wrapped
                    </button>
                </div>
            )}
        </div>
    );
}