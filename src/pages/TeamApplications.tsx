import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TeamHeader } from "@/components/TeamHeader";
import { useTeamMemberPermissions } from "@/hooks/useTeamMemberPermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  internship_id: string | null;
  internships: {
    title: string;
    portfolio_company: string;
  } | null;
}

export default function TeamApplications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, loading: permLoading, isAdmin } = useTeamMemberPermissions();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (permLoading) return;

    if (!hasPermission("view_applications") && !isAdmin) {
      navigate("/team/goals");
      return;
    }

    fetchApplications();
  }, [permLoading, hasPermission, isAdmin, navigate]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id, 
          created_at, 
          name, 
          email, 
          phone, 
          status,
          internship_id,
          internships (
            title,
            portfolio_company
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setApplications(applications.filter(app => app.id !== id));
      toast({
        title: "Application deleted",
        description: "The application has been permanently deleted.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error deleting application",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "reviewed":
        return "bg-blue-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (permLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TeamHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeamHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-1">
            Total applications: {applications.length}
          </p>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.phone}</TableCell>
                    <TableCell>
                      {app.internship_id ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">Internship</Badge>
                          <span className="text-xs text-muted-foreground">
                            {app.internships?.title}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">General Application</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/team/application/${app.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={deletingId === app.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the application from {app.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(app.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
