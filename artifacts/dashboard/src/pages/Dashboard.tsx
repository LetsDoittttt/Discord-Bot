import { useGetStats, getGetStatsQueryKey, useListLogs, getListLogsQueryKey } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, CheckCircle2, XCircle, SkipForward, BarChart3, AlertCircle } from 'lucide-react';
import { formatDateTime, truncateUrl } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: {
      refetchInterval: 30000,
      queryKey: getGetStatsQueryKey(),
    }
  });

  const { data: recentLogs, isLoading: logsLoading } = useListLogs({ limit: 10 }, {
    query: {
      refetchInterval: 10000,
      queryKey: getListLogsQueryKey({ limit: 10 }),
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="success">SUCCESS</Badge>;
      case 'failed': return <Badge variant="destructive">FAILED</Badge>;
      case 'skipped': return <Badge variant="warning">SKIPPED</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Activity className="text-primary" /> System Overview
        </h1>
        <p className="text-muted-foreground">Real-time metrics and recent operations feed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-t-2 border-t-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.todayCount || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider">OUT OF {stats?.totalLogs || 0} LIFETIME</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-t-2 border-t-emerald-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold font-mono text-emerald-500">
                {stats?.bypassSuccessRate !== undefined ? `${stats.bypassSuccessRate.toFixed(1)}%` : '0%'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider">{stats?.successCount || 0} TOTAL SUCCESSES</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-t-2 border-t-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Attempts</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold font-mono text-red-500">{stats?.failedCount || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider">REQUIRES ATTENTION</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-t-2 border-t-yellow-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skipped Links</CardTitle>
            <SkipForward className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.skippedCount || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider">ALREADY PROCESSED</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-xl shadow-black/20">
        <CardHeader className="border-b border-border bg-card/30">
          <CardTitle className="font-mono flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> RECENT_ACTIVITY_LOG
          </CardTitle>
        </CardHeader>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead className="w-[100px] text-center">Media</TableHead>
                <TableHead className="w-[120px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recentLogs?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
                      <p>No recent activity logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs?.logs.map((log) => (
                  <TableRow key={log.id} className="group cursor-default hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground/70">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px] lg:max-w-[400px] text-foreground/80">
                      {truncateUrl(log.finalUrl || log.originalUrl, 80)}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.hadMedia ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-primary/5 text-primary border-primary/20">Media</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/30 font-mono">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
