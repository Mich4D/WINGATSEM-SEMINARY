import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, ArrowLeft, BookOpen, Share2, Facebook } from 'lucide-react';
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
            
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide"
                >
                  <Facebook size={16} /> Share on Facebook
                </button>
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`${post.title} - ${window.location.href}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg> Share on WhatsApp
                </button>
              </div>
              
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
                <Share2 size={16} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
