import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, ListTodo, Archive, Trash2, Edit } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { TeamHeader } from '@/components/TeamHeader';

interface TodoList {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  task_count?: number;
}

export default function TeamLists() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
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
      const { data: listsData, error: listsError } = await supabase
        .from('todo_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Get task counts for each list
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);
          return { ...list, task_count: count || 0 };
        })
      );

      setLists(listsWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lists.',
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
      if (editingList) {
        const { error } = await supabase
          .from('todo_lists')
          .update({
            name: formData.name,
            description: formData.description || null,
          })
          .eq('id', editingList.id);

        if (error) throw error;
        toast({ title: 'List updated!' });
      } else {
        if (!currentMember) {
          toast({ title: 'Error', description: 'You must be a team member', variant: 'destructive' });
          return;
        }

        const { error } = await supabase.from('todo_lists').insert({
          name: formData.name,
          description: formData.description || null,
          owner_id: currentMember.id,
        });

        if (error) throw error;
        toast({ title: 'List created!' });
      }

      setIsModalOpen(false);
      setEditingList(null);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving list:', error);
      toast({
        title: 'Error',
        description: 'Failed to save list.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (list: TodoList) => {
    try {
      const { error } = await supabase
        .from('todo_lists')
        .update({ is_archived: !list.is_archived })
        .eq('id', list.id);

      if (error) throw error;
      toast({ title: list.is_archived ? 'List restored!' : 'List archived!' });
      fetchData();
    } catch (error) {
      console.error('Error archiving list:', error);
      toast({ title: 'Error', description: 'Failed to archive list.', variant: 'destructive' });
    }
  };

  const handleDelete = async (listId: string) => {
    try {
      const { error } = await supabase.from('todo_lists').delete().eq('id', listId);
      if (error) throw error;
      toast({ title: 'List deleted!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({ title: 'Error', description: 'Failed to delete list.', variant: 'destructive' });
    }
  };

  const openEditModal = (list: TodoList) => {
    setEditingList(list);
    setFormData({ name: list.name, description: list.description || '' });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingList(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const filteredLists = lists.filter((list) =>
    showArchived ? list.is_archived : !list.is_archived
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
            <h1 className="text-3xl font-bold">Todo Lists</h1>
            <p className="text-muted-foreground">Organize your tasks into lists</p>
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
              New List
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLists.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {showArchived ? 'No archived lists.' : 'No lists yet.'}
                </p>
                {!showArchived && (
                  <Button className="mt-4" onClick={openCreateModal}>
                    Create your first list
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredLists.map((list) => (
              <Card key={list.id} className={list.is_archived ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(list)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(list)}
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
                            <AlertDialogTitle>Delete List</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{list.name}"? This will also delete all tasks in this list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(list.id)}
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
                  {list.description && (
                    <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {list.task_count} {list.task_count === 1 ? 'task' : 'tasks'}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingList ? 'Edit List' : 'Create New List'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="List name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this list for?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingList ? 'Save Changes' : 'Create List'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
