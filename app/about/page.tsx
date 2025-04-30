import FadeInSection from "@/app/components/FadeInSection";

export default function about() {
  return (
    <div className="flex flex-col justify-center">
      <FadeInSection>
        <h1 className="text-4xl font-bold">About</h1>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <h1 className="text-lg">learn about my developer history</h1>
      </FadeInSection>
    </div>
  );
}
