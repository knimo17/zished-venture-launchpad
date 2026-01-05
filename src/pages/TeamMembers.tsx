import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, UserPlus, Mail, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function TeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/admin');
      return;
    }
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can manage team members.',
        variant: 'destructive',
      });
      navigate('/team/tasks');
      return;
    }
    fetchMembers();
  }, [user, isAdmin]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: 'Error',
          description: 'A team member with this email already exists.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a unique invite token
      const inviteToken = crypto.randomUUID();

      // Insert team member with invite token (user_id will be set on signup)
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: formData.name,
          email: formData.email,
          invite_token: inviteToken,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invite email
      const { error: inviteError } = await supabase.functions.invoke('send-team-invite', {
        body: {
          email: formData.email,
          name: formData.name,
          invite_token: inviteToken,
        },
      });

      if (inviteError) {
        console.error('Failed to send invite email:', inviteError);
        toast({
          title: 'Member added',
          description: 'Team member added but invite email failed to send.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invite sent!',
          description: `An invite email has been sent to ${formData.email}`,
        });
      }

      setMembers((prev) => [data, ...prev]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '' });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add team member.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberStatus = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, is_active: !m.is_active } : m
        )
      );

      toast({
        title: member.is_active ? 'Member deactivated' : 'Member activated',
      });
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    try {
      // First delete from user_roles if they have a valid user_id (not the placeholder)
      if (member.user_id && member.user_id !== user?.id) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', member.user_id);
      }

      // Then delete the team member record
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast({ title: 'Member deleted successfully' });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team member.',
        variant: 'destructive',
      });
    } finally {
      setDeletingMember(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team/tasks')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No team members yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={() => toggleMemberStatus(member)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member. They will need to create an account with the same email to access the task system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team member's name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="team@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingMember?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingMember && handleDeleteMember(deletingMember)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
