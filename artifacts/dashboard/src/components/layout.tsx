import { Link, useLocation } from 'wouter';
import { Activity, Settings, List, TerminalSquare } from 'lucide-react';
import { useGetBotStatus, getGetBotStatusQueryKey } from '@workspace/api-client-react';

function BotStatusIndicator() {
  const { data: status, isLoading } = useGetBotStatus({
    query: {
      refetchInterval: 10000,
      queryKey: getGetBotStatusQueryKey(),
    }
  });

  const isOnline = status?.lastHeartbeat 
    ? new Date().getTime() - new Date(status.lastHeartbeat).getTime() < 120000 
    : false;

  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 mt-auto border-t border-border bg-card/50">
        <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
        <span className="text-xs font-mono text-muted-foreground">CHECKING_SYS...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 mt-auto border-t border-border bg-card/50">
      <div className="relative flex h-2.5 w-2.5">
        {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-primary' : 'bg-destructive'}`}></span>
      </div>
      <span className="text-xs font-medium font-mono text-muted-foreground">
        {isOnline ? 'SYS_ONLINE' : 'SYS_OFFLINE'}
      </span>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/logs', label: 'Activity Logs', icon: List },
    { href: '/config', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col z-10 shadow-lg">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <TerminalSquare size={20} />
          </div>
          <span className="font-mono font-bold text-lg tracking-tight">BOT_OPS</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <BotStatusIndicator />
      </aside>
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="p-8 max-w-6xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
