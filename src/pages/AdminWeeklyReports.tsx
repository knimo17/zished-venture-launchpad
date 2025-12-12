import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Send, Loader2, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface WeeklyReportSession {
  id: string;
  operator_name: string;
  operator_email: string;
  status: string;
  sent_at: string;
  completed_at: string | null;
}

interface WeeklyReport {
  id: string;
  session_id: string;
  operator_name: string;
  operator_email: string;
  week_ending: string;
  created_at: string;
}

export default function AdminWeeklyReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WeeklyReportSession[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [newOperatorName, setNewOperatorName] = useState("");
  const [newOperatorEmail, setNewOperatorEmail] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, reportsRes] = await Promise.all([
        supabase
          .from("weekly_report_sessions")
          .select("*")
          .order("sent_at", { ascending: false }),
        supabase
          .from("weekly_reports")
          .select("id, session_id, operator_name, operator_email, week_ending, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setSessions(sessionsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load weekly reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!newOperatorName || !newOperatorEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide operator name and email.",
        variant: "destructive",
      });
      return;
    }

    setSendingReport(true);
    try {
      const { error } = await supabase.functions.invoke("send-weekly-report", {
        body: {
          operator_name: newOperatorName,
          operator_email: newOperatorEmail,
        },
      });

      if (error) throw error;

      toast({
        title: "Report Sent",
        description: `Weekly report link sent to ${newOperatorEmail}`,
      });

      setSendDialogOpen(false);
      setNewOperatorName("");
      setNewOperatorEmail("");
      fetchData();
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send report.",
        variant: "destructive",
      });
    } finally {
      setSendingReport(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.operator_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReportForSession = (sessionId: string) => {
    return reports.find((r) => r.session_id === sessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Weekly Reports</h1>
              <p className="text-muted-foreground">Manage operator weekly business reports</p>
            </div>
          </div>

          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send Report Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Weekly Report Request</DialogTitle>
                <DialogDescription>
                  Send a weekly report form link to an operator.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Operator Name</Label>
                  <Input
                    id="name"
                    value={newOperatorName}
                    onChange={(e) => setNewOperatorName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Operator Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOperatorEmail}
                    onChange={(e) => setNewOperatorEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendReport} disabled={sendingReport}>
                  {sendingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Sessions</CardTitle>
                <CardDescription>
                  {sessions.length} total sessions, {reports.length} completed reports
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search operators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Week Ending</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const report = getReportForSession(session.id);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.sent_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{session.operator_name}</TableCell>
                      <TableCell>{session.operator_email}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report ? format(new Date(report.week_ending), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {report ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/weekly-report/${report.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No report sessions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
