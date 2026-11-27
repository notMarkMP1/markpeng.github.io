import FadeInSection from "@/app/components/FadeInSection";

export const metadata = {
  title: "Contact"
};

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <FadeInSection>
        <h1 className="text-[2.2rem] font-medium tracking-[0.01em] leading-[1.22] font-heading text-[var(--color-text-primary)]">Contact</h1>
      </FadeInSection>
      <FadeInSection delay={0.07}>
        <p className="text-[15.5px] leading-relaxed text-[var(--color-text-secondary)] mt-1.5">markminpeng [at] gmail [dot] com</p>
      </FadeInSection>
      <FadeInSection delay={0.14}>
        <h2 className="section-heading text-[1.35rem] mt-8 mb-2 font-medium tracking-[0.015em] font-heading text-[var(--color-text-primary)]">Website Credits</h2>
      </FadeInSection>
      <FadeInSection delay={0.2}>
        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
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
