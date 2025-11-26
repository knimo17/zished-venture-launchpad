import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems = [
    { path: "/about", label: "About" },
    { path: "/role", label: "The Role" },
    { path: "/industries", label: "Focus Areas" },
    { path: "/ideal-candidate", label: "Operators" },
    { path: "/internships", label: "Internships" },
    { path: "/process", label: "Process" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="font-bold text-2xl tracking-tight">
            verigo54
            <span className="text-accent">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  location.pathname === item.path
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="rounded-full px-8">
                  Apply
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/internships')}>
                  Apply for Internship
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/apply')}>
                  Apply as Venture Operator
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className="text-base font-medium text-foreground hover:text-muted-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="space-y-2 pt-2">
                    <Button 
                      size="lg" 
                      className="w-full rounded-full"
                      onClick={() => {
                        setOpen(false);
                        navigate('/internships');
                      }}
                    >
                      Apply for Internship
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => {
                        setOpen(false);
                        navigate('/apply');
                      }}
                    >
                      Apply as Venture Operator
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
