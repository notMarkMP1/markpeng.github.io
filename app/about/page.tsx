import FadeInSection from "@/app/components/FadeInSection";
import Timeline from "@/app/components/Timeline";
import Projects from "../components/Projects";


export default function About() {

  const timelineItems = [
    {
      date: "May 2025 - Now", 
      title: "Full Stack Developer Intern",
      company: "Pulsenics", 
      description: "⭐",
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
      title: "Project 1",
      description: "Description of project 1",
      technologies: ["React", "Node.js"],
      link: "https://github.com/notMarkMP1",
      imagePath: "/images/project1.jpg"
    },
    {
      title: "Project 2",
      description: "Description of project 2",
      technologies: ["Next.js", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS", "Tailwind CSS"],
      link: "https://github.com/notMarkMP1",
      imagePath: "/images/project1.jpg"
    }
  ]

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
