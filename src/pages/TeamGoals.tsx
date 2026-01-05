import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Target, Archive, Trash2, Edit, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { TeamHeader } from '@/components/TeamHeader';
import { Badge } from '@/components/ui/badge';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_archived: boolean;
  is_completed: boolean;
  target_date: string | null;
  created_at: string;
  task_count?: number;
  completed_task_count?: number;
  progress?: number;
}

interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
}

interface TaskTemplate {
  id: string;
  goal_template_id: string;
  title: string;
  description: string | null;
  order_index: number;
  depends_on_order: number | null;
  is_required: boolean;
  completion_criteria: string | null;
  default_priority: string;
}

export default function TeamGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', target_date: '', template_id: '' });
  const [showArchived, setShowArchived] = useState(false);

  const { currentMember, loading: memberLoading, error: memberError, isAdmin } = useCurrentTeamMember();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (memberLoading) return;

    if (memberError && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: memberError,
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    fetchData();
  }, [memberLoading, memberError, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('goal_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Get task counts and progress for each goal
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('goal_id', goal.id);

          const { count: completedCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('goal_id', goal.id)
            .eq('status', 'completed')
            .eq('is_required', true);

          const { count: requiredCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('goal_id', goal.id)
            .eq('is_required', true);

          const progress = requiredCount && requiredCount > 0 
            ? Math.round((completedCount || 0) / requiredCount * 100) 
            : 0;

          return {
            ...goal,
            task_count: totalCount || 0,
            completed_task_count: completedCount || 0,
            progress,
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goals.',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            name: formData.name,
            description: formData.description || null,
            target_date: formData.target_date || null,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast({ title: 'Goal updated!' });
      } else {
        if (!currentMember) {
          toast({ title: 'Error', description: 'You must be a team member', variant: 'destructive' });
          return;
        }

        // Create the goal
        const { data: newGoal, error: goalError } = await supabase.from('goals').insert({
          name: formData.name,
          description: formData.description || null,
          target_date: formData.target_date || null,
          owner_id: currentMember.id,
        }).select().single();

        if (goalError) throw goalError;

        // If a template is selected, create tasks from the template
        if (formData.template_id) {
          const { data: taskTemplates, error: templateError } = await supabase
            .from('task_templates')
            .select('*')
            .eq('goal_template_id', formData.template_id)
            .order('order_index', { ascending: true });

          if (templateError) throw templateError;

          if (taskTemplates && taskTemplates.length > 0) {
            // Create a map of order_index to actual task ID for dependency linking
            const orderToTaskId: Record<number, string> = {};

            // Insert tasks one by one to handle dependencies
            for (const template of taskTemplates) {
              const dependsOnTaskId = template.depends_on_order 
                ? orderToTaskId[template.depends_on_order] 
                : null;

              const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert({
                  goal_id: newGoal.id,
                  title: template.title,
                  description: template.description,
                  order_index: template.order_index,
                  depends_on: dependsOnTaskId,
                  is_required: template.is_required,
                  completion_criteria: template.completion_criteria,
                  priority: template.default_priority,
                  status: 'pending',
                  created_by: currentMember.id,
                  assigned_to: currentMember.id,
                })
                .select()
                .single();

              if (taskError) throw taskError;
              orderToTaskId[template.order_index] = newTask.id;
            }

            toast({ title: `Goal created with ${taskTemplates.length} tasks from template!` });
          } else {
            toast({ title: 'Goal created!' });
          }
        } else {
          toast({ title: 'Goal created!' });
        }
      }

      setIsModalOpen(false);
      setEditingGoal(null);
      setFormData({ name: '', description: '', target_date: '', template_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to save goal.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_archived: !goal.is_archived })
        .eq('id', goal.id);

      if (error) throw error;
      toast({ title: goal.is_archived ? 'Goal restored!' : 'Goal archived!' });
      fetchData();
    } catch (error) {
      console.error('Error archiving goal:', error);
      toast({ title: 'Error', description: 'Failed to archive goal.', variant: 'destructive' });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
      toast({ title: 'Goal deleted!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Error', description: 'Failed to delete goal.', variant: 'destructive' });
    }
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      template_id: '',
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData({ name: '', description: '', target_date: '', template_id: '' });
    setIsModalOpen(true);
  };

  const filteredGoals = goals.filter((goal) =>
    showArchived ? goal.is_archived : !goal.is_archived
  );

  if (memberLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeamHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">Define outcomes and track progress with tasks</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {showArchived ? 'No archived goals.' : 'No goals yet.'}
                </p>
                {!showArchived && (
                  <Button className="mt-4" onClick={openCreateModal}>
                    Create your first goal
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className={`${goal.is_archived ? 'opacity-60' : ''} ${goal.is_completed ? 'border-green-500/50' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {goal.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Target className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(goal)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{goal.name}"? This will also delete all tasks in this goal.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(goal.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{goal.task_count} {goal.task_count === 1 ? 'task' : 'tasks'}</span>
                      {goal.target_date && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.target_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingGoal && templates.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Start from Template (optional)</label>
                  <Select
                    value={formData.template_id}
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      setFormData({
                        ...formData,
                        template_id: value,
                        name: template?.name || formData.name,
                        description: template?.description || formData.description,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Goal name (e.g., Register Business with RGD)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is the desired outcome?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Date (optional)</label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
