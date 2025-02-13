import { useEffect, useState } from 'react';
import FadeIn from '@/app/components/FadeIn';

export default function Wrapped() {
    const [uiNumber, setUINumber] = useState(0);

    useEffect(() => {
        const originalColor = document.body.style.backgroundColor;
        document.body.style.backgroundColor = "#00851b";
        return () => {
            document.body.style.backgroundColor = originalColor;
        };
    }, []);

    return (
        <div className="justify-center items-center space-y-12">
            {uiNumber === 0 && (
                <>
                    <FadeIn key="fadein-0-1" duration={1.5}>
                        <h1 className="text-6xl font-bold text-center text-black-950">get your wrapped</h1>
                    </FadeIn>
                    <FadeIn key="fadein-0-2" duration={3}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(1)}>start</button>
                        </div>
                    </FadeIn>
                </>
            )}

            {uiNumber === 1 && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-1-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">in a non creepy way (i swear), i decided to collect some data 🤓🤓</h1>
                    </FadeIn>
                    <FadeIn key="fadein-1-2" duration={1} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">i have two data sets, one which tracked data over a year</h1>
                        <p className=" text-2xl font-bold text-center">(from February 12th, 2024 to February 11th, 2025)</p>
                    </FadeIn>
                    <FadeIn key="fadein-1-3" duration={1} delay={2.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">and the other from November 23rd, 2024 to February 8th, 2025</h1>
                    </FadeIn>
                    <FadeIn key="fadein-1-4" duration={3} delay={3.5}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(2)}>lets get it</button>
                        </div>
                    </FadeIn>
                </div>
            )}

            {uiNumber === 2 && (
                <div className="justify-center items-center, space-y-2">
                    <FadeIn key="fadein-2-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">first, the main information!</h1>
                    </FadeIn>
                    <FadeIn key="fadein-2-2" duration={1} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">across the past year, we texted</h1>
                    </FadeIn>
                    <FadeIn key="fadein-2-3" duration={1} delay={2.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            a total of <span className="text-4xl font-extrabold text-white">513438</span> messages
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-2-4" duration={1} delay={3.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            you sent <span className="text-4xl font-extrabold text-pink-200">303449</span> messages
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-2-5" duration={1} delay={4.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            and i sent <span className="text-4xl font-extrabold text-blue-200">209989</span> messages
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-2-6" duration={1} delay={5.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">since we started dating, we texted</h1>
                    </FadeIn>
                    <FadeIn key="fadein-2-7" duration={1} delay={6.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            a total of <span className="text-3xl font-extrabold text-white">196062</span> messages: you sent <span className="text-3xl font-extrabold text-white">106029</span>, while i sent <span className="text-3xl font-extrabold text-white">90033</span> messages
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-2-8" duration={2} delay={7.5}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(3)}>wow! 🤯🤯</button>
                        </div>
                    </FadeIn>
                </div>
            )}

        </div>
    );
};