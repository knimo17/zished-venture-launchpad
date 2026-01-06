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
import { Target, ListTodo, ArrowDown } from "lucide-react";

const ONBOARDING_KEY = "team_onboarding_seen_v2";

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
            Here's how this works in 10 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-3 items-center p-3 bg-primary/5 rounded-lg">
            <Target className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold">Goals = What you want</p>
              <p className="text-sm text-muted-foreground">The big thing you're trying to achieve</p>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex gap-3 items-center p-3 bg-accent/5 rounded-lg">
            <ListTodo className="h-8 w-8 text-accent flex-shrink-0" />
            <div>
              <p className="font-semibold">Tasks = Steps to get there</p>
              <p className="text-sm text-muted-foreground">Small actions that move you forward</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm">
              <strong>That's it!</strong> Create a goal, add tasks, check them off. ✅
            </p>
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
