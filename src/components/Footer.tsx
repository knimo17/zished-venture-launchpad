export const Footer = () => {
  return (
    <footer className="border-t py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">verigo54<span className="text-accent">.</span></h3>
            <p className="text-sm text-muted-foreground">
              We Build African Companies With Global Standards.
            </p>
          </div>

          <a 
            href="mailto:build@verigo54.com" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            build@verigo54.com
          </a>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} verigo54. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
