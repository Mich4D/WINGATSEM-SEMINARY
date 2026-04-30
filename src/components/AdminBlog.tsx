import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Facebook, ExternalLink, Share2, ArrowLeft } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';

export default function AdminBlog({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState<string | null>(null);
  const [currentPost, setCurrentPost] = useState<any>({
    title: '', content: '', excerpt: '', cover_image_url: '', status: 'draft'
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
            showToast('Failed to load posts', 'error');
        }
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.content) {
      showToast('Title and content are required', 'error');
      return;
    }
    try {
      const payload = {
        title: currentPost.title,
        content: currentPost.content,
        excerpt: currentPost.excerpt || currentPost.content.substring(0, 150).replace(/<[^>]+>/g, '') + '...',
        cover_image_url: currentPost.cover_image_url,
        status: currentPost.status,
      };

      if (currentPost.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', currentPost.id);
        if (error) throw error;
        showToast('Post updated successfully', 'success');
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase.from('blog_posts').insert({
            ...payload, 
            author_id: userData.user?.id
        });
        if (error) {
            // Check if table exists
            if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                showToast('Blog feature not configured in database yet. Please run migration.', 'error');
                return;
            }
            throw error;
        }
        showToast('Post created successfully', 'success');
        if (currentPost.status === 'published') {
          // If we had a return ID, we could use it, but for now we look up the latest
          const { data: latestPost } = await supabase.from('blog_posts').select('id').order('created_at', { ascending: false }).limit(1).single();
          if (latestPost) setShowShareSuccess(latestPost.id);
        }
      }
      setIsEditing(false);
      setCurrentPost({ title: '', content: '', excerpt: '', cover_image_url: '', status: 'draft' });
      fetchPosts();
    } catch (err) {
      console.error('Save post error:', err);
      showToast(`Failed to save post: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      showToast('Post deleted', 'success');
      fetchPosts();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete post', 'error');
    }
  };

  if (showShareSuccess) {
    const postUrl = `${window.location.origin}/blog/${showShareSuccess}`;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center max-w-lg mx-auto my-12 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Published Successfully!</h2>
        <p className="text-slate-600 mb-8">Your post is now live. Share it with your community on Facebook to spread the word.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => {
              const url = encodeURIComponent(postUrl);
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
            }}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-all shadow-md group"
          >
            <Facebook size={24} /> <span>Share to Facebook Page</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                const text = encodeURIComponent(`Check out our new post: ${postUrl}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold rounded-xl transition-all shadow-sm"
            >
              <Share2 size={18} /> WhatsApp
            </button>
            <a 
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm border border-slate-200"
            >
              <ExternalLink size={18} /> View Post
            </a>
          </div>
          
          <button 
            onClick={() => setShowShareSuccess(null)}
            className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors py-2"
          >
            <ArrowLeft size={16} /> Back to Blog List
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{currentPost.id ? 'Edit Post' : 'Create New Post'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
              value={currentPost.title}
              onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image URL</label>
            <input 
              type="text" 
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
              value={currentPost.cover_image_url}
              onChange={(e) => setCurrentPost({ ...currentPost, cover_image_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt (Optional)</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
              value={currentPost.excerpt}
              onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Content (HTML supported)</label>
            <textarea 
              rows={8}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none font-mono text-sm"
              value={currentPost.content}
              onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
              value={currentPost.status}
              onChange={(e) => setCurrentPost({ ...currentPost, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} /> Save Post
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Blog Management</h2>
        <button 
          onClick={() => {
            setCurrentPost({ title: '', content: '', excerpt: '', cover_image_url: '', status: 'draft' });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-bold text-sm"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
          No blog posts found. Create one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-4 px-4 font-bold max-w-[200px]">Title</th>
                <th className="py-4 px-4 font-bold">Status</th>
                <th className="py-4 px-4 font-bold">Date</th>
                <th className="py-4 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-900">
                    <div className="line-clamp-1">{post.title}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setCurrentPost(post);
                        setIsEditing(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
