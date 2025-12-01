import { useSiteContent } from "@/hooks/useSiteContent";

export const About = () => {
  const { content } = useSiteContent('about');

  const headline = content.about_headline || 'We build and scale African companies with global standards';
  const description = content.about_description || 'verigo54 is a venture studio building multiple businesses across food, media & creative production, logistics, commerce infrastructure, and travel. We provide shared backend operations so operators can focus on growth and execution.';
  const opsTitle = content.about_ops_title || 'Shared Operations';
  const opsDesc = content.about_ops_description || 'Accounting, legal, HR, branding, marketing, finance, creative production, tech tools, and logistics support.';
  const growthTitle = content.about_growth_title || 'Focus on Growth';
  const growthDesc = content.about_growth_description || 'Operators focus on revenue growth, team leadership, customer experience, and execution — not backend systems.';
  const venturesTitle = content.about_ventures_title || 'Multiple Ventures';
  const venturesDesc = content.about_ventures_description || "You're not joining one business — you'll grow multiple ventures over time with studio backing.";

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-8">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            {headline}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mt-20">
          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">{opsTitle}</div>
            <p className="text-base text-foreground/80">
              {opsDesc}
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">{growthTitle}</div>
            <p className="text-base text-foreground/80">
              {growthDesc}
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">{venturesTitle}</div>
            <p className="text-base text-foreground/80">
              {venturesDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
