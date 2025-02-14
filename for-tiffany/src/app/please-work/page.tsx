'use client'

import { useState, useEffect } from 'react';
import Wrapped from '@/app/components/Wrapped';
import Survey from '@/app/components/Survey';
import PopQuiz from '../components/PopQuiz';

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

    const handleClose = () => {
        if (uiNumber <= 4) {
            setUINumber(uiNumber + 1);
        }
    };

    if (uiNumber === 1) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Survey onClose={handleClose} />
            </div>
        );
    }

    if (uiNumber === 2) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Wrapped onClose={handleClose}/>
            </div>
        );
    }

    if (uiNumber === 3){
        return(
            <div className="flex justify-center items-center h-screen">
                <PopQuiz onClose={handleClose}/>
            </div>
        )
    }

    if(uiNumber === 4){
        return(
            <div className="flex justify-center items-center h-screen">
                <div className="text-3xl font-bold text-center">
                    thank you for finishing my website 
                    <br/>
                    HAPPY VALENTINES DAY!!!!! 
                    <br/>
                    overall, this project took around 5 days to complete, 20 hours, and 1500+ lines of code!! 
                    <br/>
                    i love you 💖💖💖
                </div>
            </div>
        )
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
                </div>
            )}
        </div>
    );
}