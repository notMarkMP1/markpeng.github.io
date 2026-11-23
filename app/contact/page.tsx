import FadeInSection from "@/app/components/FadeInSection";

export const metadata = {
  title: "Contact"
};

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <FadeInSection>
        <h1 className="text-3xl font-bold font-heading text-[var(--color-text-primary)]">Contact</h1>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <p className="text-lg text-[var(--color-text-secondary)] mt-1">markminpeng [at] gmail [dot] com</p>
      </FadeInSection>
      <FadeInSection delay={0.4}>
        <h2 className="text-xl mt-6 font-bold font-heading text-[var(--color-text-primary)]">Website Credits</h2>
      </FadeInSection>
      <FadeInSection delay={0.6}>
        <p className="text-[var(--color-text-secondary)] mt-1">
          can be found on the{" "}
          <a
            href="https://github.com/notMarkMP1/markpeng.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] underline-offset-4 hover:underline transition-colors duration-200"
          >
            website repository
          </a>
        </p>
      </FadeInSection>
    </div>
  );
}
