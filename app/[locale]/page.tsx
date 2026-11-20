import { Hero } from "@/components/Hero";
import { Couple, Story, Events, Gallery, Footer } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <Couple />
      <Story />
      <Events />
      <Gallery />
      <Footer />
    </main>
  );
}