import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Loader2, Copy, RefreshCw, Check, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TextRefinerProps {
  teamMemberId: string;
}

export function TextRefiner({ teamMemberId }: TextRefinerProps) {
  const [originalText, setOriginalText] = useState("");
  const [refinementType, setRefinementType] = useState("clarity");
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<{ refinedText: string; changes: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Text required",
        description: "Please enter the text you want to refine.",
        variant: "destructive",
      });
      return;
    }

    setIsRefining(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-refine-text", {
        body: {
          originalText,
          refinementType,
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

      setResult({ refinedText: data.refinedText, changes: data.changes });
    } catch (error) {
      console.error("Error refining text:", error);
      toast({
        title: "Error",
        description: "Failed to refine text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(result.refinedText);
    setCopied(true);

    try {
      await supabase
        .from("ai_communications")
        .update({ status: "copied" })
        .eq("team_member_id", teamMemberId)
        .eq("communication_type", "text_refinement")
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
      <div className="space-y-2">
        <Label htmlFor="refinementType">Refinement Type</Label>
        <Select value={refinementType} onValueChange={setRefinementType}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clarity">Improve Clarity</SelectItem>
            <SelectItem value="grammar">Fix Grammar</SelectItem>
            <SelectItem value="professional">Make Professional</SelectItem>
            <SelectItem value="concise">Make Concise</SelectItem>
            <SelectItem value="friendly">Make Friendly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="originalText">Original Text *</Label>
        <Textarea
          id="originalText"
          placeholder="Paste or type the text you want to refine..."
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          rows={6}
        />
      </div>

      <Button onClick={handleRefine} disabled={isRefining} className="w-full">
        {isRefining ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Refining...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Refine Text
          </>
        )}
      </Button>

      {result && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Refined Text</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefine}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refine Again
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
              <Label className="text-muted-foreground text-xs">Refined Version</Label>
              <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm mt-1">
                {result.refinedText}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Changes Made</Label>
              <p className="text-sm text-muted-foreground mt-1">{result.changes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
