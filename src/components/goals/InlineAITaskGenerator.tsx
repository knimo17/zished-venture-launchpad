import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Calendar, Loader2, Plus, Pencil, Check } from 'lucide-react';
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
  editing?: boolean;
}

interface InlineAITaskGeneratorProps {
  goal: Goal;
  currentMemberId: string;
  onTasksCreated: () => void;
}

export function InlineAITaskGenerator({ goal, currentMemberId, onTasksCreated }: InlineAITaskGeneratorProps) {
  const [targetDate, setTargetDate] = useState<string>(goal.target_date?.split('T')[0] || '');
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-tasks', {
        body: {
          goalName: goal.name,
          goalDescription: goal.description,
          targetDate: targetDate || goal.target_date,
        }
      });

      if (error) throw error;

      if (data?.tasks) {
        setSuggestions(data.tasks.map((t: SuggestedTask) => ({ ...t, selected: true, editing: false })));
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

  const startEditing = (index: number) => {
    setSuggestions(prev => prev.map((t, i) => 
      i === index ? { ...t, editing: true } : t
    ));
  };

  const updateTask = (index: number, field: keyof SuggestedTask, value: any) => {
    setSuggestions(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ));
  };

  const saveEditing = (index: number) => {
    setSuggestions(prev => prev.map((t, i) => 
      i === index ? { ...t, editing: false } : t
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
          goal_id: goal.id,
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
      setShowForm(false);
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

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
        onClick={() => setShowForm(true)}
      >
        <Sparkles className="h-4 w-4" />
        Generate Tasks with AI
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Task Generator</span>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="pl-9"
              placeholder="Target date"
            />
          </div>
          <Button 
            onClick={handleGetSuggestions} 
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Thinking...' : 'Generate'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select tasks to add:</p>
          {suggestions.map((task, index) => (
            <div 
              key={index}
              className={`p-2 rounded-md border transition-colors ${
                task.selected ? 'bg-background border-primary/50' : 'bg-muted/30 border-transparent'
              }`}
            >
              {task.editing ? (
                <div className="space-y-2">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Task title"
                    className="text-sm"
                  />
                  <Textarea
                    value={task.description}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select 
                      value={task.priority} 
                      onValueChange={(v) => updateTask(index, 'priority', v)}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Days:</span>
                      <Input
                        type="number"
                        value={task.days_from_now}
                        onChange={(e) => updateTask(index, 'days_from_now', parseInt(e.target.value) || 0)}
                        className="w-[60px] h-8 text-xs"
                        min={0}
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 ml-auto" onClick={() => saveEditing(index)}>
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={task.selected}
                    onCheckedChange={() => toggleTask(index)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-sm font-medium ${!task.selected ? 'text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      <Badge variant={getPriorityColor(task.priority) as any} className="text-[10px] px-1 py-0">
                        {task.priority}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 w-5 p-0 ml-auto"
                        onClick={() => startEditing(index)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Button 
            onClick={handleAddTasks} 
            disabled={saving || !suggestions.some(t => t.selected)}
            size="sm"
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
    </div>
  );
}
