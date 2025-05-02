import FadeInSection from "@/app/components/FadeInSection";
import Image from "next/image";
export default function Home() {
  return (
    <>
    <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] justify-center space-y-2 py-4">
      <FadeInSection>
        <h1 className="text-6xl text-center font-bold">hello, i&apos;m Mark Peng!</h1>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <p className="text-lg text-center mx-4">
          An aspiring software engineer and current student at the University of Toronto studying computer science.
        </p>
      </FadeInSection>
      <div className="flex flex-row items-center justify-center space-x-4">
        <FadeInSection delay={0.4}>
          <a className="bg-zinc-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center w-12 h-12" href="resume.pdf" target="_blank" rel="noopener noreferrer">
            <Image src="./file.svg" alt="resume" width={28} height={28}/>
          </a>
        </FadeInSection>
        <FadeInSection delay={0.5}>
          <a className="bg-zinc-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center w-12 h-12" href="https://linkedin.com/in/markminpeng" target="_blank" rel="noopener noreferrer">
            <Image src="./linkedin.svg" alt="LinkedIn" width={28} height={28}/>
          </a>
        </FadeInSection>
        <FadeInSection delay={0.6}>
          <a className="bg-zinc-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center w-12 h-12" href="https://github.com/notMarkMP1" target="_blank" rel="noopener noreferrer">
            <Image src="./github.svg" alt="GitHub" width={28} height={28}/>
          </a>
        </FadeInSection>
      </div>
    </div>
    </>
  );
}
