import { useEffect, useState } from 'react';
import FadeIn from '@/app/components/FadeIn';

interface WrappedProps {
    onClose: () => void;
}

export default function Wrapped({onClose} : WrappedProps) {
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
            {uiNumber === 3 && (
                <div className="justify-center items-center space-y-2">
                <FadeIn key="fadein-3-1" duration={1.5} delay={0}>
                    <h1 className="text-3xl font-bold text-center text-black-950">next, how many files did we share??</h1>
                </FadeIn>
                <FadeIn key="fadein-3-2" duration={1} delay={1.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">since we started dating, we shared</h1>
                </FadeIn>
                <FadeIn key="fadein-3-3" duration={1} delay={2.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        a total of <span className="text-4xl font-extrabold text-green-100">92</span> audio clips
                    </p>
                </FadeIn>
                <FadeIn key="fadein-3-4" duration={1} delay={3.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        a total of <span className="text-4xl font-extrabold text-green-100">75</span> videos
                    </p>
                </FadeIn>
                <FadeIn key="fadein-3-5" duration={1} delay={4.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        and total of <span className="text-4xl font-extrabold text-green-100">1051</span> photos
                    </p>
                </FadeIn>
                <FadeIn key="fadein-3-6" duration={1} delay={5.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">and since last year, we sent</h1>
                </FadeIn>
                <FadeIn key="fadein-3-7" duration={1} delay={6.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        a total of <span className="text-3xl font-extrabold text-white">468</span> audio clips, <span className="text-3xl font-extrabold text-white">266</span> videos, and <span className="text-3xl font-extrabold text-white">4076</span> photos!!
                    </p>
                </FadeIn>
                <FadeIn key="fadein-3-8" duration={1} delay={7.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">and this is excluding ANYTHING saved in chat!!!</h1>
                </FadeIn>
                <FadeIn key="fadein-3-9" duration={2} delay={8.5}>
                    <div className="flex justify-center items-center space-x-4">
                        <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(4)}>what the flip</button>
                    </div>
                </FadeIn>
            </div>
            )}
            {uiNumber === 4 && (
                <div className="justify-center items-center space-y-2">
                <FadeIn key="fadein-4-1" duration={1.5} delay={0}>
                    <h1 className="text-3xl font-bold text-center text-black-950">next, what were our best and worst days?</h1>
                </FadeIn>
                <FadeIn key="fadein-4-2" duration={1} delay={1.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">since we started dating, our most messages was on</h1>
                </FadeIn>
                <FadeIn key="fadein-4-3" duration={1} delay={2.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        <span className="text-3xl font-extrabold text-green-100">November 25th, 2024</span> with <span className="text-4xl font-extrabold text-green-100">6024</span> messages
                    </p>
                </FadeIn>
                <FadeIn key="fadein-4-4" duration={1} delay={3.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">and our worst day was</h1>
                </FadeIn>
                <FadeIn key="fadein-4-5" duration={1} delay={4.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        <span className="text-3xl font-extrabold text-green-100">January 3rd, 2025</span> with <span className="text-4xl font-extrabold text-green-100">763</span> messages
                    </p>
                </FadeIn>
                <FadeIn key="fadein-4-6" duration={1} delay={5.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">
                        that happened to be our gc hangout day!! the &quot;real&quot; day we texted the least was
                    </h1>
                </FadeIn>
                <FadeIn key="fadein-4-7" duration={1} delay={6.5}>    
                    <p className="text-2xl font-bold text-center text-black-950">
                        <span className="text-3xl font-extrabold text-green-100">January 8th, 2025</span> with <span className="text-4xl font-extrabold text-green-100">958</span> messages
                    </p>
                </FadeIn>
                <FadeIn key="fadein-4-8" duration={1} delay={7.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">
                        across the full year, our most messages was on
                    </h1>
                </FadeIn>
                <FadeIn key="fadein-4-9" duration={1} delay={8.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        <span className="text-3xl font-extrabold text-green-100">November 11th, 2024</span> (11/11 btw!!) with <span className="text-4xl font-extrabold text-green-100">8505</span> messages
                    </p>
                </FadeIn>
                <FadeIn key="fadein-4-10" duration={1} delay={9.5}>
                    <h1 className="text-3xl font-bold text-center text-black-950">
                        and our least messages was on 
                    </h1>
                </FadeIn>
                <FadeIn key="fadein-4-11" duration={1} delay={10.5}>
                    <p className="text-2xl font-bold text-center text-black-950">
                        <span className="text-3xl font-extrabold text-green-100">April 13th, 2024</span> with <span className="text-4xl font-extrabold text-green-100">1</span> message. ☠️☠️
                    </p>
                </FadeIn>
                <FadeIn key="fadein-4-12" duration={2} delay={11.5}>
                    <div className="flex justify-center items-center space-x-4">
                        <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(5)}>thought provoking</button>
                    </div>
                </FadeIn>
            </div>
            )}

            {uiNumber === 5 && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-5-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">now, some rapid fire stats!</h1>
                    </FadeIn>
                    <FadeIn key="fadein-5-2" duration={0.5} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">currently, our texting streak (as of February 11th, 2025) is </h1>
                    </FadeIn>
                    <FadeIn key="fadein-5-3" duration={0.5} delay={2}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">312 days!!</span>
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-5-4" duration={0.5} delay={2.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            and we will hit a year on <span className="text-4xl font-extrabold text-yellow-500">April 5th, 2025!</span>
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-5-5" duration={0.5} delay={3}>
                        <h1 className="text-3xl font-bold text-center text-black-950">our most active time of the day is</h1>
                    </FadeIn>
                    <FadeIn key="fadein-5-6" duration={0.5} delay={3.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">1am</span> with <span className="text-3xl font-extrabold text-white">34770 messages</span> since when we dated!!
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-5-7" duration={2} delay={4}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(6)}>damn bro</button>
                        </div>
                    </FadeIn>
                </div>
            )}

            {uiNumber === 6 && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-6-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">more fun facts!!</h1>
                    </FadeIn>
                    <FadeIn key="fadein-6-2" duration={1} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">the amount of &quot;i love you&quot;, &quot;i love u more&quot;, etc. messages sent since dating were</h1>
                    </FadeIn>
                    <FadeIn key="fadein-6-3" duration={1} delay={2.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">1241</span> messages with <span className="text-3xl font-extrabold text-white">659</span> from me and  <span className="text-3xl font-extrabold text-white">582</span> from you 
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-6-4" duration={1} delay={3.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">the amount of &quot;i miss u&quot;, etc. messages sent since dating were</h1>
                    </FadeIn>
                    <FadeIn key="fadein-6-5" duration={1} delay={4.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">384</span> messages with <span className="text-3xl font-extrabold text-white">211</span> from me and  <span className="text-3xl font-extrabold text-white">173</span> from you 
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-6-6" duration={1} delay={5.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">and the amount of goodnights over 77 days were</h1>
                    </FadeIn>
                    <FadeIn key="fadein-6-7" duration={1} delay={6.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">228</span> messages with <span className="text-3xl font-extrabold text-white">124</span> from me and  <span className="text-3xl font-extrabold text-white">104</span> from you 
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-6-8" duration={1} delay={7.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">finally, the amount of liked messages since dating were</h1>
                    </FadeIn>
                    <FadeIn key="fadein-6-9" duration={1} delay={8.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">8094</span> messages with <span className="text-3xl font-extrabold text-white">1892</span> from me and  <span className="text-3xl font-extrabold text-yellow-500">6202</span> from you 
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-6-10" duration={2} delay={9.5}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(7)}>wowza!</button>
                        </div>
                    </FadeIn>
                </div>
            )}

            {uiNumber === 7 && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-7-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">and for the final statistics, </h1>
                    </FadeIn>
                    <FadeIn key="fadein-7-2" duration={1} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">despite 8 hour gaps in sleeping, our average response times were</h1>
                    </FadeIn>
                    <FadeIn key="fadein-7-3" duration={1} delay={2.5}>
                        <p className="text-2xl font-bold text-center text-black-950">
                            <span className="text-4xl font-extrabold text-white">55.25s</span> for me and <span className="text-4xl font-extrabold text-white">57.52s</span> for you
                        </p>
                    </FadeIn>
                    <FadeIn key="fadein-7-4" duration={1} delay={3.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">and our most common words were (ignoring common words like &quot;i&quot;, &quot;a&quot;, &quot;and&quot;, etc.)</h1>
                    </FadeIn>
                    <FadeIn key="fadein-7-5" duration={1} delay={4.5}>
                        <textarea
                            readOnly
                            className="block mx-auto w-40 p-4 border border-gray-400 rounded-md bg-green-300 whitespace-pre-wrap shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar-track]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-gray-100
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-gray-300
                            dark:[&::-webkit-scrollbar-track]:bg-green-700
                            dark:[&::-webkit-scrollbar-thumb]:bg-green-500
                            "
                            style={{ height: '200px', overflowY: 'auto', resize: 'none' }}
                            value={`like: 10821
                            ur: 5464
                            okay: 4906
                            bro: 4562
                            wait: 2813
                            can: 2735
                            just: 2653
                            love: 2442
                            gonna: 2067
                            pause: 1886
                            nah: 1879
                            good: 1863
                            dont: 1839
                            get: 1697
                            wanna: 1590
                            yea: 1563
                            go: 1487
                            god: 1470
                            think: 1331
                            idk: 1325
                            flip: 1243
                            cause: 1233
                            thats: 1230
                            wtf: 1212
                            cute: 1206
                            jerk: 1202
                            one: 1195
                            oh: 1185
                            time: 1147
                            bad: 1140
                            cant: 1139
                            lmfao: 1127
                            yes: 1116
                            sorry: 1116
                            crazy: 1090
                            ff: 1089
                            jk: 1052
                            say: 1041
                            want: 1030
                            know: 1029
                            now: 1020
                            man: 1013
                            joking: 1010
                            much: 981
                            really: 960
                            whattt: 959
                            even: 898
                            facts: 884
                            hard: 875
                            maybe: 869`}
                        />
                    </FadeIn>
                    <FadeIn key="fadein-7-6" duration={1} delay={5.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">and thats everything!! </h1>
                    </FadeIn>
                    <FadeIn key="fadein-7-7" duration={2} delay={6.5}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => setUINumber(8)}>next</button>
                        </div>
                    </FadeIn>
                </div>
            )}
            {uiNumber === 8 && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-8-1" duration={1.5} delay={0}>
                        <h1 className="text-3xl font-bold text-center text-black-950">i hope you enjoyed this!!</h1>
                    </FadeIn>
                    <FadeIn key="fadein-8-2" duration={1} delay={1.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">in total, my datasets were about 5gb big!!</h1>
                    </FadeIn>
                    <FadeIn key="fadein-8-3" duration={1} delay={2.5}>
                        <h1 className="text-3xl font-bold text-center text-black-950">maybe i should continue doing these every once in a while i dunno</h1>
                    </FadeIn>
                    <FadeIn key="fadein-8-4" duration={2} delay={3.5}>
                        <div className="flex justify-center items-center space-x-4">
                            <button className="bg-green-600 hover:bg-green-400 text-gray-800 py-2 px-4 rounded-md shadow" onClick={onClose}>wow mark you are such a cool fella and you are the best ever </button>
                        </div>
                    </FadeIn>
                </div>


            )}
        </div>
    );
};