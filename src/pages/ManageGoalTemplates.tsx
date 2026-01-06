import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  default_priority: string;
  is_required: boolean;
  order_index: number;
  completion_criteria: string | null;
  depends_on_order: number | null;
}

interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  task_templates?: TaskTemplate[];
}

export default function ManageGoalTemplates() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [taskForms, setTaskForms] = useState<Omit<TaskTemplate, 'id'>[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('goal_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch task templates for each goal template
      const templatesWithTasks = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: taskData } = await supabase
            .from('task_templates')
            .select('*')
            .eq('goal_template_id', template.id)
            .order('order_index');
          
          return { ...template, task_templates: taskData || [] };
        })
      );

      setTemplates(templatesWithTasks);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({ name: '', description: '', is_active: true });
    setTaskForms([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: GoalTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      is_active: template.is_active,
    });
    setTaskForms(
      (template.task_templates || []).map((t) => ({
        title: t.title,
        description: t.description,
        default_priority: t.default_priority,
        is_required: t.is_required,
        order_index: t.order_index,
        completion_criteria: t.completion_criteria,
        depends_on_order: t.depends_on_order,
      }))
    );
    setIsDialogOpen(true);
  };

  const addTaskForm = () => {
    setTaskForms([
      ...taskForms,
      {
        title: '',
        description: null,
        default_priority: 'medium',
        is_required: true,
        order_index: taskForms.length,
        completion_criteria: null,
        depends_on_order: null,
      },
    ]);
  };

  const updateTaskForm = (index: number, field: string, value: unknown) => {
    const updated = [...taskForms];
    updated[index] = { ...updated[index], [field]: value };
    setTaskForms(updated);
  };

  const removeTaskForm = (index: number) => {
    const updated = taskForms.filter((_, i) => i !== index);
    // Re-index order
    setTaskForms(updated.map((t, i) => ({ ...t, order_index: i })));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('goal_templates')
          .update({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingTemplate.id);

        if (updateError) throw updateError;

        // Delete existing task templates and re-create
        await supabase
          .from('task_templates')
          .delete()
          .eq('goal_template_id', editingTemplate.id);

        if (taskForms.length > 0) {
          const { error: taskError } = await supabase
            .from('task_templates')
            .insert(
              taskForms.map((t) => ({
                goal_template_id: editingTemplate.id,
                title: t.title,
                description: t.description,
                default_priority: t.default_priority,
                is_required: t.is_required,
                order_index: t.order_index,
                completion_criteria: t.completion_criteria,
                depends_on_order: t.depends_on_order,
              }))
            );

          if (taskError) throw taskError;
        }

        toast({ title: 'Template updated successfully' });
      } else {
        // Create new template
        const { data: newTemplate, error: createError } = await supabase
          .from('goal_templates')
          .insert({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Create task templates
        if (taskForms.length > 0 && newTemplate) {
          const { error: taskError } = await supabase
            .from('task_templates')
            .insert(
              taskForms.map((t) => ({
                goal_template_id: newTemplate.id,
                title: t.title,
                description: t.description,
                default_priority: t.default_priority,
                is_required: t.is_required,
                order_index: t.order_index,
                completion_criteria: t.completion_criteria,
                depends_on_order: t.depends_on_order,
              }))
            );

          if (taskError) throw taskError;
        }

        toast({ title: 'Template created successfully' });
      }

      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete task templates first (cascade should handle this, but being explicit)
      await supabase.from('task_templates').delete().eq('goal_template_id', id);
      
      const { error } = await supabase
        .from('goal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(templates.filter((t) => t.id !== id));
      toast({ title: 'Template deleted' });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTemplates(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Goal Templates</h1>
            <p className="text-muted-foreground">
              Create reusable templates with pre-defined tasks
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <div className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No templates yet. Create your first template to get started.
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Collapsible
                key={template.id}
                open={expandedTemplates.has(template.id)}
                onOpenChange={() => toggleExpanded(template.id)}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            {expandedTemplates.has(template.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {template.name}
                            {!template.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </CardTitle>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {template.task_templates?.length || 0} tasks
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This will also delete all associated task templates.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(template.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {template.task_templates && template.task_templates.length > 0 ? (
                        <div className="space-y-2 border-t pt-4">
                          <p className="text-sm font-medium mb-3">Task Templates:</p>
                          {template.task_templates.map((task, index) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <span className="text-sm text-muted-foreground w-6">
                                {index + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <Badge className={getPriorityColor(task.default_priority)}>
                                {task.default_priority}
                              </Badge>
                              {task.is_required && (
                                <Badge variant="outline">Required</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground border-t pt-4">
                          No task templates defined
                        </p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., New Hire Onboarding"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this template"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active (visible when creating goals)</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base">Task Templates</Label>
                <Button variant="outline" size="sm" onClick={addTaskForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>

              {taskForms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks added yet. Click "Add Task" to define tasks for this template.
                </p>
              ) : (
                <div className="space-y-4">
                  {taskForms.map((task, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Task {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTaskForm(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={task.title}
                          onChange={(e) =>
                            updateTaskForm(index, 'title', e.target.value)
                          }
                          placeholder="Task title"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={task.description || ''}
                          onChange={(e) =>
                            updateTaskForm(index, 'description', e.target.value || null)
                          }
                          placeholder="Task description"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Priority</Label>
                          <Select
                            value={task.default_priority}
                            onValueChange={(value) =>
                              updateTaskForm(index, 'default_priority', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <Switch
                            id={`required-${index}`}
                            checked={task.is_required}
                            onCheckedChange={(checked) =>
                              updateTaskForm(index, 'is_required', checked)
                            }
                          />
                          <Label htmlFor={`required-${index}`}>Required</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
