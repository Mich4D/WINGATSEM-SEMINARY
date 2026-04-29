import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, ArrowLeft, BookOpen, Share2 } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!id) return;
        
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, author:users!blog_posts_author_id_fkey(name)')
          .eq('id', id)
          .single();

        if (error) {
           // Fallback support if table doesn't exist
           if (id === '1') {
             setPost({
                id: '1',
                title: 'Welcome to WINGATSEM Blog',
                excerpt: 'Stay updated with the latest news and theological insights from Winning Gate Christian Theological Seminary.',
                content: '<p>Welcome to our official blog portal. We will post updates soon!</p><p>We believe in equipping leaders for the work of the ministry. Our theological training is fully loaded in English & Yoruba for effective service.</p>',
                created_at: new Date().toISOString(),
                status: 'published',
                author: { name: 'Admin' }
             });
           } else {
             setError('Post not found.');
           }
        } else if (data) {
          setPost(data);
        }
      } catch (err) {
        setError('Failed to load post.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Post Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'The article you are looking for does not exist or has been removed.'}</p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-all">
            <ArrowLeft size={18} /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-slate-50 min-h-screen pb-20">
      {/* Article Header */}
      <div className="bg-slate-900 pt-24 pb-32 text-center px-4 relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-bold mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to all articles
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-sm font-bold text-slate-300 uppercase tracking-widest shrink-0">
            <span className="flex items-center gap-2"><Calendar size={16} className="text-yellow-500" /> {new Date(post.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-2"><User size={16} className="text-yellow-500" /> {post.author?.name || 'Admin'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-[-80px] relative z-20">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mb-8">
          {post.cover_image_url && (
            <div className="w-full h-64 md:h-96">
              <img src={formatImageUrl(post.cover_image_url)} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-8 md:p-12">
            <div 
              className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-a:text-yellow-600 hover:prose-a:text-yellow-700 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors text-sm uppercase tracking-wide border border-slate-200"
                >
                  <Share2 size={16} /> Share Article
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
