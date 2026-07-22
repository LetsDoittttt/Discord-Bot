import { useState } from 'react';
import { useListLogs, getListLogsQueryKey, ListLogsStatus } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, List, SearchX } from 'lucide-react';
import { formatDateTime, truncateUrl } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 20;

export default function Logs() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ListLogsStatus | 'all'>('all');

  const offset = page * ITEMS_PER_PAGE;
  
  const params = {
    limit: ITEMS_PER_PAGE,
    offset,
    ...(statusFilter !== 'all' ? { status: statusFilter as ListLogsStatus } : {})
  };

  const { data, isLoading } = useListLogs(params, {
    query: {
      queryKey: getListLogsQueryKey(params),
    }
  });

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="success">SUCCESS</Badge>;
      case 'failed': return <Badge variant="destructive">FAILED</Badge>;
      case 'skipped': return <Badge variant="warning">SKIPPED</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <List className="text-primary" /> Full Activity Log
          </h1>
          <p className="text-muted-foreground">Complete history of all processed links and operations.</p>
        </div>
        
        <div className="w-48">
          <Select 
            value={statusFilter} 
            onValueChange={(val: any) => { setStatusFilter(val); setPage(0); }}
          >
            <SelectTrigger className="bg-card/50 backdrop-blur-sm border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl shadow-black/20 overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader className="bg-muted/10 border-b-2 border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] font-mono font-bold tracking-wider text-xs">TIMESTAMP</TableHead>
                <TableHead className="font-mono font-bold tracking-wider text-xs">ORIGINAL_URL</TableHead>
                <TableHead className="font-mono font-bold tracking-wider text-xs">FINAL_URL</TableHead>
                <TableHead className="w-[100px] text-center font-mono font-bold tracking-wider text-xs">MEDIA</TableHead>
                <TableHead className="w-[120px] text-right font-mono font-bold tracking-wider text-xs">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32 bg-muted/50" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48 bg-muted/50" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48 bg-muted/50" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto bg-muted/50" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto bg-muted/50" /></TableCell>
                  </TableRow>
                ))
              ) : data?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                      <SearchX className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium text-foreground/70">NO_RECORDS_FOUND</p>
                      <p className="text-sm font-mono mt-1">Try adjusting query parameters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]" title={log.originalUrl}>
                      {truncateUrl(log.originalUrl, 50)}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px] text-foreground" title={log.finalUrl || '-'}>
                      {log.finalUrl ? truncateUrl(log.finalUrl, 50) : <span className="text-muted-foreground/30">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.hadMedia ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-primary/5 text-primary border-primary/20">Media</Badge>
                      ) : (
                        <span className="text-muted-foreground/30 font-mono">-</span>
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
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-border bg-card/80">
          <p className="text-xs text-muted-foreground font-mono">
            SHOWING <span className="text-foreground">{data?.logs.length ? offset + 1 : 0}</span> TO <span className="text-foreground">{Math.min(offset + ITEMS_PER_PAGE, data?.total || 0)}</span> OF <span className="text-foreground">{data?.total || 0}</span> ENTRIES
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs h-8"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="h-3 w-3 mr-1" /> PREV
            </Button>
            <div className="text-xs font-bold font-mono px-3 text-primary">
              {page + 1} / {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs h-8"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
            >
              NEXT <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
