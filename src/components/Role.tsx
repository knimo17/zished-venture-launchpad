import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const Role = () => {
  const responsibilities = [
    "Manage day-to-day operations",
    "Grow revenue and optimize customer experience",
    "Lead teams and make strategic decisions",
    "Innovate products and iterate quickly",
    "Own the P&L and hit growth targets"
  ];

  return (
    <section className="py-24 px-6 bg-secondary/5">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4">
          <Badge className="mb-4" variant="outline">We're Hiring</Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Venture Operator</h2>
          <p className="text-xl text-muted-foreground font-serif max-w-3xl">
            A hands-on builder who can take a brand and run it like a founder. 
            You'll operate with autonomy, backed by world-class infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">What You'll Do</h3>
            <ul className="space-y-4">
              {responsibilities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Compensation Structure</h3>
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-lg border">
                <h4 className="font-semibold text-lg mb-2">Base Salary</h4>
                <p className="text-muted-foreground">Stable monthly income to keep you focused</p>
              </div>
              <div className="p-6 bg-card rounded-lg border">
                <h4 className="font-semibold text-lg mb-2">Studio Stock Options</h4>
                <p className="text-muted-foreground">4-year vesting, 1-year cliff in the studio</p>
              </div>
              <div className="p-6 bg-card rounded-lg border">
                <h4 className="font-semibold text-lg mb-2">Venture Equity</h4>
                <p className="text-muted-foreground">Additional equity if you scale from scratch or hit major KPIs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
