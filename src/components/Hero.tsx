import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

export const Hero = () => {
  const { content, loading } = useSiteContent('hero');

  const label = content.hero_label || 'VENTURE STUDIO';
  const headline = content.hero_headline || "Build ventures you don't have to start from scratch";
  const cta = content.hero_cta || 'Build with us';

  return (
    <section className="relative min-h-[90vh] flex items-center px-6 py-24 overflow-hidden">
      {/* Gradient Blobs */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-radial from-cyan-200/40 via-transparent to-transparent blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-green-200/40 via-transparent to-transparent blur-3xl rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-yellow-200/40 via-transparent to-transparent blur-3xl rounded-full" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-4xl space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
              {label}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.1]">
              {headline}
            </h1>
          </div>
          
          <div className="pt-6">
            <Link to="/apply">
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12 text-base"
              >
                {cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
