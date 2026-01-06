import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";

interface InviteData {
  team_member_id: string;
  name: string;
  email: string;
}

export default function TeamSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const inviteToken = searchParams.get("token");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateInvite() {
      if (!inviteToken) {
        setValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("validate-team-invite", {
          body: { invite_token: inviteToken },
        });

        if (error || !data?.valid) {
          const errorMsg = data?.error || error?.message || "Invalid or expired invite.";
          toast({
            title: "Invalid invite",
            description: errorMsg,
            variant: "destructive",
          });
          setValidating(false);
          return;
        }

        setInvite({
          team_member_id: data.team_member_id,
          name: data.name,
          email: data.email,
        });
        setIsValid(true);
      } catch (err) {
        console.error("Error validating invite:", err);
        toast({
          title: "Error",
          description: "Could not validate your invite. Please try again.",
          variant: "destructive",
        });
      } finally {
        setValidating(false);
      }
    }

    validateInvite();
  }, [inviteToken, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!invite || !inviteToken) {
      toast({
        title: "Invalid invite",
        description: "Please request a new invite link.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1) Create account OR sign in if already exists
      let userId: string | null = null;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/team/tasks`,
        },
      });

      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          // Try signing in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: invite.email,
            password,
          });
          if (signInError) throw signInError;
          userId = signInData.user?.id ?? null;
        } else {
          throw signUpError;
        }
      } else {
        userId = signUpData.user?.id ?? null;
      }

      if (!userId) {
        throw new Error("Failed to create account");
      }

      // 2) Link invite via backend function (bypasses RLS)
      const { data: linkData, error: linkError } = await supabase.functions.invoke("link-team-invite", {
        body: { invite_token: inviteToken, user_id: userId },
      });

      if (linkError || !linkData?.success) {
        const errorMsg = linkData?.error || linkError?.message || "Unknown error";
        console.error("Error linking team member:", errorMsg);
        toast({
          title: "Account created",
          description: "Account created but team linking failed. Please contact admin.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created!",
        description: "You can now access your goals.",
      });

      navigate("/team/goals");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message || "Could not create your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isValid || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is not valid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Welcome, {invite.name}!</CardTitle>
          <CardDescription>
            Create your password to access your team tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invite.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
