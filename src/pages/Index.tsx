import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Role } from "@/components/Role";
import { Industries } from "@/components/Industries";
import { Ideal } from "@/components/Ideal";
import { Process } from "@/components/Process";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Role />
      <Industries />
      <Ideal />
      <Process />
      <ApplicationForm />
      <Footer />
    </div>
  );
};

export default Index;
