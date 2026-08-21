import { Bell, Bot, ChevronDown, CircleHelp, FileClock, Gauge, Inbox, Library, Menu, Search, Settings2, ShieldCheck, Users, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';

const navGroups = [
  { label: 'Command', items: [{ href: '/dashboard', label: 'Overview', icon: Gauge }, { href: '/tickets', label: 'Ticket queue', icon: Inbox }] },
  { label: 'Workspace', items: [{ href: '/customers', label: 'Customers', icon: Users }, { href: '/knowledge', label: 'Knowledge base', icon: Library }, { href: '/ai-assistant', label: 'AI assistant', icon: Bot }] },
  { label: 'Insights', items: [{ href: '/analytics', label: 'Analytics', icon: Gauge }, { href: '/team', label: 'Team workload', icon: Users }, { href: '/audit-logs', label: 'Audit logs', icon: FileClock }] },
];

function Logo() {
  return <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-logo">
    <span className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground)/.16)]">
      <span className="absolute left-2 top-2 size-2 rounded-full border-2 border-current" />
      <span className="absolute bottom-2 right-2 size-2 rounded-full border-2 border-current" />
      <span className="h-px w-4 rotate-45 bg-current" />
    </span>
    <span className="font-display text-[17px] font-bold tracking-tight text-sidebar-foreground">OpsPilot <span className="text-primary">AI</span></span>
  </Link>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const health = useHealthCheck();
  const unread = 3;
  return <div className="noise min-h-[100dvh] bg-background text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-8 flex items-center justify-between px-2"><Logo /><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" data-testid="button-close-sidebar"><X size={18} /></button></div>
      <div className="mb-6 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <div className="mb-2 flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-sidebar-foreground/50">Live operations</span><span className={`flex items-center gap-1 text-[10px] ${health.isError ? 'text-[#efaa91]' : 'text-[#9bd3a1]'}`}><span className={`size-1.5 rounded-full ${health.isError ? 'bg-[#efaa91]' : 'bg-[#9bd3a1]'}`} /> {health.isError ? 'degraded' : 'synced'}</span></div>
        <div className="flex items-end justify-between"><span className="font-display text-2xl font-semibold text-sidebar-foreground">42</span><span className="pb-1 text-xs text-sidebar-foreground/55">open now</span></div>
      </div>
      <nav className="flex-1 space-y-6">
        {navGroups.map((group) => <div key={group.label}><p className="mb-2 px-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/35">{group.label}</p><div className="space-y-1">{group.items.map(({ href, label, icon: Icon }) => { const active = location === href || (href === '/dashboard' && location === '/'); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary font-semibold text-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} strokeWidth={active ? 2.2 : 1.7} /><span>{label}</span>{label === 'Ticket queue' && <span className={`ml-auto rounded-md px-1.5 py-0.5 font-mono-ui text-[10px] ${active ? 'bg-foreground/15' : 'bg-sidebar-accent text-sidebar-foreground/55'}`}>42</span>}</Link>; })}</div></div>)}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border pt-4">
        <Link href="/notifications" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${location === '/notifications' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent'}`} data-testid="link-nav-notifications"><Bell size={17} /><span>Notifications</span>{unread > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#ef8c70] text-[10px] font-bold text-[#351d1a]">{unread}</span>}</Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent" data-testid="link-nav-settings"><Settings2 size={17} /><span>Settings</span></Link>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3"><span className="grid size-8 place-items-center rounded-full bg-[#9bbdd0] text-xs font-bold text-[#203343]">MC</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-sidebar-foreground">Maya Chen</p><p className="truncate text-[11px] text-sidebar-foreground/45">Operations lead</p></div><ChevronDown size={14} className="text-sidebar-foreground/45" /></div>
    </aside>
    {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-foreground/25 md:hidden" data-testid="button-sidebar-overlay" />}
    <main className="min-h-[100dvh] md:pl-[256px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-lg border border-border p-2 md:hidden" data-testid="button-open-sidebar"><Menu size={18} /></button><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span className="font-mono-ui text-[11px] uppercase tracking-wider">Workspace</span><span>/</span><span className="text-foreground">{location === '/' || location === '/dashboard' ? 'Overview' : location.split('/')[1]?.replace('-', ' ')}</span></div></div>
        <div className="flex items-center gap-2"><button onClick={() => window.alert('Global search is ready for your next query.')} className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm transition hover:border-accent sm:flex" data-testid="button-global-search"><Search size={15} /><span>Search anything</span><kbd className="ml-5 rounded bg-muted px-1.5 py-0.5 font-mono-ui text-[10px]">⌘ K</kbd></button><Link href="/notifications" className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" data-testid="link-header-notifications"><Bell size={18} />{unread > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#e97c61]" />}</Link><Link href="/settings" className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" data-testid="link-help"><CircleHelp size={18} /></Link></div>
      </header>
      <div className="mx-auto max-w-[1510px] p-5 md:p-8">{children}</div>
    </main>
  </div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end animate-enter"><div><div className="mb-2 flex items-center gap-2 font-mono-ui text-[10px] font-medium uppercase tracking-[.18em] text-accent">{eyebrow ?? 'Operations'}</div><h1 className="font-display text-3xl font-bold tracking-[-.04em] text-foreground md:text-[40px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-border bg-card shadow-[0_2px_0_hsl(var(--foreground)/.025)] ${className}`}>{children}</section>; }
export function SectionLabel({ children }: { children: ReactNode }) { return <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground">{children}</p>; }
export function StatusPill({ value, tone }: { value: string; tone?: 'good' | 'warn' | 'danger' | 'neutral' }) { const t = tone ?? (value.toLowerCase().includes('urgent') || value.toLowerCase().includes('breach') ? 'danger' : value.toLowerCase().includes('pending') || value.toLowerCase().includes('risk') ? 'warn' : value.toLowerCase().includes('resolved') || value.toLowerCase().includes('active') ? 'good' : 'neutral'); const styles = { good: 'bg-[#dff2e4] text-[#25613a]', warn: 'bg-[#fff0c8] text-[#795514]', danger: 'bg-[#fbe0da] text-[#8c352b]', neutral: 'bg-muted text-muted-foreground' }; return <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[t]}`}>{value}</span>; }
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) { const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2); return <span className={`grid shrink-0 place-items-center rounded-full bg-[#c9dbe5] font-bold text-[#29475a] ${size === 'md' ? 'size-10 text-xs' : 'size-7 text-[10px]'}`} data-testid={`avatar-${name.replaceAll(' ', '-').toLowerCase()}`}>{initials}</span>; }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-accent"><ShieldCheck size={22} /></div><h3 className="font-display text-lg font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>; }