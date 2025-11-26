import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

export const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-primary-foreground py-3 px-6 text-center text-sm relative">
      <p>
        <strong>Venture Operators:</strong> Join verigo54 & Build African Companies With Global Standards |{" "}
        <Link to="/apply" className="underline hover:no-underline">
          Apply Now
        </Link>
      </p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
        aria-label="Close announcement"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
