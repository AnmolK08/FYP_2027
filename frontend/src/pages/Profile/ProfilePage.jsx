import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicProfile } from '../../features/profile/hooks/usePublicProfile';
import Sidebar from '../../components/Sidebar';
import { toast } from 'sonner';
import { ArrowLeft, UserX, Copy, Check, Code2, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformTab, LeetCodeView, CodeforcesView } from '../Dashboard/DashboardPage';

export default function ProfilePage() {
  const { username } = useParams();
  const { data: profileData, isLoading, error } = usePublicProfile(username);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState('leetcode');

  const profileUser = profileData?.user;

  const handleCopyLink = () => {
    const handle = profileUser?.lucyUsername || username;
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(`Profile link copied: /u/${handle}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
            {error || (!isLoading && !profileUser) ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <UserX size={32} />
                </div>
                <h1 className="font-heading text-2xl text-foreground">Student Not Found</h1>
                <p className="text-muted-foreground text-sm mt-2 max-w-md">
                  We couldn&apos;t find a public profile matching <span className="font-mono-display text-foreground font-medium">&quot;{username}&quot;</span>. The student may not have set up their handle yet or may have updated it.
                </p>
                <Link to="/leaderboard" className="mt-6">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft size={14} /> Explore Leaderboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div className="text-overline h-4 flex items-center">
                      <Link
                        to="/leaderboard"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <ArrowLeft size={12} /> Back to Leaderboard
                      </Link>
                    </div>
                    <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                      {profileUser?.name?.split(' ')[0] || username || 'Student'}&apos;s Sphere
                    </h1>
                    <div className="text-muted-foreground mt-2 text-sm flex flex-wrap items-center gap-2">
                      <span className="font-mono-display font-medium text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border">
                        @{profileUser?.lucyUsername || username}
                      </span>
                      {profileUser?.college && <span>• {profileUser.college.toUpperCase()}</span>}
                      {profileUser?.department && <span> - {profileUser.department}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 h-9">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 h-9 font-mono-display text-xs"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-500" /> Copied Link
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Share /u/
                          {profileUser?.lucyUsername || username || "user"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="mt-12 text-muted-foreground font-mono-display text-sm" data-testid="profile-loading">
                    loading stats...
                  </div>
                ) : (
                  <>
                    {/* ── Platform switcher ── */}
                    <div
                      className="mt-6 inline-flex items-center gap-1 bg-muted border border-border rounded-lg p-1"
                      role="tablist"
                      aria-label="Platform view"
                    >
                      <PlatformTab
                        active={platform === "leetcode"}
                        onClick={() => setPlatform("leetcode")}
                        icon={<Code2 size={14} />}
                        label="LeetCode"
                        connected={!!profileUser?.leetcodeUsername}
                        isPublic={true}
                      />
                      <PlatformTab
                        active={platform === "codeforces"}
                        onClick={() => setPlatform("codeforces")}
                        icon={<Swords size={14} />}
                        label="Codeforces"
                        connected={!!profileUser?.codeforcesUsername}
                        isPublic={true}
                      />
                    </div>

                    {/* ── Platform content ── */}
                    {platform === "leetcode" ? (
                      <LeetCodeView data={{
                        connected: !!profileUser?.leetcodeUsername,
                        synced: !!profileData?.stats,
                        stats: profileData?.stats,
                      }} profile={profileUser} isPublic={true} />
                    ) : (
                      <CodeforcesView data={{
                        connected: !!profileUser?.codeforcesUsername,
                        synced: !!profileData?.codeforces,
                        stats: profileData?.codeforces,
                      }} profile={profileUser} isPublic={true} />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </main>
    </div>
  );
}
