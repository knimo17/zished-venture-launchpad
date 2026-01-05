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
import { Target, ListTodo, ArrowRight, Link2, CheckCircle2 } from "lucide-react";

const ONBOARDING_KEY = "team_onboarding_seen_v2";

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
            Here's how Goals and Tasks work together to help you achieve outcomes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Goals (Outcomes)</h3>
              <p className="text-sm text-muted-foreground">
                Goals represent the outcomes you want to achieve. Each goal can have a target date and tracks progress automatically based on completed tasks.
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
              <h3 className="font-semibold mb-1">Tasks (Action Steps)</h3>
              <p className="text-sm text-muted-foreground">
                Tasks are the actionable steps within a goal. They can be ordered, have dependencies, and include clear completion criteria.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Key Features:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span><strong>Dependencies:</strong> Tasks can depend on other tasks being completed first</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span><strong>Completion Criteria:</strong> Define what "done" looks like for each task</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span><strong>Templates:</strong> Use pre-built templates like "Register a Business with RGD"</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Quick Start:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create a <strong>Goal</strong> (optionally from a template)</li>
              <li>Add <strong>Tasks</strong> with clear completion criteria</li>
              <li>Set dependencies between tasks if needed</li>
              <li>Track progress as tasks are completed</li>
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
