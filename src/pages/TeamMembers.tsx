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
import { UserPlus, Mail, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { TeamHeader } from '@/components/TeamHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { Permission, useTeamMemberPermissions } from '@/hooks/useTeamMemberPermissions';

interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  permissions?: Permission[];
}

const AVAILABLE_PERMISSIONS: { value: Permission; label: string }[] = [
  { value: 'view_applications', label: 'View Applications' },
  { value: 'view_weekly_reports', label: 'View Weekly Reports' },
  { value: 'assign_tasks', label: 'Assign Tasks to Others' },
  { value: 'view_all_goals', label: 'View All Goals' },
  { value: 'assign_goals', label: 'Assign Goals to Others' },
  { value: 'manage_team_members', label: 'Manage Team Members' },
];

export default function TeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [permissionsModalMember, setPermissionsModalMember] = useState<TeamMember | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<Permission[]>([]);

  const { user, isAdmin } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useTeamMemberPermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const canManageTeam = isAdmin || hasPermission('manage_team_members');

  useEffect(() => {
    if (permissionsLoading) return;
    
    if (!user) {
      navigate('/team/login');
      return;
    }
    if (!canManageTeam) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view team members.',
        variant: 'destructive',
      });
      navigate('/team/goals');
      return;
    }
    fetchMembers();
  }, [user, canManageTeam, permissionsLoading]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch permissions for all members
      const { data: permissionsData } = await supabase
        .from('team_member_permissions')
        .select('team_member_id, permission');

      const membersWithPermissions = (data || []).map((member) => ({
        ...member,
        permissions: (permissionsData || [])
          .filter((p) => p.team_member_id === member.id)
          .map((p) => p.permission as Permission),
      }));

      setMembers(membersWithPermissions);
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
      const currentAdminMemberId = members.find((m) => m.user_id === user?.id)?.id;

      if (!currentAdminMemberId) {
        toast({
          title: 'Error',
          description: 'Could not identify your team member record. Please refresh and try again.',
          variant: 'destructive',
        });
        return;
      }

      if (member.id === currentAdminMemberId) {
        toast({
          title: 'Action not allowed',
          description: "You can't delete your own account.",
          variant: 'destructive',
        });
        return;
      }

      // Reassign/cleanup dependent records so deletion can't break tasks/lists
      await supabase.from('task_collaborators').delete().eq('team_member_id', member.id);
      await supabase.from('tasks').update({ assigned_to: null }).eq('assigned_to', member.id);
      await supabase.from('tasks').update({ created_by: currentAdminMemberId }).eq('created_by', member.id);
      await supabase.from('goals').update({ owner_id: currentAdminMemberId }).eq('owner_id', member.id);

      // Delete the team member record
      const { error } = await supabase.from('team_members').delete().eq('id', member.id);
      if (error) throw error;

      // Remove roles for the user (if this member had an auth account)
      if (member.user_id) {
        const { error: roleDeleteError } = await supabase.from('user_roles').delete().eq('user_id', member.user_id);
        if (roleDeleteError) throw roleDeleteError;
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast({ title: 'Member deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting member:', error);

      // Common case: DB constraints due to references
      const message =
        error?.code === '23502'
          ? 'This member is referenced by existing tasks/lists. Deactivate them instead.'
          : 'Failed to delete team member.';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingMember(null);
    }
  };

  const openPermissionsModal = (member: TeamMember) => {
    setPermissionsModalMember(member);
    setMemberPermissions(member.permissions || []);
  };

  const togglePermission = (permission: Permission) => {
    setMemberPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const savePermissions = async () => {
    if (!permissionsModalMember) return;

    try {
      // Delete existing permissions
      await supabase
        .from('team_member_permissions')
        .delete()
        .eq('team_member_id', permissionsModalMember.id);

      // Insert new permissions
      if (memberPermissions.length > 0) {
        const { error } = await supabase.from('team_member_permissions').insert(
          memberPermissions.map((permission) => ({
            team_member_id: permissionsModalMember.id,
            permission,
          }))
        );
        if (error) throw error;
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === permissionsModalMember.id
            ? { ...m, permissions: memberPermissions }
            : m
        )
      );

      toast({ title: 'Permissions updated' });
      setPermissionsModalMember(null);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions.',
        variant: 'destructive',
      });
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
    <div className="min-h-screen bg-background">
      <TeamHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-muted-foreground">Manage your team</p>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPermissionsModal(member)}
                          title="Manage permissions"
                        >
                          {(member.permissions?.length || 0) > 0 ? (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingMember(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      <Dialog open={!!permissionsModalMember} onOpenChange={(open) => !open && setPermissionsModalMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Set permissions for <strong>{permissionsModalMember?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {AVAILABLE_PERMISSIONS.map((perm) => (
              <div key={perm.value} className="flex items-center space-x-3">
                <Checkbox
                  id={perm.value}
                  checked={memberPermissions.includes(perm.value)}
                  onCheckedChange={() => togglePermission(perm.value)}
                />
                <label
                  htmlFor={perm.value}
                  className="text-sm font-medium cursor-pointer"
                >
                  {perm.label}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsModalMember(null)}>
              Cancel
            </Button>
            <Button onClick={savePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}
