import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, LogOut, Sparkles, Moon, Sun, Menu, X, Brain, BookOpen, Flame, Code2 } from 'lucide-react';
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/mentor', label: 'AI Mentor', icon: Brain, badge: 'new' },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen, badge: 'new' },
  { href: '/streaks', label: 'Streaks', icon: Flame },
  { href: '/interview', label: 'Mock Interview', icon: Code2, badge: 'new' },
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
            <span className="text-overline ml-2 hidden md:inline">beta</span>
          </Link>

          {isAuthed && (
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className={linkClass(item.href)}>
                  <item.icon size={15} strokeWidth={1.5} />
                  {item.label}
                  {item.badge && (
                    <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
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
                        {profile?.leetcode_username || 'no handle'}
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
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
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
          </nav>
        </div>
      )}
    </header>
  );
}
