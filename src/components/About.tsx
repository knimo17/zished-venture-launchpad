import { Card } from "@/components/ui/card";

export const About = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-8">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            We build and scale African companies with global standards
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            verigo54 is a venture studio building multiple businesses across food, media & creative production, 
            logistics, commerce infrastructure, and travel. We provide shared backend operations so operators can focus on growth and execution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mt-20">
          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Shared Operations</div>
            <p className="text-base text-foreground/80">
              Accounting, legal, HR, branding, marketing, finance, creative production, tech tools, and logistics support.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Focus on Growth</div>
            <p className="text-base text-foreground/80">
              Operators focus on revenue growth, team leadership, customer experience, and execution — not backend systems.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Multiple Ventures</div>
            <p className="text-base text-foreground/80">
              You're not joining one business — you'll grow multiple ventures over time with studio backing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
