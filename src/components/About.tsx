import { Card } from "@/components/ui/card";
import { Briefcase, Users, Zap } from "lucide-react";

export const About = () => {
  return (
    <section className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">About Zished Innovation Studio</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
            A venture studio building and scaling multiple businesses across Africa in food, media & creative production, 
            logistics, agriculture, and travel.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Shared Operations</h3>
            <p className="text-muted-foreground">
              Accounting, legal, HR, branding, marketing, finance oversight, creative production, tech tools, and logistics support.
            </p>
          </Card>

          <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold">Focus on Growth</h3>
            <p className="text-muted-foreground">
              Operators focus on revenue growth, team leadership, customer experience, and execution — not backend systems.
            </p>
          </Card>

          <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Scale Multiple Ventures</h3>
            <p className="text-muted-foreground">
              You're not joining ONE business — you'll grow multiple ventures over time with studio backing.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
