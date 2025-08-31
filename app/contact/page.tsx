import FadeInSection from "@/app/components/FadeInSection";

export const metadata = {
  title: "Contact"
};

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <FadeInSection>
        <h1 className="text-3xl font-bold font-heading">Contact</h1>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <p className="text-lg">markminpeng [at] gmail [dot] com</p>
      </FadeInSection>
      <FadeInSection delay={0.4}>
        <h1 className="text-xl mt-4 font-bold font-heading">Website Credits</h1>
      </FadeInSection>
      <FadeInSection delay={0.6}>
         <p>
          can be found on the{" "}
          <a href="https://github.com/notMarkMP1/markpeng.github.io" 
          target="_blank" style={{ color: 'var(--color-primary)' }}
          className="hover:text-blue-400 transition-colors duration-200">
            website repostitory
          </a>
        </p>
      </FadeInSection>

    </div>
  );
}
