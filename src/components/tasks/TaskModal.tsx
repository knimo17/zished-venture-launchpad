import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Users, Bell, X } from 'lucide-react';
import CollaboratorSelect from './CollaboratorSelect';

interface Task {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  list_id: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface TodoList {
  id: string;
  name: string;
  owner_id: string;
}

interface Collaborator {
  id: string;
  team_member_id: string;
  role_description: string | null;
  team_member?: TeamMember;
}

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  teamMembers: TeamMember[];
  todoLists: TodoList[];
  currentMember: TeamMember | null;
  onSave: () => void;
}

export default function TaskModal({
  open,
  onOpenChange,
  task,
  teamMembers,
  todoLists,
  currentMember,
  onSave,
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    due_time: '',
    assigned_to: '',
    list_id: '',
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableReminders, setEnableReminders] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      setFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        status: task.status,
        priority: task.priority,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
        due_time: dueDate ? dueDate.toTimeString().slice(0, 5) : '',
        assigned_to: task.assigned_to || '',
        list_id: task.list_id,
      });
      fetchCollaborators(task.id);
    } else {
      setFormData({
        title: '',
        description: '',
        notes: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        due_time: '',
        assigned_to: currentMember?.id || '',
        list_id: todoLists[0]?.id || '',
      });
      setCollaborators([]);
    }
  }, [task, currentMember, todoLists]);

  const fetchCollaborators = async (taskId: string) => {
    const { data, error } = await supabase
      .from('task_collaborators')
      .select('*, team_members(*)')
      .eq('task_id', taskId);

    if (!error && data) {
      setCollaborators(
        data.map((c: any) => ({
          id: c.id,
          team_member_id: c.team_member_id,
          role_description: c.role_description,
          team_member: c.team_members,
        }))
      );
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    if (!formData.list_id) {
      toast({ title: 'Error', description: 'Please select a list', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const dueDateTime = formData.due_date
        ? new Date(`${formData.due_date}T${formData.due_time || '00:00'}:00`).toISOString()
        : null;

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        notes: formData.notes || null,
        status: formData.status,
        priority: formData.priority,
        due_date: dueDateTime,
        assigned_to: formData.assigned_to || null,
        list_id: formData.list_id,
      };

      let taskId = task?.id;

      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);

        if (error) throw error;
      } else {
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            created_by: currentMember?.id,
          })
          .select()
          .single();

        if (error) throw error;
        taskId = newTask.id;
      }

      // Create reminders if due date is set and reminders are enabled
      if (dueDateTime && enableReminders && taskId) {
        const dueDate = new Date(dueDateTime);
        const now = new Date();

        // Delete existing reminders for this task
        await supabase
          .from('task_reminders')
          .delete()
          .eq('task_id', taskId);

        const reminders = [];

        // Reminder 1 day before
        const dayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
        if (dayBefore > now) {
          reminders.push({
            task_id: taskId,
            reminder_type: 'before_due',
            scheduled_for: dayBefore.toISOString(),
          });
        }

        // Reminder on due date
        if (dueDate > now) {
          reminders.push({
            task_id: taskId,
            reminder_type: 'on_due',
            scheduled_for: dueDate.toISOString(),
          });
        }

        if (reminders.length > 0) {
          await supabase.from('task_reminders').insert(reminders);
        }
      }

      toast({ title: task ? 'Task updated!' : 'Task created!' });
      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to save task.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;

      toast({ title: 'Task deleted!' });
      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task.',
        variant: 'destructive',
      });
    }
  };

  const addCollaborator = async (memberId: string, roleDescription: string) => {
    if (!task) {
      toast({
        title: 'Save task first',
        description: 'Please save the task before adding collaborators.',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_collaborators')
        .insert({
          task_id: task.id,
          team_member_id: memberId,
          role_description: roleDescription || null,
        })
        .select('*, team_members(*)')
        .single();

      if (error) throw error;

      setCollaborators((prev) => [
        ...prev,
        {
          id: data.id,
          team_member_id: data.team_member_id,
          role_description: data.role_description,
          team_member: data.team_members,
        },
      ]);

      toast({ title: 'Collaborator added!' });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already added',
          description: 'This team member is already a collaborator.',
        });
      } else {
        console.error('Error adding collaborator:', error);
        toast({
          title: 'Error',
          description: 'Failed to add collaborator.',
          variant: 'destructive',
        });
      }
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from('task_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
      toast({ title: 'Collaborator removed!' });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove collaborator.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>List</Label>
              <Select
                value={formData.list_id}
                onValueChange={(value) => setFormData({ ...formData, list_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {todoLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Due Time</Label>
              <Input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          {formData.due_date && (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Email reminders</Label>
              <input
                type="checkbox"
                checked={enableReminders}
                onChange={(e) => setEnableReminders(e.target.checked)}
                className="ml-auto"
              />
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {task && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <Label>Collaborators</Label>
              </div>

              <div className="space-y-2 mb-3">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between bg-muted p-2 rounded"
                  >
                    <div>
                      <span className="font-medium">{collab.team_member?.name}</span>
                      {collab.role_description && (
                        <span className="text-sm text-muted-foreground ml-2">
                          - {collab.role_description}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCollaborator(collab.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <CollaboratorSelect
                teamMembers={teamMembers.filter(
                  (m) => !collaborators.some((c) => c.team_member_id === m.id)
                )}
                onAdd={addCollaborator}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {task && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
