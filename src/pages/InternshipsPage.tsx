import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Internship {
  id: string;
  title: string;
  portfolio_company: string;
  description: string;
  responsibilities: string;
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Open Internships</h1>
            <p className="text-lg text-muted-foreground">
              Join one of our portfolio companies and gain hands-on experience building real ventures
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading internships...</p>
            </div>
          ) : internships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  No open internships at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {internships.map((internship) => (
                <Card key={internship.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{internship.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        {internship.portfolio_company}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About the Role</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {internship.description}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Responsibilities</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {internship.responsibilities}
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => navigate(`/apply?internship=${internship.id}`)}
                        size="lg"
                        className="w-full"
                      >
                        Apply for this Internship
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
