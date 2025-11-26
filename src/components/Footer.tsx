import { Mail, Linkedin, Twitter, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Zished Innovation Studio</h3>
          <p className="text-lg font-serif opacity-90">
            We Build African Companies With Global Standards.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-6">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>

          <a 
            href="mailto:team@zished.com" 
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>team@zished.com</span>
          </a>
        </div>

        <div className="text-center pt-8 border-t border-secondary-foreground/20 text-sm opacity-75">
          <p>© {new Date().getFullYear()} Zished Innovation Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
