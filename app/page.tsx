import FadeInSection from "@/app/components/FadeInSection";

export default function Home() {
  return (
    <>
    <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] justify-center space-y-2 py-4">
      <FadeInSection>
        <h1 className="text-6xl text-center font-bold">hello, i'm Mark Peng!</h1>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <h1 className="text-lg text-center">An aspiring software engineer and current student at the University of Toronto studying computer science. </h1>
      </FadeInSection>
    </div>
    </>
  );
}
