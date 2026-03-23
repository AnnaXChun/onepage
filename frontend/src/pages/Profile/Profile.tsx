import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfile, ProfileData } from '@/services/profileApi';
import { getDrafts } from '@/services/api';
import ProfileHeader from './ProfileHeader';
import BlogGrid from './BlogGrid';
import type { Blog } from '@/types/models';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileAndDrafts = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProfile(username);
        if (response.code === 200 && response.data) {
          setProfile(response.data);

          // Check if this is the current user's profile (has token)
          const token = localStorage.getItem('token');
          if (token) {
            // Fetch drafts for current user
            try {
              const draftsResponse = await getDrafts();
              if (draftsResponse.code === 200) {
                setDrafts(draftsResponse.data || []);
              }
            } catch (draftErr) {
              console.error('Failed to load drafts:', draftErr);
            }
          }
        } else {
          setError(response.message || 'User not found');
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndDrafts();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">User Not Found</h1>
          <p className="text-text-muted">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ProfileHeader profile={profile} />

        {/* Drafts Section - only show if user has drafts */}
        {drafts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                My Drafts ({drafts.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="group relative bg-surface rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/editor/${draft.id}`)}
                >
                  {draft.coverImage && (
                    <div className="aspect-video bg-background overflow-hidden">
                      <img
                        src={draft.coverImage}
                        alt={draft.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary truncate">
                      {draft.title || 'Untitled Draft'}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">
                      Last edited {new Date(draft.updateTime).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-500">
                        Draft
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                      Resume Editing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Sites Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              Published Sites ({profile.blogs.length})
            </h2>
            {profile.totalVisitors > 0 && (
              <span className="text-sm text-text-muted">
                {profile.totalVisitors.toLocaleString()} total views
              </span>
            )}
          </div>
          <BlogGrid blogs={profile.blogs} />
        </div>
      </div>
    </div>
  );
}