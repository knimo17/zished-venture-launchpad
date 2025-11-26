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
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-6 mb-20">
          <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            SELECTION PROCESS
          </div>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            We're looking for excellence
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="space-y-4">
              <div className="text-4xl font-light text-muted-foreground">{step.number}</div>
              <div>
                <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
