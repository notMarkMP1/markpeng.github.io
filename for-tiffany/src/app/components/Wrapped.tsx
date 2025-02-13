
export default function Wrapped() {
    const handleClick = (buttonName: string) => {
        console.log(`${buttonName} clicked`);
    };

    return (
        <div className="justify-center items-center space-y-12">
            <h1 className="text-6xl font-bold text-center text-blue-950">get your wrapped</h1>
            <div className= "flex justify-center items-center space-x-4">
                <button className="bg-red-300 hover:bg-red-200 text-gray-800 py-2 px-4 rounded-md shadow" onClick={() => handleClick('Button 2')}>start</button>

            </div>
        </div>
    );
};
