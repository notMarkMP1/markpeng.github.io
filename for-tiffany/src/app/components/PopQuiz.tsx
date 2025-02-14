import { useState, useEffect } from "react";
import FadeIn from '@/app/components/FadeIn';

interface PopQuizProps {
    onClose: () => void;
}

export default function PopQuiz({ onClose }: PopQuizProps) {
    const [questionNumber, setQuestionNumber] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [message, setMessage] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);

    function nextQuestion(){
        setQuestionNumber(questionNumber + 1);
        setMessage(false);
    }

    function handleCorrectAnswer() {
        setMessage(true);
        setWasCorrect(true);
        if (questionNumber === 7 || questionNumber === 8) {
            setCorrectAnswers(correctAnswers + 2);
        }else if (questionNumber === 9){
            setCorrectAnswers(correctAnswers + 3);            
        }else if (questionNumber === 10){
            setCorrectAnswers(correctAnswers + 5);
            setQuestionNumber(11);
            setMessage(false);
        }
        else{
            setCorrectAnswers(correctAnswers + 1);
        }
    }

    function handleWrongAnswer() {
        setMessage(true);
        setWasCorrect(false);
        if (questionNumber === 10){
            setCorrectAnswers(correctAnswers - 2);
            setQuestionNumber(11);
            setMessage(false);
        }
    }



    useEffect(() => {
        const originalColor = document.body.style.backgroundColor;
        const originalTransition = document.body.style.transition;
        document.body.style.transition = "background-color 1s ease-in-out";
        document.body.style.backgroundColor = "#fe4d4d";
        return () => {
            document.body.style.backgroundColor = originalColor;
            document.body.style.transition = originalTransition;
        };
    }, []);

    return (
        <>
            <div className="absolute top-0 right-0 m-4 text-5xl font-bold">
                Score: {correctAnswers}
            </div>
            <div className="justify-center items-center space-y-12">
                {message && (
                    <div className="flex flex-col items-center space-y-4">
                        {wasCorrect ? (
                            <>
                                <h1 className="text-6xl font-bold text-black">NICEEEEE</h1>
                                <img className="w-64" src="images\happy basil.jpg" alt="nice" />
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold text-black">ERRRR ALL GOOD</h1>
                                <img className="w-64" src="images\sad basil.jpg" alt="uhoh" />
                            </>
                        )}
                        <button className="bg-blue-500 hover:bg-blue-400 text-white py-2 px-4 rounded-md shadow" onClick={nextQuestion}>
                            next question
                        </button>
                    </div>
                )}
                {questionNumber === 0 && (
                    <div className="justify-center items-center space-y-2">
                        <FadeIn key="fadein-0-1" duration={1.5}>
                            <h1 className="text-6xl font-bold text-center text-black">SURPRISE POP QUIZ!!</h1>
                        </FadeIn>
                        <FadeIn key="fadein-0-2" duration={1.5} delay={1.5}>
                            <h1 className="text-6xl font-bold text-center text-black">how well do you know your boyfriend???</h1>
                        </FadeIn>
                        <FadeIn key="fadein-0-3" duration={3} delay={3}>
                            <div className="flex justify-center items-center space-x-4">
                                <button className="bg-red-600 hover:bg-red-400 text-white py-2 px-4 rounded-md shadow" onClick={nextQuestion}>
                                    start
                                </button>
                            </div>
                        </FadeIn>
                    </div>
                )}
                {questionNumber === 1 && !message && (
                    <div className="justify-center items-center space-y-2">
                        <FadeIn key="fadein-1-1" duration={1.5}>
                            <h1 className="text-6xl font-bold text-center text-black">QUESTION 1: WHAT IS MY FAVOURITE COLOUR??</h1>
                        </FadeIn>
                        <FadeIn key="fadein-1-2" duration={1.5} delay={1.5}>
                            <div className="flex justify-center">
                                <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                    red
                                </button>
                                <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                    green
                                </button>
                                <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                    yellow
                                </button>
                                <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                    blue
                                </button>
                            </div>
                        </FadeIn>
                    </div>
                )}
                {questionNumber === 2 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-2-1" duration={1.5}>
                        <h1 className="text-6xl font-bold text-center text-black">QUESTION 2: HOW TALL AM I</h1>
                    </FadeIn>
                    <FadeIn key="fadein-2-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                5&#39;5
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                5&#39;6
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                6&#39;0
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                5&#39;8
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 3 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-3-1" duration={1.5}>
                        <h1 className="text-6xl font-bold text-center text-black">QUESTION 3: WHEN DID WE START DATING</h1>
                    </FadeIn>
                    <FadeIn key="fadein-3-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                November 11 2024
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                November 23 2023
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                Novemeber 23 2024
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                November 32 2024
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 4 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-4-1" duration={1.5}>
                        <h1 className="text-6xl font-bold text-center text-black">QUESTION 4: PICK THE WRONG ANSWER</h1>
                    </FadeIn>
                    <FadeIn key="fadein-4-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                I am left handed
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                I was not born in Canada but am a citizen
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                i won a music competition in like grade 4
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                i am good at valorant
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 5 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-5-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-6xl font-bold text-center text-black">QUESTION 5: determine the degree of the following polynomial function</h1>
                        <img className="w-64" src="images\graph.png" alt="polynomial" />
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-5-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                3
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                4
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                5
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                6
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 6 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-6-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">QUESTION 6: A bat and ball cost $1.10. The bat costs one dollar more than the ball. How much does the ball cost?</h1>
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-6-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                10 cents
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                0.05 cents
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                100 cents
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                5 cents
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 7 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-7-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">(worth 2) QUESTION 7: what was the most messages we sent in a day in the past year?</h1>
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-7-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                2024-11-11
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                2024-11-23
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                2024-11-25
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                2025-1-08
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 8 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-8-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">(worth 2) QUESTION 8: whats my highscore on instagram pong</h1>
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-8-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                28
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                30
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                35
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                38
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 9 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-9-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">(worth 3) QUESTION 9: solve for the following limit</h1>
                        <img className="w-32" src="images\equation.png" alt="equation" />
                        
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-7-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                -∞
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                ∞
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                DNE
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                1
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 10 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-10-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">(worth 5) QUESTION 10: am i a good boyfriend</h1>
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-10-2" duration={1.5} delay={1.5}>
                        <div className="flex justify-center">
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                yes
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                yes
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleCorrectAnswer}>
                                yes
                            </button>
                            <button className="bg-gray-300 hover:bg-gray-200 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={handleWrongAnswer}>
                                no
                            </button>
                        </div>
                    </FadeIn>
                </div>
                )}
                {questionNumber === 11 && !message && (
                <div className="justify-center items-center space-y-2">
                    <FadeIn key="fadein-11-1" duration={1.5}>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-4xl font-bold text-center text-black">you have finished my exam!! your score was {correctAnswers}</h1>
                        <h1 className="text-4xl font-bold text-center text-black">you can use your score to claim points. more details later!!</h1>
                    </div>
                    </FadeIn>
                    <FadeIn key="fadein-11-2" duration={1.5} delay={1.5}>
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <form action="https://send.pageclip.co/EMfE2oikzn8tEke5WtsiNwUY21Umz2sw" className="pageclip-form" method="post">
                                <input type="hidden" name="score" readOnly value={correctAnswers} />
                                <div className="flex justify-center items-center">
                                    <button type="submit" className="pageclip-form__submit bg-gray-300 text-black font-bold text-xl py-4 px-8 rounded mx-2" onClick={onClose}>
                                        <span>send</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                </div>
                )}
            </div>
        </>
    )
}