import { Badge } from "@/components/ui/badge";

export const Ideal = () => {
  const coreTraits = [
    "Get things done under pressure",
    "Love systems and structure",
    "Can manage a P&L, staff, and customers",
    "Can scale revenue — not just ideas",
    "Want equity and ownership, not just a job"
  ];

  const bonusExperience = [
    "F&B", "Travel", "Supply Chain", "Startups", 
    "Project Management", "Marketing", "Operations", 
    "Media Production", "Product Launches", "Business Strategy"
  ];

  return (
    <section className="py-32 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-6 mb-20">
          <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            WHO WE WANT
          </div>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            Builders. Operators. Problem-solvers.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h3 className="text-xl font-medium">Core traits</h3>
            <ul className="space-y-3 text-foreground/80">
              {coreTraits.map((trait, index) => (
                <li key={index}>• {trait}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-medium">Bonus experience</h3>
            <p className="text-sm text-muted-foreground italic">(not required, but helpful)</p>
            <div className="flex flex-wrap gap-2">
              {bonusExperience.map((exp, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
