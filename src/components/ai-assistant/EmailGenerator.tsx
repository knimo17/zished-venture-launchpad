import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, RefreshCw, Check, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailGeneratorProps {
  teamMemberId: string;
}

export function EmailGenerator({ teamMemberId }: EmailGeneratorProps) {
  const [recipientName, setRecipientName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!purpose.trim()) {
      toast({
        title: "Purpose required",
        description: "Please describe the purpose of your email.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-email", {
        body: {
          recipientName,
          purpose,
          keyPoints,
          tone,
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

      setGeneratedEmail({ subject: data.subject, body: data.body });
    } catch (error) {
      console.error("Error generating email:", error);
      toast({
        title: "Error",
        description: "Failed to generate email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;

    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);

    // Update status to copied
    try {
      await supabase
        .from("ai_communications")
        .update({ status: "copied" })
        .eq("team_member_id", teamMemberId)
        .eq("communication_type", "email")
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Name (optional)</Label>
          <Input
            id="recipient"
            placeholder="e.g., John Smith"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose of Email *</Label>
        <Textarea
          id="purpose"
          placeholder="Describe what you want to communicate..."
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keyPoints">Key Points to Include (optional)</Label>
        <Textarea
          id="keyPoints"
          placeholder="List any specific points you want to mention..."
          value={keyPoints}
          onChange={(e) => setKeyPoints(e.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Generate Email
          </>
        )}
      </Button>

      {generatedEmail && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Generated Email</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Subject</Label>
              <p className="font-medium">{generatedEmail.subject}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Body</Label>
              <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm">
                {generatedEmail.body}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
