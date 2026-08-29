import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Trophy, LogOut, Sparkles, Moon, Sun, 
  Brain, BookOpen, Flame, Code2, FileText, Layers, 
  TrendingUp, Zap, Map, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, badge: 'new' },
];

const practiceItems = [
  { href: '/problems', label: 'DSA Bank', icon: Layers },
  { href: '/flashcards', label: 'Flashcards', icon: Zap },
  { href: '/predictor', label: 'Contest Predictor', icon: TrendingUp },
];

const careerItems = [
  { href: '/resume', label: 'Resume ATS', icon: FileText },
  { href: '/interview', label: 'Mock Interview', icon: Code2, badge: 'new' },
  { href: '/system-design', label: 'System Design', icon: Code2 },
];

const learningItems = [
  { href: '/mentor', label: 'AI Mentor', icon: Brain, badge: 'new' },
  { href: '/streaks', label: 'Streaks', icon: Flame },
  { href: '/tracks', label: 'Learning Tracks', icon: Map },
];

export default function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const linkClass = (href) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
      location.pathname === href
        ? 'bg-muted text-foreground font-medium'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  const renderNavGroup = (title, items) => (
    <div className="mt-4 flex flex-col gap-1">
      {isExpanded && (
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1 mt-2">
          {title}
        </div>
      )}
      {items.map((item) => (
        <Link key={item.href} to={item.href} className={linkClass(item.href)} title={!isExpanded ? item.label : undefined}>
          <item.icon size={18} strokeWidth={1.75} className="shrink-0" />
          {isExpanded && (
            <span className="flex-1 text-sm whitespace-nowrap">{item.label}</span>
          )}
          {isExpanded && item.badge && (
            <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full shrink-0">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );

  return (
    <aside 
      className={`bg-background/95 backdrop-blur-md border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link to="/" className={`flex items-center gap-2 ${!isExpanded ? 'justify-center w-full' : ''}`}>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            <Sparkles size={16} strokeWidth={1.75} />
          </span>
          {isExpanded && <span className="font-heading text-lg tracking-tight whitespace-nowrap">PrepSphere</span>}
        </Link>
        {isExpanded && (
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => setIsExpanded(false)}>
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {!isExpanded && (
        <div className="flex justify-center mt-2 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsExpanded(true)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Nav Scroll Area */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar ${isExpanded ? 'px-3' : 'px-2 flex flex-col items-center'}`}>
        {renderNavGroup('Main', mainNavItems)}
        {renderNavGroup('Practice', practiceItems)}
        {renderNavGroup('Career', careerItems)}
        {renderNavGroup('Learning', learningItems)}
      </div>

      {/* Footer (Theme & Profile) */}
      <div className={`border-t border-border p-3 flex flex-col shrink-0 gap-3 ${isExpanded ? '' : 'items-center'}`}>
        <Button
          variant="ghost"
          size={isExpanded ? 'default' : 'icon'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`h-9 ${isExpanded ? 'w-full justify-start gap-3 px-3' : 'w-9'}`}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {isExpanded && <span className="text-sm">Theme</span>}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`h-9 px-2 gap-3 ${isExpanded ? 'w-full justify-start' : 'w-9 justify-center'}`}>
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={profile?.avatar} alt={profile?.name} />
                <AvatarFallback>
                  {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <div className="flex flex-col items-start leading-tight min-w-0 overflow-hidden">
                  <span className="text-sm font-medium truncate w-full text-left">{profile?.name}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isExpanded ? "end" : "start"} side="right" className="w-56 bg-card">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-start px-2 py-1.5 cursor-default">
              <div className="text-xs text-muted-foreground font-mono-display">
                {profile?.leetcodeUsername || 'no handle'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {profile?.college && `${profile.college}`}
                {profile?.department && ` · ${profile.department}`}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { signOut(); navigate('/'); }} className="text-destructive cursor-pointer">
              <LogOut size={14} className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
