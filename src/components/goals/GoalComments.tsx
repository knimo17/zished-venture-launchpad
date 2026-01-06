import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentTeamMember } from '@/hooks/useCurrentTeamMember';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name?: string;
}

interface GoalCommentsProps {
  goalId: string;
}

export function GoalComments({ goalId }: GoalCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentMember, isAdmin } = useCurrentTeamMember();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [goalId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch author names
      const authorIds = [...new Set((data || []).map(c => c.author_id))];
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from('team_members')
          .select('id, name')
          .in('id', authorIds);

        const authorMap = new Map(authors?.map(a => [a.id, a.name]) || []);
        
        setComments((data || []).map(c => ({
          ...c,
          author_name: authorMap.get(c.author_id) || 'Unknown',
        })));
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentMember) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('goal_comments').insert({
        goal_id: goalId,
        author_id: currentMember.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('goal_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </div>

      {comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="font-medium">{comment.author_name}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  <p className="mt-1 text-foreground">{comment.content}</p>
                </div>
                {(currentMember?.id === comment.author_id || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentMember && (
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] text-sm"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
