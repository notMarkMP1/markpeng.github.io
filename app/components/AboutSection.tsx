'use client';

import FadeInSection from "@/app/components/FadeInSection";
import Timeline from "@/app/components/Timeline";
import Projects from "@/app/components/Projects";

export default function AboutSection() {

  const timelineItems = [
    {
      date: "May 2025 - Aug. 2025", 
      title: "Full Stack Developer Intern",
      company: "Pulsenics", 
      description: "Developed firmware and automations for power electronics",
      link: "https://www.pulsenics.com/"
    },
    {
      date: "Feb. 2025 - Apr. 2025",
      title: "Software Engineer Intern",
      company: "Abundant Science",
      description: "Developed a proof-of-concept mobile app for rapid test analysis",
      link: "https://abundant.science"
    },
    {
      date: "Jun. 2022 - Jul. 2024",
      title: "Frontend Developer",
      company: "Toronto Model United Nations",
      description: "Designed and maintained tmun.ca",
      link: "https://tmun.ca"
    }
  ];

  const projectItems = [
    {
      title: "Personal Website",
      description: "A quick overview of my projects and experience.",
      technologies: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Three.js"],
      link: "https://github.com/notMarkMP1/markpeng.github.io",
      imagePath: "/images/personal_site.png"
    },
    {
      title: "reels-cli",
      description: "A command line tool that lets you watch Instagram reels straight from your terminal.",
      technologies: ["C", "Python", "FFmpeg", "Linux", "WSL"],
      link: "https://github.com/notMarkMP1/reels-cli",
      imagePath: "/images/reels-cli.png"
    },
    {
      title: "ProportionAI",
      description: "A hackathon webapp that uses time and AI to read and influence your study habits.",
      technologies: ["React", "Next.js", "Tailwind CSS", "MongoDB", "Node.js", "Terraform", "AWS"],
      link: "https://github.com/enxilium/proportion",
      imagePath: "/images/proportionai.png"
    },
    {
      title: "AutoClipUpload",
      description: "Personal utility to automatically upload clips from a game to YouTube.",
      technologies: ["Python", "Google Cloud", "OAuth2.0"],
      link: "https://github.com/notMarkMP1/AutoClipUpload",
      imagePath: "/images/autoclipupload.png",
    },
    {
      title: "DIY Pump it Up",
      description: "A DIY engineering project to play arcade game Pump it Up at home. Saved 40 dollars hacking an Arduino.",
      technologies: ["Arduino", "C/C++"],
      link: "https://github.com/notMarkMP1/DIYPumpItUp",
      imagePath: "/images/diypumpitup.png"
    },
    {    title: "FRC 2023-24 Robot Code",
      description: "The robot code for the 2023 and 2024 FRC seasons. Lead controls developer for 2023 and team captain for 2024.",
      technologies: ["Java", "WPILib", "Gradle"],
      link: "https://github.com/Team4308/CU-2023",
      imagePath: "/images/frc2023.png"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
      <div className="flex flex-col justify-center space-y-4">
        <FadeInSection>
          <h1 className="text-4xl font-bold">About</h1>
        </FadeInSection>
        <FadeInSection delay={0.2}>
          <p className="text-lg">a brief look about me</p>
        </FadeInSection>
        <FadeInSection delay={0.4}>
          <h2 className="text-2xl font-semibold">Timeline</h2>
        </FadeInSection>
        <FadeInSection delay={0.6}>
          <Timeline items={timelineItems} />
        </FadeInSection>
        <FadeInSection delay={0.8}>
          <h2 className="text-2xl font-semibold">Projects</h2>
        </FadeInSection>
        <FadeInSection delay={1.0}>
          <Projects items={projectItems} />
        </FadeInSection>
      </div>
    </div>
  );
}
