import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Venture {
  id: string;
  name: string;
}

interface Activity {
  action_taken: string;
  outcome_insight: string;
  status: "completed" | "in_progress" | "blocked";
}

interface AITool {
  tool: string;
  task: string;
  impact: string;
}

export default function WeeklyReportForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [ventures, setVentures] = useState<Venture[]>([]);

  // Form state
  const [weekEnding, setWeekEnding] = useState<Date>();
  const [assignedBusinesses, setAssignedBusinesses] = useState<string[]>([]);
  const [leadershipRole, setLeadershipRole] = useState("");
  const [strategyChanged, setStrategyChanged] = useState<boolean | null>(null);
  const [strategyChangeDetails, setStrategyChangeDetails] = useState("");
  const [problemDefinition, setProblemDefinition] = useState("");
  const [problemChanged, setProblemChanged] = useState<boolean | null>(null);
  const [problemChangeDetails, setProblemChangeDetails] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
  const [personalExecution, setPersonalExecution] = useState("");
  const [approachViability, setApproachViability] = useState("");
  const [activities, setActivities] = useState<Activity[]>([{ action_taken: "", outcome_insight: "", status: "completed" }]);
  const [noActionReason, setNoActionReason] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [revenueGhs, setRevenueGhs] = useState("");
  const [costsGhs, setCostsGhs] = useState("");
  const [leadsPartnerships, setLeadsPartnerships] = useState("");
  const [qualitativeTraction, setQualitativeTraction] = useState("");
  const [usedAiTools, setUsedAiTools] = useState<boolean | null>(null);
  const [aiToolsDetails, setAiToolsDetails] = useState<AITool[]>([{ tool: "", task: "", impact: "" }]);
  const [keyInsight, setKeyInsight] = useState("");
  const [challengesRisks, setChallengesRisks] = useState("");
  const [biggestBlocker, setBiggestBlocker] = useState("");
  const [keyDecisions, setKeyDecisions] = useState("");
  const [tradeOffsEvaluated, setTradeOffsEvaluated] = useState("");
  const [decisionsOwnedEscalated, setDecisionsOwnedEscalated] = useState("");
  const [delayedDecisions, setDelayedDecisions] = useState("");
  const [unconstrainedDecision, setUnconstrainedDecision] = useState("");
  const [talentCapabilityGaps, setTalentCapabilityGaps] = useState("");
  const [capitalNeededGhs, setCapitalNeededGhs] = useState("");
  const [capitalUse, setCapitalUse] = useState("");
  const [nextWeekPriorities, setNextWeekPriorities] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");

  useEffect(() => {
    fetchSessionAndVentures();
  }, [token]);

  const fetchSessionAndVentures = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch session using secure RPC function
      const { data: sessionRows, error: sessionError } = await supabase
        .rpc("get_weekly_report_session_by_token", { session_token: token });

      const sessionData = sessionRows?.[0] || null;

      if (sessionError || !sessionData) {
        toast({
          title: "Invalid Link",
          description: "This report link is invalid or has expired.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (sessionData.status === "completed") {
        toast({
          title: "Report Already Submitted",
          description: "This weekly report has already been submitted.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setSession(sessionData);

      // Fetch ventures
      const { data: venturesData } = await supabase
        .from("ventures")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setVentures(venturesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load report form.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addActivity = () => {
    setActivities([...activities, { action_taken: "", outcome_insight: "", status: "completed" }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const updateActivity = (index: number, field: keyof Activity, value: string) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const addAiTool = () => {
    setAiToolsDetails([...aiToolsDetails, { tool: "", task: "", impact: "" }]);
  };

  const removeAiTool = (index: number) => {
    if (aiToolsDetails.length > 1) {
      setAiToolsDetails(aiToolsDetails.filter((_, i) => i !== index));
    }
  };

  const updateAiTool = (index: number, field: keyof AITool, value: string) => {
    const updated = [...aiToolsDetails];
    updated[index] = { ...updated[index], [field]: value };
    setAiToolsDetails(updated);
  };

  const toggleBusiness = (ventureId: string) => {
    setAssignedBusinesses(prev =>
      prev.includes(ventureId)
        ? prev.filter(id => id !== ventureId)
        : [...prev, ventureId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !weekEnding || !token) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert report using secure RPC function (also updates session status)
      const { data: reportId, error: reportError } = await supabase.rpc("save_weekly_report", {
        session_token: token,
        p_week_ending: format(weekEnding, "yyyy-MM-dd"),
        p_assigned_businesses: assignedBusinesses,
        p_leadership_role: leadershipRole,
        p_strategy_changed: strategyChanged || false,
        p_strategy_change_details: strategyChanged ? strategyChangeDetails : null,
        p_problem_definition: problemDefinition,
        p_problem_changed: problemChanged || false,
        p_problem_change_details: problemChanged ? problemChangeDetails : null,
        p_solution_description: solutionDescription,
        p_personal_execution: personalExecution,
        p_approach_viability: approachViability,
        p_no_action_reason: noActionReason || null,
        p_active_users: activeUsers || null,
        p_revenue_ghs: revenueGhs ? parseFloat(revenueGhs) : null,
        p_costs_ghs: costsGhs ? parseFloat(costsGhs) : null,
        p_leads_partnerships: leadsPartnerships || null,
        p_qualitative_traction: qualitativeTraction || null,
        p_used_ai_tools: usedAiTools || false,
        p_ai_tools_details: usedAiTools ? JSON.parse(JSON.stringify(aiToolsDetails)) : [],
        p_key_insight: keyInsight,
        p_challenges_risks: challengesRisks,
        p_biggest_blocker: biggestBlocker,
        p_key_decisions: keyDecisions,
        p_trade_offs_evaluated: tradeOffsEvaluated,
        p_decisions_owned_escalated: decisionsOwnedEscalated,
        p_delayed_decisions: delayedDecisions || null,
        p_unconstrained_decision: unconstrainedDecision,
        p_talent_capability_gaps: talentCapabilityGaps,
        p_capital_needed_ghs: capitalNeededGhs ? parseFloat(capitalNeededGhs) : null,
        p_capital_use: capitalUse || null,
        p_next_week_priorities: nextWeekPriorities,
        p_support_needed: supportNeeded,
      });

      if (reportError) throw reportError;

      // Insert activities using secure RPC function
      const validActivities = activities.filter(a => a.action_taken.trim());
      if (validActivities.length > 0 && reportId) {
        const { error: activitiesError } = await supabase.rpc("save_weekly_report_activities", {
          session_token: token,
          p_report_id: reportId,
          p_activities: JSON.parse(JSON.stringify(validActivities)),
        });

        if (activitiesError) throw activitiesError;
      }

      toast({
        title: "Report Submitted",
        description: "Your weekly business report has been submitted successfully.",
      });

      navigate("/weekly-report-thank-you");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>This report link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">verigo54</h1>
          <h2 className="text-xl text-muted-foreground">Venture Operator Weekly Business Report</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Submission deadline: Every Friday, 6:00 PM | Reporting currency: Ghana Cedis (GHS)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Operator & Business Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>1. Operator & Business Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={session.operator_name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input value={session.operator_email} disabled className="bg-muted" />
                </div>
              </div>
              
              <div>
                <Label>Week Ending (Date) *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !weekEnding && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {weekEnding ? format(weekEnding, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={weekEnding}
                      onSelect={setWeekEnding}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Assigned Business(es) *</Label>
                <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
                <div className="grid grid-cols-2 gap-2">
                  {ventures.map(venture => (
                    <div key={venture.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={venture.id}
                        checked={assignedBusinesses.includes(venture.id)}
                        onCheckedChange={() => toggleBusiness(venture.id)}
                      />
                      <Label htmlFor={venture.id} className="cursor-pointer">{venture.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Leadership Role */}
          <Card>
            <CardHeader>
              <CardTitle>2. Leadership Role & Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What leadership role did you play this week? *</Label>
              <p className="text-sm text-muted-foreground mb-2">e.g. Acting CEO, business development lead, product lead, operations lead</p>
              <Input
                value={leadershipRole}
                onChange={(e) => setLeadershipRole(e.target.value)}
                placeholder="Your role this week"
                required
              />
            </CardContent>
          </Card>

          {/* Section 3: Strategic Direction */}
          <Card>
            <CardHeader>
              <CardTitle>3. Strategic Direction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Did you change the business's direction, priorities, or key assumptions? *</Label>
                <RadioGroup
                  value={strategyChanged === null ? "" : strategyChanged ? "yes" : "no"}
                  onValueChange={(v) => setStrategyChanged(v === "yes")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="strategy-yes" />
                    <Label htmlFor="strategy-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="strategy-no" />
                    <Label htmlFor="strategy-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {strategyChanged && (
                <div>
                  <Label>What changed, why, and what informed the decision?</Label>
                  <Textarea
                    value={strategyChangeDetails}
                    onChange={(e) => setStrategyChangeDetails(e.target.value)}
                    placeholder="Explain the changes..."
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Problem Definition */}
          <Card>
            <CardHeader>
              <CardTitle>4. Problem Definition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What core problem is the business currently solving? *</Label>
                <p className="text-sm text-muted-foreground mb-2">Who experiences the problem, why it matters, and why now.</p>
                <Textarea
                  value={problemDefinition}
                  onChange={(e) => setProblemDefinition(e.target.value)}
                  placeholder="Describe the core problem..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Did your understanding of this problem change this week?</Label>
                <RadioGroup
                  value={problemChanged === null ? "" : problemChanged ? "yes" : "no"}
                  onValueChange={(v) => setProblemChanged(v === "yes")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="problem-yes" />
                    <Label htmlFor="problem-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="problem-no" />
                    <Label htmlFor="problem-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {problemChanged && (
                <div>
                  <Label>If yes, explain what changed and why.</Label>
                  <Textarea
                    value={problemChangeDetails}
                    onChange={(e) => setProblemChangeDetails(e.target.value)}
                    placeholder="Explain what changed..."
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Solution & Product Progress */}
          <Card>
            <CardHeader>
              <CardTitle>5. Solution & Product Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What solution is the business currently pursuing? *</Label>
                <p className="text-sm text-muted-foreground mb-2">What is being built, tested, or validated.</p>
                <Textarea
                  value={solutionDescription}
                  onChange={(e) => setSolutionDescription(e.target.value)}
                  placeholder="Describe the solution..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>What did you personally lead or execute this week? *</Label>
                <Textarea
                  value={personalExecution}
                  onChange={(e) => setPersonalExecution(e.target.value)}
                  placeholder="Your personal contributions..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Why do you believe this approach is viable compared to alternatives? *</Label>
                <Textarea
                  value={approachViability}
                  onChange={(e) => setApproachViability(e.target.value)}
                  placeholder="Explain your reasoning..."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Execution & Weekly Activities */}
          <Card>
            <CardHeader>
              <CardTitle>6. Execution & Weekly Activities</CardTitle>
              <CardDescription>List all concrete actions you took this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Activity {index + 1}</Label>
                    {activities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Action Taken</Label>
                    <Input
                      value={activity.action_taken}
                      onChange={(e) => updateActivity(index, "action_taken", e.target.value)}
                      placeholder="What did you do?"
                    />
                  </div>
                  <div>
                    <Label>Outcome or Insight</Label>
                    <Input
                      value={activity.outcome_insight}
                      onChange={(e) => updateActivity(index, "outcome_insight", e.target.value)}
                      placeholder="What was the result?"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={activity.status}
                      onValueChange={(v) => updateActivity(index, "status", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addActivity}>
                <Plus className="h-4 w-4 mr-2" /> Add Activity
              </Button>

              <div>
                <Label>If no meaningful actions were taken, explain why:</Label>
                <Textarea
                  value={noActionReason}
                  onChange={(e) => setNoActionReason(e.target.value)}
                  placeholder="Optional explanation..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Metrics & Traction */}
          <Card>
            <CardHeader>
              <CardTitle>7. Metrics & Traction (Best Estimates)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Active users / customers</Label>
                  <Input
                    value={activeUsers}
                    onChange={(e) => setActiveUsers(e.target.value)}
                    placeholder="e.g. 150"
                  />
                </div>
                <div>
                  <Label>Revenue generated this week (GHS)</Label>
                  <Input
                    type="number"
                    value={revenueGhs}
                    onChange={(e) => setRevenueGhs(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Costs incurred this week (GHS)</Label>
                  <Input
                    type="number"
                    value={costsGhs}
                    onChange={(e) => setCostsGhs(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Leads, pilots, partnerships initiated</Label>
                  <Input
                    value={leadsPartnerships}
                    onChange={(e) => setLeadsPartnerships(e.target.value)}
                    placeholder="Describe..."
                  />
                </div>
              </div>
              <div>
                <Label>Qualitative traction signals</Label>
                <Textarea
                  value={qualitativeTraction}
                  onChange={(e) => setQualitativeTraction(e.target.value)}
                  placeholder="Interest, engagement, customer feedback, momentum..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 8: AI & Tools */}
          <Card>
            <CardHeader>
              <CardTitle>8. Use of AI & Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Did you use AI or automation tools in your work this week?</Label>
                <RadioGroup
                  value={usedAiTools === null ? "" : usedAiTools ? "yes" : "no"}
                  onValueChange={(v) => setUsedAiTools(v === "yes")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ai-yes" />
                    <Label htmlFor="ai-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ai-no" />
                    <Label htmlFor="ai-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {usedAiTools && (
                <div className="space-y-4">
                  {aiToolsDetails.map((tool, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-medium">Tool {index + 1}</Label>
                        {aiToolsDetails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAiTool(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label>Tool(s) used</Label>
                        <Input
                          value={tool.tool}
                          onChange={(e) => updateAiTool(index, "tool", e.target.value)}
                          placeholder="e.g. ChatGPT, Notion AI"
                        />
                      </div>
                      <div>
                        <Label>Task supported</Label>
                        <Input
                          value={tool.task}
                          onChange={(e) => updateAiTool(index, "task", e.target.value)}
                          placeholder="What task did it help with?"
                        />
                      </div>
                      <div>
                        <Label>Impact on speed, quality, or decision-making</Label>
                        <Input
                          value={tool.impact}
                          onChange={(e) => updateAiTool(index, "impact", e.target.value)}
                          placeholder="How did it help?"
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addAiTool}>
                    <Plus className="h-4 w-4 mr-2" /> Add Tool
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 9: Key Insight */}
          <Card>
            <CardHeader>
              <CardTitle>9. Key Insight or Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What was the most important insight you gained this week? *</Label>
              <p className="text-sm text-muted-foreground mb-2">Market, customer behavior, execution, product, or team.</p>
              <Textarea
                value={keyInsight}
                onChange={(e) => setKeyInsight(e.target.value)}
                placeholder="Share your key insight..."
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Section 10: Challenges & Risks */}
          <Card>
            <CardHeader>
              <CardTitle>10. Challenges, Risks & Blockers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What are the biggest challenges or risks facing the business? *</Label>
                <p className="text-sm text-muted-foreground mb-2">Categorize if possible: market, technical, execution, team, regulatory, external.</p>
                <Textarea
                  value={challengesRisks}
                  onChange={(e) => setChallengesRisks(e.target.value)}
                  placeholder="Describe challenges and risks..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>What is currently slowing progress the most? *</Label>
                <Textarea
                  value={biggestBlocker}
                  onChange={(e) => setBiggestBlocker(e.target.value)}
                  placeholder="Your biggest blocker..."
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 11: Leadership Decisions */}
          <Card>
            <CardHeader>
              <CardTitle>11. Leadership Decisions & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>What key decisions did you make this week? *</Label>
                <Textarea
                  value={keyDecisions}
                  onChange={(e) => setKeyDecisions(e.target.value)}
                  placeholder="List your key decisions..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>What trade-offs did you evaluate? *</Label>
                <p className="text-sm text-muted-foreground mb-2">e.g. speed vs quality, cost vs scope, build vs buy.</p>
                <Textarea
                  value={tradeOffsEvaluated}
                  onChange={(e) => setTradeOffsEvaluated(e.target.value)}
                  placeholder="Describe trade-offs..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>Which decisions did you own directly vs escalate? *</Label>
                <Textarea
                  value={decisionsOwnedEscalated}
                  onChange={(e) => setDecisionsOwnedEscalated(e.target.value)}
                  placeholder="Owned vs escalated..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>Were any decisions intentionally delayed? If so, why?</Label>
                <Textarea
                  value={delayedDecisions}
                  onChange={(e) => setDelayedDecisions(e.target.value)}
                  placeholder="Delayed decisions and reasons..."
                  rows={3}
                />
              </div>

              <div>
                <Label>If you had full authority and no constraints, what one decision would you implement immediately? *</Label>
                <Textarea
                  value={unconstrainedDecision}
                  onChange={(e) => setUnconstrainedDecision(e.target.value)}
                  placeholder="Your unconstrained decision..."
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 12: Talent & Capability Gaps */}
          <Card>
            <CardHeader>
              <CardTitle>12. Talent & Capability Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What skills or roles does the business most urgently need? *</Label>
              <p className="text-sm text-muted-foreground mb-2">e.g. engineering, sales, data, design, operations, compliance.</p>
              <Textarea
                value={talentCapabilityGaps}
                onChange={(e) => setTalentCapabilityGaps(e.target.value)}
                placeholder="Identify talent gaps..."
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Section 13: Capital & Resources */}
          <Card>
            <CardHeader>
              <CardTitle>13. Capital & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Based on current progress, how much capital would you seek over the next 3–6 months? (GHS)</Label>
                <Input
                  type="number"
                  value={capitalNeededGhs}
                  onChange={(e) => setCapitalNeededGhs(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>What would this capital primarily be used for?</Label>
                <Textarea
                  value={capitalUse}
                  onChange={(e) => setCapitalUse(e.target.value)}
                  placeholder="Describe capital allocation..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 14: Next Week Plan */}
          <Card>
            <CardHeader>
              <CardTitle>14. Next Week Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What are your top 3 priorities for next week? *</Label>
              <p className="text-sm text-muted-foreground mb-2">Be specific and outcome-oriented.</p>
              <Textarea
                value={nextWeekPriorities}
                onChange={(e) => setNextWeekPriorities(e.target.value)}
                placeholder="1. ...\n2. ...\n3. ..."
                rows={5}
                required
              />
            </CardContent>
          </Card>

          {/* Section 15: Support Needed */}
          <Card>
            <CardHeader>
              <CardTitle>15. Support Needed from verigo54</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What support do you need from the verigo54 core team? *</Label>
              <p className="text-sm text-muted-foreground mb-2">e.g. introductions, decisions, tools, data, mentorship, approvals.</p>
              <Textarea
                value={supportNeeded}
                onChange={(e) => setSupportNeeded(e.target.value)}
                placeholder="Describe support needed..."
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Final Note */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground italic">
              This report is used to assess leadership, execution, judgment, and business momentum — not activity alone.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Weekly Report"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
