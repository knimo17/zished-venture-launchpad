import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, RefreshCw, Check, MessageSquare, Heart, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerServiceResponderProps {
  teamMemberId: string;
}

interface Responses {
  empathetic: string;
  solutionFocused: string;
  brief: string;
}

export function CustomerServiceResponder({ teamMemberId }: CustomerServiceResponderProps) {
  const [customerMessage, setCustomerMessage] = useState("");
  const [situationContext, setSituationContext] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [responses, setResponses] = useState<Responses | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!customerMessage.trim()) {
      toast({
        title: "Customer message required",
        description: "Please enter the customer's message or inquiry.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResponses(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-customer-service", {
        body: {
          customerMessage,
          situationContext,
          desiredOutcome,
          teamMemberId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setResponses(data.responses);
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);

    try {
      await supabase
        .from("ai_communications")
        .update({ status: "copied" })
        .eq("team_member_id", teamMemberId)
        .eq("communication_type", "customer_service")
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedType(null), 2000);
  };

  const ResponseCard = ({
    title,
    icon: Icon,
    text,
    type,
    color,
  }: {
    title: string;
    icon: typeof Heart;
    text: string;
    type: string;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(text, type)}
        >
          {copiedType === type ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm">{text}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerMessage">Customer Message/Inquiry *</Label>
        <Textarea
          id="customerMessage"
          placeholder="Paste the customer's message here..."
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="situationContext">Additional Context (optional)</Label>
        <Textarea
          id="situationContext"
          placeholder="Any background information about the situation..."
          value={situationContext}
          onChange={(e) => setSituationContext(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredOutcome">Desired Outcome (optional)</Label>
        <Textarea
          id="desiredOutcome"
          placeholder="What resolution or outcome are you aiming for..."
          value={desiredOutcome}
          onChange={(e) => setDesiredOutcome(e.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating Responses...
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 mr-2" />
            Generate Responses
          </>
        )}
      </Button>

      {responses && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Response Variations</h3>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
          <div className="grid gap-4">
            <ResponseCard
              title="Empathetic"
              icon={Heart}
              text={responses.empathetic}
              type="empathetic"
              color="text-pink-500"
            />
            <ResponseCard
              title="Solution-Focused"
              icon={Target}
              text={responses.solutionFocused}
              type="solutionFocused"
              color="text-blue-500"
            />
            <ResponseCard
              title="Brief"
              icon={Zap}
              text={responses.brief}
              type="brief"
              color="text-yellow-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
