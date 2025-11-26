import { Card } from "@/components/ui/card";
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
    <section className="py-24 px-6 bg-secondary/5">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Who We Want</h2>
          <p className="text-xl text-muted-foreground font-serif">
            Builders. Operators. Problem-solvers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 space-y-6">
            <h3 className="text-2xl font-bold text-primary">Core Traits</h3>
            <p className="text-muted-foreground">People who:</p>
            <ul className="space-y-3">
              {coreTraits.map((trait, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <span className="text-lg">{trait}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8 space-y-6">
            <h3 className="text-2xl font-bold text-accent">Bonus Experience</h3>
            <p className="text-muted-foreground italic">(not required, but helpful)</p>
            <div className="flex flex-wrap gap-2">
              {bonusExperience.map((exp, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {exp}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
