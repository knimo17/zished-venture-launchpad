import { Card } from "@/components/ui/card";

export const Industries = () => {
  const industries = [
    {
      title: "Food & Retail",
      description: "Online food brands & retail kitchens"
    },
    {
      title: "Media & Production",
      description: "Creative production & media tech"
    },
    {
      title: "Logistics",
      description: "Supply chain & delivery solutions"
    },
    {
      title: "Travel",
      description: "Travel & experiences across Africa"
    },
    {
      title: "Agriculture",
      description: "Sustainable infrastructure & agtech"
    }
  ];

  return (
    <section className="py-32 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-6 mb-20">
          <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            FOCUS AREAS
          </div>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            Industries we build in
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
          {industries.map((industry, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-xl font-medium">{industry.title}</h3>
              <p className="text-muted-foreground">{industry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
