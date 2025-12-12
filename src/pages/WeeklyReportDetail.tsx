import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Loader2, Calendar, User, Mail, Building2 } from "lucide-react";
import { format } from "date-fns";

interface WeeklyReport {
  id: string;
  session_id: string;
  operator_name: string;
  operator_email: string;
  week_ending: string;
  assigned_businesses: string[];
  leadership_role: string;
  strategy_changed: boolean;
  strategy_change_details: string | null;
  problem_definition: string;
  problem_changed: boolean;
  problem_change_details: string | null;
  solution_description: string;
  personal_execution: string;
  approach_viability: string;
  no_action_reason: string | null;
  active_users: string | null;
  revenue_ghs: number | null;
  costs_ghs: number | null;
  leads_partnerships: string | null;
  qualitative_traction: string | null;
  used_ai_tools: boolean;
  ai_tools_details: any[];
  key_insight: string;
  challenges_risks: string;
  biggest_blocker: string;
  key_decisions: string;
  trade_offs_evaluated: string;
  decisions_owned_escalated: string;
  delayed_decisions: string | null;
  unconstrained_decision: string;
  talent_capability_gaps: string;
  capital_needed_ghs: number | null;
  capital_use: string | null;
  next_week_priorities: string;
  support_needed: string;
  created_at: string;
}

interface Activity {
  id: string;
  action_taken: string;
  outcome_insight: string;
  status: string;
}

interface Venture {
  id: string;
  name: string;
}

export default function WeeklyReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ventures, setVentures] = useState<Venture[]>([]);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    if (!id) return;

    try {
      const [reportRes, activitiesRes, venturesRes] = await Promise.all([
        supabase.from("weekly_reports").select("*").eq("id", id).single(),
        supabase.from("weekly_report_activities").select("*").eq("report_id", id),
        supabase.from("ventures").select("id, name"),
      ]);

      if (reportRes.error) throw reportRes.error;
      
      const reportData = {
        ...reportRes.data,
        ai_tools_details: (reportRes.data.ai_tools_details as any[]) || [],
      };
      setReport(reportData);
      setActivities(activitiesRes.data || []);
      setVentures(venturesRes.data || []);
    } catch (error: any) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Failed to load report details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVentureNames = (ids: string[]) => {
    return ids
      .map((id) => ventures.find((v) => v.id === id)?.name || "Unknown")
      .join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "blocked":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Report Not Found</CardTitle>
            <CardDescription>The requested report could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/weekly-reports")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Weekly Report</h1>
              <p className="text-muted-foreground">
                Week ending {format(new Date(report.week_ending), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">verigo54 Weekly Business Report</h1>
          <p className="text-center text-muted-foreground">
            Week ending {format(new Date(report.week_ending), "MMMM d, yyyy")}
          </p>
        </div>

        <div className="space-y-6">
          {/* Operator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Operator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{report.operator_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{report.operator_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leadership Role</p>
                <p className="font-medium">{report.leadership_role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Businesses</p>
                <p className="font-medium">
                  {report.assigned_businesses.length > 0
                    ? getVentureNames(report.assigned_businesses)
                    : "None specified"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Direction */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Direction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Strategy Changed:</span>
                <Badge variant={report.strategy_changed ? "default" : "secondary"}>
                  {report.strategy_changed ? "Yes" : "No"}
                </Badge>
              </div>
              {report.strategy_changed && report.strategy_change_details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Change Details</p>
                  <p className="whitespace-pre-wrap">{report.strategy_change_details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problem Definition */}
          <Card>
            <CardHeader>
              <CardTitle>Problem Definition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Core Problem</p>
                <p className="whitespace-pre-wrap">{report.problem_definition}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Understanding Changed:</span>
                <Badge variant={report.problem_changed ? "default" : "secondary"}>
                  {report.problem_changed ? "Yes" : "No"}
                </Badge>
              </div>
              {report.problem_changed && report.problem_change_details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">What Changed</p>
                  <p className="whitespace-pre-wrap">{report.problem_change_details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solution & Product Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Solution & Product Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Solution</p>
                <p className="whitespace-pre-wrap">{report.solution_description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Personal Execution</p>
                <p className="whitespace-pre-wrap">{report.personal_execution}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approach Viability</p>
                <p className="whitespace-pre-wrap">{report.approach_viability}</p>
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activities</CardTitle>
              <CardDescription>{activities.length} activities recorded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Activity {index + 1}</span>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Action: </span>
                      {activity.action_taken}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Outcome: </span>
                      {activity.outcome_insight}
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && report.no_action_reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason for no activities</p>
                  <p className="whitespace-pre-wrap">{report.no_action_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics & Traction */}
          <Card>
            <CardHeader>
              <CardTitle>Metrics & Traction</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="font-medium">{report.active_users || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue (GHS)</p>
                <p className="font-medium">
                  {report.revenue_ghs ? `₵${report.revenue_ghs.toLocaleString()}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Costs (GHS)</p>
                <p className="font-medium">
                  {report.costs_ghs ? `₵${report.costs_ghs.toLocaleString()}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads/Partnerships</p>
                <p className="font-medium">{report.leads_partnerships || "-"}</p>
              </div>
              {report.qualitative_traction && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Qualitative Traction</p>
                  <p className="whitespace-pre-wrap">{report.qualitative_traction}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Tools */}
          {report.used_ai_tools && report.ai_tools_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI & Tools Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.ai_tools_details.map((tool: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <p className="font-medium">{tool.tool}</p>
                    <p className="text-sm text-muted-foreground">Task: {tool.task}</p>
                    <p className="text-sm text-muted-foreground">Impact: {tool.impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Insight */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.key_insight}</p>
            </CardContent>
          </Card>

          {/* Challenges & Risks */}
          <Card>
            <CardHeader>
              <CardTitle>Challenges, Risks & Blockers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Challenges & Risks</p>
                <p className="whitespace-pre-wrap">{report.challenges_risks}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Biggest Blocker</p>
                <p className="whitespace-pre-wrap">{report.biggest_blocker}</p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Decisions */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership Decisions & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Key Decisions</p>
                <p className="whitespace-pre-wrap">{report.key_decisions}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trade-offs Evaluated</p>
                <p className="whitespace-pre-wrap">{report.trade_offs_evaluated}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Decisions Owned vs Escalated</p>
                <p className="whitespace-pre-wrap">{report.decisions_owned_escalated}</p>
              </div>
              {report.delayed_decisions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delayed Decisions</p>
                    <p className="whitespace-pre-wrap">{report.delayed_decisions}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unconstrained Decision</p>
                <p className="whitespace-pre-wrap">{report.unconstrained_decision}</p>
              </div>
            </CardContent>
          </Card>

          {/* Talent & Capability Gaps */}
          <Card>
            <CardHeader>
              <CardTitle>Talent & Capability Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.talent_capability_gaps}</p>
            </CardContent>
          </Card>

          {/* Capital & Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Capital & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Capital Needed (GHS)</p>
                <p className="font-medium">
                  {report.capital_needed_ghs
                    ? `₵${report.capital_needed_ghs.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
              {report.capital_use && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Capital Use</p>
                  <p className="whitespace-pre-wrap">{report.capital_use}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Week Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Next Week Priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.next_week_priorities}</p>
            </CardContent>
          </Card>

          {/* Support Needed */}
          <Card>
            <CardHeader>
              <CardTitle>Support Needed from verigo54</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.support_needed}</p>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <div className="text-center text-sm text-muted-foreground py-4">
            Report submitted on {format(new Date(report.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </div>
    </div>
  );
}
