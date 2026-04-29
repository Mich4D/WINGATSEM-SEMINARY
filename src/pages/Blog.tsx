import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, author:users!blog_posts_author_id_fkey(name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          // Fallback if table doesn't exist
          if (error.message.includes('does not exist')) {
            setPosts([
              {
                id: '1',
                title: 'Welcome to WINGATSEM Blog',
                excerpt: 'Stay updated with the latest news and theological insights from Winning Gate Christian Theological Seminary.',
                content: '<p>Welcome to our official blog portal. We will post updates soon!</p>',
                created_at: new Date().toISOString(),
                status: 'published',
                author: { name: 'Admin' }
              }
            ]);
            setError('Notice: The blog_posts table is not configured in the database yet. Showing sample data.');
          } else {
            console.error('Error fetching posts:', error);
          }
        } else if (data) {
          // If no posts yet but table exists
          if (data.length === 0) {
            setPosts([]);
          } else {
            setPosts(data);
          }
        }
      } catch (err: any) {
         setError('Failed to load blog posts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-0"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Theological Insights</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            News, articles, and spiritual encouragement from our distinguished faculty and guest writers.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-40px] relative z-20">
        
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded shadow-sm text-yellow-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Posts Yet</h3>
            <p className="text-slate-500">Check back later for new articles and insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col group hover:-translate-y-1">
                {post.cover_image_url ? (
                  <div className="h-56 overflow-hidden">
                    <img 
                      src={formatImageUrl(post.cover_image_url)} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-56 bg-slate-900 flex items-center justify-center">
                    <BookOpen size={48} className="text-slate-700" />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><User size={14} /> {post.author?.name || 'Admin'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-yellow-600 transition-colors">{post.title}</h3>
                  <p className="text-slate-600 line-clamp-3 mb-6 flex-grow">{post.excerpt}</p>
                  <Link 
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
                  >
                    Read Article <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
