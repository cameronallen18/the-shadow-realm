export interface Project {
  slug: string;
  name: string;
  description: string;
  href: string;
}

export const projects: Project[] = [
  {
    slug: "math-flashcards",
    name: "math flash cards",
    description: "arithmetic practice for kids. addition, subtraction, multiplication.",
    href: "/projects/math-flashcards",
  },
  {
    slug: "samus-run",
    name: "samus run",
    description: "norfair escape. dodge the rock walls.",
    href: "/projects/samus-run",
  },
];
