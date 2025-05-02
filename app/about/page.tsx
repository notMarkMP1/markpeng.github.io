import FadeInSection from "@/app/components/FadeInSection";

export default function about() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <div className="flex flex-col justify-center">
        <FadeInSection>
          <h1 className="text-4xl font-bold">About (WIP)</h1>
        </FadeInSection>
        <FadeInSection delay={0.2}>
          <h1 className="text-lg">learn about my developer history</h1>
        </FadeInSection>
      </div>
    </div>
  );
}
