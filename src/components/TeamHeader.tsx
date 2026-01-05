import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ListTodo, Users, ChevronDown, FileText, Inbox, Target, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTeamMember } from "@/hooks/useCurrentTeamMember";
import { useTeamMemberPermissions } from "@/hooks/useTeamMemberPermissions";
import { FridayReportReminder } from "@/components/FridayReportReminder";
import { TeamOnboarding } from "@/components/TeamOnboarding";

export function TeamHeader() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentMember, isAdmin } = useCurrentTeamMember();
  const { hasPermission } = useTeamMemberPermissions();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="container mx-auto px-4 pt-2">
        <FridayReportReminder />
      </div>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="font-bold text-xl tracking-tight">
                verigo54<span className="text-accent">.</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/team/goals")}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/team/tasks")}
                >
                  <ListTodo className="h-4 w-4 mr-2" />
                  Tasks
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/team/weekly-report")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Weekly Report
                </Button>
                {hasPermission("view_applications") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/team/applications")}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    Applications
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/team/members")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Button>
                )}
              </nav>
            </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOnboarding(true)}
              title="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            {currentMember ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(currentMember.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {currentMember.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{currentMember.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentMember.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="md:hidden"
                    onClick={() => navigate("/team/goals")}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Goals
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="md:hidden"
                    onClick={() => navigate("/team/tasks")}
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="md:hidden"
                    onClick={() => navigate("/team/weekly-report")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Weekly Report
                  </DropdownMenuItem>
                  {hasPermission("view_applications") && (
                    <DropdownMenuItem
                      className="md:hidden"
                      onClick={() => navigate("/team/applications")}
                    >
                      <Inbox className="h-4 w-4 mr-2" />
                      Applications
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      className="md:hidden"
                      onClick={() => navigate("/team/members")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Members
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">Admin</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">Administrator</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>
    </header>
    <TeamOnboarding trigger={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
}
