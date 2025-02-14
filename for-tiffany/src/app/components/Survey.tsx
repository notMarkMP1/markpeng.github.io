import { useState, useEffect } from 'react';

interface SurveyProps {
    onClose: () => void;
}


export default function Survey({ onClose }: SurveyProps) {
    const [questionNumber, setQuestionNumber] = useState(0);
    const [noButtonStyle, setNoButtonStyle] = useState({});
    const [yesButtonStyle, setYesButtonStyle] = useState({});
    const [buttonSize, setButtonSize] = useState(128);
    const [yesButtonSize, setYesButtonSize] = useState([128, 44]);
    const [showButton, setShowButton] = useState(true);

    function setNextQuestion(number: number) : void {
        setNoButtonStyle({});
        setYesButtonStyle({});
        setButtonSize(128);
        setYesButtonSize([128, 44]);
        setShowButton(true);
        setQuestionNumber(number);
    }



    const FadeScreen = () => {
            const [fade, setFade] = useState(true);
            useEffect(() => {
                const fadeTimeout = setTimeout(() => setFade(false), 2000);
                const nextQuestionTimeout = setTimeout(() => {
                    setQuestionNumber(questionNumber + 1);
                }, 3000);
        
                return () => {
                    clearTimeout(fadeTimeout);
                    clearTimeout(nextQuestionTimeout);
                };
            }, []);
            if (questionNumber === 2){
                return (
                    <div
                        className="flex flex-col justify-center items-center h-screen transition-opacity duration-2000"
                        style={{ opacity: fade ? 1 : 0 }}
                    >
                        <h1 className="text-5xl font-bold mb-4">thank you i love you too 😋😋😋😊😊</h1>
                        <img src="/images/rose.jpg" alt="Thank you" className="w-64 h-64" />
                    </div>
                );

            }
            if (questionNumber === 4){
                return (
                    <div
                        className="flex flex-col justify-center items-center h-screen transition-opacity duration-2000"
                        style={{ opacity: fade ? 1 : 0 }}
                    >
                        <h1 className="text-5xl font-bold mb-4">happy valentines!!</h1>
                        <img src="/images/chewchan_love.png" alt="love you" className="w-64 h-64" />
                    </div>
                );
            }
        };
    
    const teleportNoButton = () => {
        const buttonWidth = buttonSize;
        const buttonHeight = 48; 
        
        const randomX = Math.floor(Math.random() * (window.innerWidth - buttonWidth));
        const randomY = Math.floor(Math.random() * (window.innerHeight - buttonHeight));

        setNoButtonStyle({
            position: 'fixed',
            left: `${randomX}px`,
            top: `${randomY}px`,
            width: `${buttonWidth}px`,
            height: `${buttonHeight}px`,
            fontSize: `${buttonSize / 4}px`,
            margin: '0px'
        });


        setYesButtonStyle({
            width: `${yesButtonSize[0]}px`,
            height: `${yesButtonSize[1]}px`,
            fontSize: `${yesButtonSize[0] / 4}px`,
            margin: '0px'
        });

        // Decrease the button size
        
        if (buttonSize === 32) {
            setNoButtonStyle({
                padding: '0px',
            })
        }

        console.log(buttonSize, showButton);

        if (buttonSize <= 32) {
            setShowButton(false);
        }else{
            setYesButtonSize([yesButtonSize[0] + 128, yesButtonSize[1] + 48]);
            setButtonSize(prevSize => prevSize - 32);
        }
        
    };

    if (questionNumber === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-6xl font-bold text-center">
                    <div>you must fill this survey to continue</div>
                    <div className="flex flex-row justify-center mt-6 space-x-4">
                        <button
                            className="text-3xl bg-yellow-400 hover:bg-yellow-300 text-white py-1 px-6 rounded-md shadow"
                            onClick={() => setQuestionNumber(1)}
                        >
                            yes sir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (questionNumber === 1) {
        return (
            <div className="flex justify-center items-center h-screen relative">
                <div className="text-6xl font-bold text-center">
                    <div>FIRST QUESTION: do you love me</div>
                    <div className="flex flex-row justify-center mt-6 space-x-4">
                        <button
                            className="text-3xl bg-green-400 hover:bg-green-300 text-white py-1 px-6 w-32 rounded-md shadow"
                            style={yesButtonStyle}
                            onClick={() => {
                                setNextQuestion(2);
                            }}
                        >
                            yes
                        </button>
                        {showButton && (
                            <button
                                className="text-3xl bg-red-500 hover:bg-red-400 text-white py-1 px-6 w-32 rounded-md shadow"
                                style={noButtonStyle}
                                onClick={teleportNoButton}
                            >
                                no
                                
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (questionNumber === 2 || questionNumber === 4) {

        return <FadeScreen />;

    }

    if (questionNumber === 3) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-6xl font-bold text-center">
                    <div>SECOND QUESTION: am i a good valentines </div>
                    <div className="flex flex-row justify-center mt-6 space-x-4">
                        <button
                            className="text-3xl bg-green-400 hover:bg-green-300 text-white py-1 px-6 rounded-md shadow"
                            style={yesButtonStyle}
                            onClick={() => {
                                setNextQuestion(4);
                            }}
                        >
                            yea
                        </button>
                        {(showButton && <button
                            className="text-3xl bg-red-500 hover:bg-red-400 text-white py-1 px-6 rounded-md shadow"
                            style={noButtonStyle}
                            onClick={teleportNoButton}
                        >
                            no
                        </button>)}
                    </div>
                </div>
            </div>
        );
    }

    if (questionNumber === 5) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-6xl font-bold text-center">
                    <div>FINAL QUESTION: am i good boyfriend </div>
                    <div className="flex flex-row justify-center mt-6 space-x-4">
                        <button
                            className="text-3xl bg-green-400 hover:bg-green-300 text-white py-1 px-6 rounded-md shadow"
                            style={yesButtonStyle}
                            onClick={() => {
                                setNextQuestion(6);
                            }}
                        >
                            yes
                        </button>
                        {(showButton && <button
                            className="text-3xl bg-red-500 hover:bg-red-400 text-white py-1 px-6 rounded-md shadow"
                            style={noButtonStyle}
                            onClick={teleportNoButton}
                        >
                            no
                        </button>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-6xl font-bold text-center ">
                YUPPP factttssss thank you  
                <div className="text-2xl mt-4">okay now that the ice is broken for real </div>
                <div className="text-2xl mt-4"> thank you for being the best girlfriend in the whole world </div>
                <div className="text-2xl mt-2">i love you SOOSOSOSO MUCH and you make me so happy through everything</div>
                <div className="text-2xl mt-2">you are the most caring loving sweet girlfriend who i can talk to hours on end and feel so happy every single time</div>
                <div className="text-2xl mt-2">like i CANT PUT MY GRATITUDE INTO WORDS I JUST GENUJINEELY LOVE YOU SO MUCH ITS CRAZY I LOVE YOU </div>
                <div className="text-2xl mt-2">HAPPY VALENTINES DAY!! 🥰🥰😻😻</div>
                <div className="text-2xl mt-2">theres a lot more to this website, i hope you like it!!!!</div>
                <div className="text-2xl mt-2">next up: texting wrapped</div>
                <button
                    className="text-3xl bg-green-500 hover:bg-green-400 text-white py-1 px-4 rounded-md shadow mt-4"
                    onClick={onClose}
                >
                    get my wrapped!
                </button>
            </div>
        </div>
    );
}