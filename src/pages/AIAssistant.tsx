import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamHeader } from "@/components/TeamHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailGenerator } from "@/components/ai-assistant/EmailGenerator";
import { TextRefiner } from "@/components/ai-assistant/TextRefiner";
import { CustomerServiceResponder } from "@/components/ai-assistant/CustomerServiceResponder";
import { CommunicationsLog } from "@/components/ai-assistant/CommunicationsLog";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTeamMember } from "@/hooks/useCurrentTeamMember";
import { useTeamMemberPermissions } from "@/hooks/useTeamMemberPermissions";
import { Mail, Wand2, MessageSquare, History, Sparkles } from "lucide-react";

export default function AIAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentMember, loading: memberLoading, isAdmin } = useCurrentTeamMember();
  const { hasPermission, loading: permissionsLoading } = useTeamMemberPermissions();
  const [activeTab, setActiveTab] = useState("email");

  const canViewLog = isAdmin || hasPermission("view_communications");

  useEffect(() => {
    if (!memberLoading && !permissionsLoading && !user) {
      navigate("/team/login");
    }
  }, [user, memberLoading, permissionsLoading, navigate]);

  if (memberLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Access denied. Please log in as a team member.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeamHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Assistant</h1>
          </div>
          <p className="text-muted-foreground">
            Generate professional emails, refine text, and create customer service responses with AI.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 mb-6">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="refine" className="gap-2">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Refine Text</span>
            </TabsTrigger>
            <TabsTrigger value="customer-service" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Customer Service</span>
            </TabsTrigger>
            {canViewLog && (
              <TabsTrigger value="log" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Log</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Generator
                </CardTitle>
                <CardDescription>
                  Generate professional emails for any purpose. Describe what you need and let AI draft it for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailGenerator teamMemberId={currentMember.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refine">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Text Refiner
                </CardTitle>
                <CardDescription>
                  Improve existing text by making it clearer, more professional, or more concise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextRefiner teamMemberId={currentMember.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer-service">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Service Responder
                </CardTitle>
                <CardDescription>
                  Generate helpful, empathetic responses to customer inquiries with multiple tone options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerServiceResponder teamMemberId={currentMember.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {canViewLog && (
            <TabsContent value="log">
              <CommunicationsLog />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
