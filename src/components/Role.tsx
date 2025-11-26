export const Role = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
              VENTURE OPERATOR
            </div>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
              Run businesses like a founder, backed by infrastructure
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A hands-on builder who can take a brand and run it like a founder. You'll operate with autonomy, 
              backed by world-class infrastructure.
            </p>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h3 className="text-2xl font-medium">What you'll do</h3>
            <ul className="space-y-4 text-foreground/80">
              <li>• Manage day-to-day operations</li>
              <li>• Grow revenue and optimize customer experience</li>
              <li>• Lead teams and make strategic decisions</li>
              <li>• Innovate products and iterate quickly</li>
              <li>• Own the P&L and hit growth targets</li>
            </ul>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-medium">Compensation</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-1">Base Salary</h4>
                <p className="text-sm text-muted-foreground">Stable monthly income</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Studio Stock Options</h4>
                <p className="text-sm text-muted-foreground">4-year vesting, 1-year cliff</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Venture Equity</h4>
                <p className="text-sm text-muted-foreground">Additional equity for scaling from scratch or hitting KPIs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
