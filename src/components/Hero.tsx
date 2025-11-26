import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-accent/10 px-6 py-20">
      <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Build Ventures You Don't Have to{" "}
          <span className="text-primary">Start from Scratch</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-serif">
          Run multiple businesses like a founder. Backed by shared operations. 
          Scale revenue across Africa's most exciting industries.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link to="/apply">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 group"
            >
              Apply as a Venture Operator
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/industries">
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
            >
              Learn About Our Ventures
            </Button>
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">5+</div>
            <div className="text-sm text-muted-foreground">Active Ventures</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">Multiple</div>
            <div className="text-sm text-muted-foreground">Industries Covered</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">Equity</div>
            <div className="text-sm text-muted-foreground">+ Stable Salary</div>
          </div>
        </div>
      </div>
    </section>
  );
};
