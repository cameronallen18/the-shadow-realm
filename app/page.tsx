import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6">
      {/* Splash — vertically centered in viewport */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center max-w-lg w-full">
        <h1 className="heading-gradient lowercase tracking-tight leading-none">
          the shadow realm
        </h1>
        <p className="text-[#ededed]/60 text-sm tracking-wide">
          my digital junk drawer
        </p>
        <p className="text-[#ededed]/30 text-xs tracking-wide">
          v0.1.20
        </p>
      </div>

      {/* Project catalog */}
      <section className="w-full max-w-lg pb-24">
        <h2 className="text-[#ededed]/40 text-xs uppercase tracking-widest mb-8">
          projects
        </h2>
        <ul className="flex flex-col gap-6">
          {projects.map((project) => (
            <li key={project.slug}>
              <a href={project.href} className="block">
                <span className="text-[#ededed] text-sm font-medium">
                  {project.name}
                </span>
                <p className="text-[#ededed]/40 text-sm mt-1">
                  {project.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
