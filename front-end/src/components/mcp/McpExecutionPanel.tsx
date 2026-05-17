import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Play, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface McpExecution {
  id: string;
  toolName: string;
  purpose: string;
  inputPreview: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'executing' | 'completed' | 'failed';
  error?: string;
  result?: Record<string, unknown>;
  timestamp: Date;
}

interface McpExecutionPanelProps {
  execution: McpExecution;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Pending Approval'
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Approved'
  },
  denied: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Denied'
  },
  executing: {
    icon: Play,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Executing'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Completed'
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Failed'
  }
};

export function McpExecutionPanel({
  execution,
  onApprove,
  onDeny,
  className
}: McpExecutionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[execution.status];
  const Icon = config.icon;

  const formatInputPreview = (input: Record<string, unknown>) => {
    return Object.entries(input)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              config.bgColor,
              config.borderColor,
              'border'
            )}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {execution.toolName}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Purpose</p>
            <p className="text-sm">{execution.purpose}</p>
          </div>

          {isExpanded && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Input Preview</p>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-xs">
                    {formatInputPreview(execution.inputPreview)}
                  </code>
                </div>
              </div>

              {execution.error && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Error</p>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <p className="text-sm text-red-700">{execution.error}</p>
                  </div>
                </div>
              )}

              {execution.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(execution.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeny(execution.id)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}