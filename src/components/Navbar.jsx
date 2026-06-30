import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, LogOut, Sparkles, Moon, Sun, Menu, X, Brain, BookOpen, Flame, Code2, FileText, Layers, TrendingUp, Zap, Map, ChevronDown, Target, Briefcase, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  { href: '/mentor', label: 'AI Mentor', icon: Brain, badge: 'new' },
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
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, badge: 'new' },
  { href: '/streaks', label: 'Streaks', icon: Flame },
  { href: '/tracks', label: 'Learning Tracks', icon: Map },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthed = !!user;

  const linkClass = (href) =>
    `text-sm font-medium transition-colors flex items-center gap-1.5 ${
      location.pathname === href
        ? 'text-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <header className="bg-background/85 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles size={16} strokeWidth={1.75} />
            </span>
            <span className="font-heading text-lg tracking-tight">PrepSphere</span>
          </Link>

          {isAuthed && (
            <nav className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link key={item.href} to={item.href} className={linkClass(item.href) + " px-3"}>
                  <item.icon size={15} strokeWidth={1.5} />
                  {item.label}
                  {item.badge && (
                    <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Target size={15} strokeWidth={1.5} />
                    Practice
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {practiceItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon size={14} />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Briefcase size={15} strokeWidth={1.5} />
                    Career
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {careerItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon size={14} />
                        {item.label}
                        {item.badge && (
                          <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <GraduationCap size={15} strokeWidth={1.5} />
                    Learning
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {learningItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon size={14} />
                        {item.label}
                        {item.badge && (
                          <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {!isAuthed ? (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  Get started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar} alt={profile?.name} />
                      <AvatarFallback>
                        {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-tight">
                      <span className="text-sm font-medium">{profile?.name}</span>
                      <span className="text-xs text-muted-foreground font-mono-display">
                        {profile?.leetcodeUsername || 'no handle'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {profile?.college && `${profile.college}`}
                      {profile?.department && ` · ${profile.department}`}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { signOut(); navigate('/'); }} className="text-destructive">
                    <LogOut size={14} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isAuthed && mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-1">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2">Main</div>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  location.pathname === item.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge && (
                  <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="text-xs font-medium text-muted-foreground px-3 py-2 mt-2">Practice</div>
            {practiceItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  location.pathname === item.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <div className="text-xs font-medium text-muted-foreground px-3 py-2 mt-2">Career</div>
            {careerItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  location.pathname === item.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge && (
                  <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="text-xs font-medium text-muted-foreground px-3 py-2 mt-2">Learning</div>
            {learningItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  location.pathname === item.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge && (
                  <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
