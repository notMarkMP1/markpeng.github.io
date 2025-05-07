import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] justify-center text-center">
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <p className="mt-4 text-lg">you got me, this page doesn't exist :P</p>
            <Link href="/" className="mt-4 text-blue-500 hover:text-blue-300 transition duration-300 ease-in-out">Go back to Home</Link>
        </div>
    )
}