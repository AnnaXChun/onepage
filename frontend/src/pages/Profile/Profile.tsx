import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProfile, ProfileData } from '@/services/profileApi';
import ProfileHeader from './ProfileHeader';
import BlogGrid from './BlogGrid';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProfile(username);
        if (response.code === 200 && response.data) {
          setProfile(response.data);
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

    loadProfile();
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