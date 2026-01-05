import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
  ListTodo,
  StickyNote,
} from 'lucide-react';
import TaskModal from '@/components/tasks/TaskModal';
import TaskFilters from '@/components/tasks/TaskFilters';
import { Footer } from '@/components/Footer';
import { TeamHeader } from '@/components/TeamHeader';

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
  completed_at: string | null;
  list_id: string;
  created_at: string;
  todo_lists: {
    id: string;
    name: string;
  };
  assigned_member?: {
    id: string;
    name: string;
  };
}

interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
}

interface TodoList {
  id: string;
  name: string;
  owner_id: string;
}

export default function TeamTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    list: 'all',
  });

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
      // Get all team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, name, email, user_id')
        .eq('is_active', true);

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);

      // Get todo lists
      const { data: listsData, error: listsError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('is_archived', false);

      if (listsError) throw listsError;
      setTodoLists(listsData || []);

      // Get tasks with related data
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          todo_lists (id, name)
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      // Map assigned member names
      const tasksWithMembers = (tasksData || []).map((task) => ({
        ...task,
        assigned_member: membersData?.find((m) => m.id === task.assigned_to),
      }));

      setTasks(tasksWithMembers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks.',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 'completed' : 'pending';
    const completedAt = completed ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, status: newStatus, completed_at: completedAt }
            : task
        )
      );

      toast({
        title: completed ? 'Task completed!' : 'Task reopened',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task.',
        variant: 'destructive',
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && task.assigned_to !== filters.assignee) return false;
    if (filters.list !== 'all' && task.list_id !== filters.list) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <Pause className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return (
      <Badge variant={variants[priority] || 'secondary'} className="capitalize">
        {priority}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

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
            <h1 className="text-3xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">
              {currentMember ? `Welcome back, ${currentMember.name.split(' ')[0]}` : 'Manage your tasks'}
            </p>
          </div>
          <Button onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          teamMembers={teamMembers}
          todoLists={todoLists}
        />

        <div className="grid gap-4 mt-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tasks found.</p>
                <Button
                  className="mt-4"
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                >
                  Create your first task
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  task.status === 'completed' ? 'opacity-60' : ''
                }`}
                onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) =>
                          handleStatusChange(task.id, checked as boolean)
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(task.status)}
                        <h3
                          className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        {getPriorityBadge(task.priority)}
                        {isOverdue(task.due_date) && task.status !== 'completed' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      {task.notes && (
                        <div className="flex items-start gap-1.5 mt-2 text-xs bg-muted/50 p-2 rounded">
                          <StickyNote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                          <p className="text-muted-foreground line-clamp-2">{task.notes}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          {task.todo_lists?.name}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.assigned_member && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {task.assigned_member.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <TaskModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          task={selectedTask}
          teamMembers={teamMembers}
          todoLists={todoLists}
          currentMember={currentMember}
          onSave={fetchData}
        />
      </main>
      <Footer />
    </div>
  );
}
