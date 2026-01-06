import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Mail, Wand2, MessageSquare, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Communication {
  id: string;
  team_member_id: string;
  communication_type: string;
  original_input: string | null;
  ai_output: string;
  context: Record<string, unknown>;
  status: string;
  created_at: string;
  team_member?: { name: string; email: string };
}

export function CommunicationsLog() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
    fetchTeamMembers();
  }, [typeFilter, memberFilter]);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("id, name")
      .order("name");
    setTeamMembers(data || []);
  };

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ai_communications")
        .select("*, team_member:team_members(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (typeFilter !== "all") {
        query = query.eq("communication_type", typeFilter);
      }
      if (memberFilter !== "all") {
        query = query.eq("team_member_id", memberFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCommunications(
        (data || []).map((c: any) => ({
          ...c,
          team_member: c.team_member,
        }))
      );
    } catch (error) {
      console.error("Error fetching communications:", error);
      toast({
        title: "Error",
        description: "Failed to load communications log.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "text_refinement":
        return <Wand2 className="h-4 w-4" />;
      case "customer_service":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Email";
      case "text_refinement":
        return "Text Refinement";
      case "customer_service":
        return "Customer Service";
      default:
        return type;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "copied":
        return "default";
      case "sent":
        return "default";
      case "discarded":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatOutput = (comm: Communication) => {
    try {
      const parsed = JSON.parse(comm.ai_output);
      if (comm.communication_type === "email" && parsed.subject) {
        return `Subject: ${parsed.subject}\n\n${parsed.body}`;
      }
      if (comm.communication_type === "customer_service") {
        return `Empathetic:\n${parsed.empathetic}\n\nSolution-Focused:\n${parsed.solutionFocused}\n\nBrief:\n${parsed.brief}`;
      }
      return comm.ai_output;
    } catch {
      return comm.ai_output;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="text_refinement">Text Refinement</SelectItem>
            <SelectItem value="customer_service">Customer Service</SelectItem>
          </SelectContent>
        </Select>

        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Communications Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : communications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communications found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[60px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.communication_type)}
                        <span>{getTypeLabel(comm.communication_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{comm.team_member?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {comm.team_member?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(comm.status)}>
                        {comm.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(comm.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedComm(comm)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedComm} onOpenChange={() => setSelectedComm(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedComm && getTypeIcon(selectedComm.communication_type)}
              {selectedComm && getTypeLabel(selectedComm.communication_type)} Details
            </DialogTitle>
          </DialogHeader>
          {selectedComm && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created by</p>
                <p>{selectedComm.team_member?.name} ({selectedComm.team_member?.email})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created at</p>
                <p>{format(new Date(selectedComm.created_at), "MMMM d, yyyy h:mm a")}</p>
              </div>
              {selectedComm.original_input && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Original Input</p>
                  <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap mt-1">
                    {selectedComm.original_input}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Output</p>
                <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap mt-1">
                  {formatOutput(selectedComm)}
                </div>
              </div>
              {selectedComm.context && Object.keys(selectedComm.context).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Context</p>
                  <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto mt-1">
                    {JSON.stringify(selectedComm.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
