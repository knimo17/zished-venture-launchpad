export const Footer = () => {
  return (
    <footer className="border-t py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">ZISHED<span className="text-accent">.</span></h3>
            <p className="text-sm text-muted-foreground">
              We Build African Companies With Global Standards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <a 
              href="mailto:team@zished.com" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              team@zished.com
            </a>
            
            <div className="flex gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                Twitter
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Zished Innovation Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
