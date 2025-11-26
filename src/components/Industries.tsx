import { Card } from "@/components/ui/card";
import { UtensilsCrossed, Film, Truck, Plane, Sprout } from "lucide-react";

export const Industries = () => {
  const industries = [
    {
      icon: UtensilsCrossed,
      title: "Food & Retail",
      description: "Online food brands & retail kitchens"
    },
    {
      icon: Film,
      title: "Media & Production",
      description: "Creative production & media tech"
    },
    {
      icon: Truck,
      title: "Logistics",
      description: "Logistics solutions & supply chain"
    },
    {
      icon: Plane,
      title: "Travel",
      description: "Travel & experiences across Africa"
    },
    {
      icon: Sprout,
      title: "Agriculture",
      description: "Sustainable infrastructure & agtech"
    }
  ];

  return (
    <section id="industries" className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Industries We Build In</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
            We're building the future of African business across multiple high-growth sectors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card 
                key={index} 
                className="p-6 space-y-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{industry.title}</h3>
                <p className="text-muted-foreground">{industry.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
