import { ArrowRight } from "lucide-react";

export const Process = () => {
  const steps = [
    {
      number: "01",
      title: "Application",
      description: "Send application + answers to 6 questions"
    },
    {
      number: "02",
      title: "Task Challenge",
      description: "Solve a real-world operational problem"
    },
    {
      number: "03",
      title: "Interview",
      description: "Interview + working session with the team"
    },
    {
      number: "04",
      title: "Offer",
      description: "Offer + onboarding to your first venture"
    }
  ];

  return (
    <section className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Selection Process</h2>
          <p className="text-xl text-muted-foreground font-serif max-w-3xl mx-auto">
            We're looking for excellence. Our process is designed to identify operators who can thrive.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="space-y-4">
                <div className="text-6xl font-bold text-primary/20">{step.number}</div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-8 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
