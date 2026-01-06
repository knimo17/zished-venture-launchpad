import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Calendar, Loader2, Check, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target_date?: string | null;
}

interface SuggestedTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  is_required: boolean;
  days_from_now: number;
  selected?: boolean;
}

interface AITaskSuggestionsProps {
  goals: Goal[];
  currentMemberId: string;
  onTasksCreated: () => void;
}

export default function AITaskSuggestions({ goals, currentMemberId, onTasksCreated }: AITaskSuggestionsProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleGetSuggestions = async () => {
    if (!selectedGoal) {
      toast({ title: 'Pick a goal first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-tasks', {
        body: {
          goalName: selectedGoal.name,
          goalDescription: selectedGoal.description,
          targetDate: targetDate || selectedGoal.target_date,
        }
      });

      if (error) throw error;

      if (data?.tasks) {
        setSuggestions(data.tasks.map((t: SuggestedTask) => ({ ...t, selected: true })));
        toast({ title: `${data.tasks.length} steps suggested!` });
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast({
        title: 'Oops!',
        description: error.message || 'Could not get suggestions. Try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index: number) => {
    setSuggestions(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ));
  };

  const handleAddTasks = async () => {
    const tasksToAdd = suggestions.filter(t => t.selected);
    if (tasksToAdd.length === 0) {
      toast({ title: 'Select at least one task', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const today = new Date();
      
      for (let i = 0; i < tasksToAdd.length; i++) {
        const task = tasksToAdd[i];
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + task.days_from_now);

        const { error } = await supabase.from('tasks').insert({
          goal_id: selectedGoalId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          is_required: task.is_required,
          due_date: dueDate.toISOString().split('T')[0],
          order_index: i + 1,
          status: 'pending',
          created_by: currentMemberId,
          assigned_to: currentMemberId,
        });

        if (error) throw error;
      }

      toast({ title: `${tasksToAdd.length} tasks added!` });
      setSuggestions([]);
      setSelectedGoalId('');
      setTargetDate('');
      onTasksCreated();
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast({ title: 'Failed to add tasks', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  if (goals.length === 0) return null;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Task Breakdown
        </CardTitle>
        <CardDescription>
          Pick a goal → Set a deadline → Get step-by-step tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={targetDate || selectedGoal?.target_date?.split('T')[0] || ''}
                onChange={(e) => setTargetDate(e.target.value)}
                className="pl-9 w-[160px]"
                placeholder="Due date"
              />
            </div>
            
            <Button 
              onClick={handleGetSuggestions} 
              disabled={!selectedGoalId || loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Thinking...' : 'Get Steps'}
            </Button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Select the steps you want to add:
            </p>
            {suggestions.map((task, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  task.selected ? 'bg-background border-primary/50' : 'bg-muted/30 border-transparent'
                }`}
              >
                <Checkbox
                  checked={task.selected}
                  onCheckedChange={() => toggleTask(index)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${!task.selected ? 'text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.is_required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {task.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due in {task.days_from_now} day{task.days_from_now !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
            
            <Button 
              onClick={handleAddTasks} 
              disabled={saving || !suggestions.some(t => t.selected)}
              className="w-full gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add {suggestions.filter(t => t.selected).length} Tasks
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
