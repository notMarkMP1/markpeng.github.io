import FadeInSection from "@/app/components/FadeInSection";

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <FadeInSection delay={0.2}>
        <h1 className="text-3xl font-bold">Hello world!</h1>
      </FadeInSection>
      <FadeInSection>
        <h1 className="text-3xl font-bold">Hello world!</h1>
      </FadeInSection>
      <FadeInSection>
        <h1 className="text-3xl font-bold">Hello world!</h1>
      </FadeInSection>
    </div>
  );
}
