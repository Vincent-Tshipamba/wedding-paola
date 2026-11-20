import { Hero } from "@/components/Hero";
import { Couple, Story, Events, Gallery, Footer, Marquee, Together } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      {/* <Navbar /> */}
      <Hero />
      <Marquee />
      <Couple />
      <Together />
      <Story />
      <Events />
      <Gallery />
      <Footer />
    </main>
  );
}