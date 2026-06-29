import { Link } from 'react-router-dom';
import { Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  product: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'AI Mentor', href: '/mentor' },
    { label: 'Mock Interviews', href: '/interview' },
  ],
  community: [
    { label: 'Coding Clubs', href: '#' },
    { label: 'Universities', href: '#' },
    { label: 'Contact', href: '#' },
  ],
};

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid md:grid-cols-4 gap-8 text-sm">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles size={16} strokeWidth={1.75} />
            </span>
            <span className="font-heading font-bold text-lg tracking-tight">PrepSphere</span>
          </div>
          <p className="text-muted-foreground max-w-sm">
            A unified placement preparation workspace for engineering students. Built for focus, designed for outcomes.
          </p>
          <div className="mt-4 flex items-center gap-3">
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="text-overline mb-3">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            {footerLinks.product.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-overline mb-3">Community</div>
          <ul className="space-y-2 text-muted-foreground">
            {footerLinks.community.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PrepSphere. Built for engineering students.
      </div>
    </footer>
  );
}
