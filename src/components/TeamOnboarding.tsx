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

const ONBOARDING_KEY = "team_onboarding_seen_v3";

interface TeamOnboardingProps {
  trigger?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeamOnboarding({ trigger, onOpenChange }: TeamOnboardingProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">👋 Welcome!</DialogTitle>
          <DialogDescription>
            Here's how this works in 3 simple steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-3 items-start p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-semibold">Set a Goal</p>
              <p className="text-sm text-muted-foreground">The big thing you're trying to achieve this week, month, or quarter</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-accent/5 rounded-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-semibold">Create Tasks</p>
              <p className="text-sm text-muted-foreground">Break it down into steps yourself, or let AI create them for you</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-semibold">Check Them Off</p>
              <p className="text-sm text-muted-foreground">Complete tasks as you go and watch your progress grow ✅</p>
            </div>
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
              Don't show again
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
