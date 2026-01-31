import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TeamHeader } from "@/components/TeamHeader";
import { useCurrentTeamMember } from "@/hooks/useCurrentTeamMember";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ExternalLink, CheckCircle, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { FridayReportReminder } from "@/components/FridayReportReminder";
import { useToast } from "@/hooks/use-toast";

interface ReportSession {
  id: string;
  token: string;
  status: string;
  sent_at: string;
  completed_at: string | null;
}

export default function TeamWeeklyReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentMember, loading: memberLoading } = useCurrentTeamMember();
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (memberLoading || !currentMember) {
      if (!memberLoading) setLoading(false);
      return;
    }

    async function fetchSessions() {
      const { data, error } = await supabase
        .from("weekly_report_sessions")
        .select("id, token, status, sent_at, completed_at")
        .eq("operator_email", currentMember.email)
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
      } else {
        setSessions(data || []);
      }
      setLoading(false);
    }

    fetchSessions();
  }, [currentMember, memberLoading]);

  const handleCreateReport = async () => {
    if (!currentMember) return;

    setCreating(true);
    try {
      const token = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("weekly_report_sessions")
        .insert({
          token,
          operator_email: currentMember.email,
          operator_name: currentMember.name,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Report Created",
        description: "You can now fill out your weekly report.",
      });

      // Navigate to the report form
      navigate(`/weekly-report/${token}`);
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast({
        title: "Error",
        description: "Failed to create report session.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (memberLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TeamHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const pendingSession = sessions.find((s) => s.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <TeamHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <FridayReportReminder />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Weekly Reports</h1>
            <p className="text-muted-foreground mt-1">
              View and submit your weekly reports
            </p>
          </div>
          {!pendingSession && (
            <Button onClick={handleCreateReport} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Weekly Report
                </>
              )}
            </Button>
          )}
        </div>

        {pendingSession && (
          <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Clock className="h-5 w-5" />
                Pending Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You have a pending weekly report to complete.
              </p>
              <Button asChild>
                <a
                  href={`/weekly-report/${pendingSession.token}`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Report
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-semibold mb-4">Report History</h2>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No weekly reports found</p>
              <Button onClick={handleCreateReport} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {session.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          Week of {format(new Date(session.sent_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.completed_at
                            ? `Completed ${format(new Date(session.completed_at), "MMM d, yyyy 'at' h:mm a")}`
                            : "Not yet submitted"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                      {session.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}