import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderKanban, ListTodo, ArrowRight } from "lucide-react";

const ONBOARDING_KEY = "team_onboarding_seen";

interface TeamOnboardingProps {
  trigger?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamOnboarding({ trigger, onOpenChange }: TeamOnboardingProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (trigger) {
      setOpen(true);
    }
  }, [trigger]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to the Team Dashboard</DialogTitle>
          <DialogDescription>
            Here's a quick overview of how Lists and Tasks work together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Lists (Projects)</h3>
              <p className="text-sm text-muted-foreground">
                Lists are containers that group related tasks together. Think of them as projects or categories, like "Website Redesign" or "Q1 Goals".
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Tasks (Action Items)</h3>
              <p className="text-sm text-muted-foreground">
                Tasks are individual action items within a list. Each task can be assigned to a team member, have a due date, and track progress.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Quick Start:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create a <strong>List</strong> to organize your work</li>
              <li>Add <strong>Tasks</strong> to that list</li>
              <li>Assign tasks to team members and set due dates</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </label>
          </div>
          <Button onClick={handleClose}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
