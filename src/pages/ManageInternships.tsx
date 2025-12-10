import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

interface Internship {
  id: string;
  title: string;
  portfolio_company: string;
  description: string;
  responsibilities: string;
  is_active: boolean;
}

export default function ManageInternships() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    portfolio_company: '',
    description: '',
    responsibilities: '',
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchInternships();
    }
  }, [isAdmin]);

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('internships')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Internship updated successfully' });
      } else {
        const { error } = await supabase
          .from('internships')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Internship created successfully' });
      }

      setFormData({
        title: '',
        portfolio_company: '',
        description: '',
        responsibilities: '',
        is_active: true,
      });
      setEditingId(null);
      fetchInternships();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (internship: Internship) => {
    setFormData({
      title: internship.title,
      portfolio_company: internship.portfolio_company,
      description: internship.description,
      responsibilities: internship.responsibilities,
      is_active: internship.is_active,
    });
    setEditingId(internship.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internship?')) return;

    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Internship deleted successfully' });
      fetchInternships();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Manage Internships</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Internship' : 'Create New Internship'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the internship details below' : 'Add a new internship opportunity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_company">Portfolio Company</Label>
                  <Input
                    id="portfolio_company"
                    value={formData.portfolio_company}
                    onChange={(e) => setFormData({ ...formData, portfolio_company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to applicants)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'} Internship
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        title: '',
                        portfolio_company: '',
                        description: '',
                        responsibilities: '',
                        is_active: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Existing Internships</h2>
          {internships.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No internships created yet
              </CardContent>
            </Card>
          ) : (
            internships.map((internship) => (
              <Card key={internship.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{internship.title}</CardTitle>
                      <CardDescription>{internship.portfolio_company}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(internship)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(internship.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Status:</strong> {internship.is_active ? 'Active' : 'Inactive'}</p>
                    <p><strong>Description:</strong> {internship.description}</p>
                    <p><strong>Responsibilities:</strong> {internship.responsibilities}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
