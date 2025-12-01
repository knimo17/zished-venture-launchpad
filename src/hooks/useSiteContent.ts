import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteContent {
  [key: string]: string;
}

export function useSiteContent(section?: string) {
  const [content, setContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [section]);

  const fetchContent = async () => {
    try {
      let query = supabase.from('site_content').select('key, value');
      
      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;

      if (error) throw error;

      const contentMap: SiteContent = {};
      data?.forEach((item) => {
        contentMap[item.key] = item.value;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, refetch: fetchContent };
}

export function useAllSiteContent() {
  const [content, setContent] = useState<Array<{
    id: string;
    key: string;
    value: string;
    section: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, value: string) => {
    const { error } = await supabase
      .from('site_content')
      .update({ value })
      .eq('id', id);

    if (error) throw error;
    await fetchContent();
  };

  return { content, loading, refetch: fetchContent, updateContent };
}
