import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { GitPullRequest, GitMerge, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDashboardStore } from '../store';

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url_part?: string;
  repository_url: string;
}

export default function PullRequestsView() {
  const { config } = useDashboardStore();

  const { data: prs, isLoading, error } = useQuery({
    queryKey: ['prs', config.githubToken],
    queryFn: async () => {
      try {
        const headers: any = {};
        if (config.githubToken) headers['x-github-token'] = config.githubToken;
        
        const res = await axios.get('/api/github/repos/shadcn-ui/ui/pulls?state=open', { headers });
        return res.data as PullRequest[];
      } catch (err) {
        return [];
      }
    }
  });

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Pull Requests</h2>
          <p className="text-muted-foreground mt-1">Monitor PRs from GitHub (Currently demoing shadcn/ui repo).</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="w-full h-full overflow-y-auto pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading PRs...</p>
            ) : prs?.length ? (
              prs.slice(0, 10).map((pr) => (
                <Card key={pr.id}>
                  <div className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <GitPullRequest className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-foreground truncate">
                        <a href={pr.html_url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary">
                          {pr.title}
                        </a>
                      </p>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground space-x-4">
                        <span className="flex items-center">
                          <img src={pr.user.avatar_url} alt="" className="w-4 h-4 rounded-full mr-1.5" />
                          {pr.user.login}
                        </span>
                        <span>#{pr.number}</span>
                        <span>Updated {formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                       <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Open</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No Pull Requests returned</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                      Please check your connection and ensure you have configured your environment variables for GitHub.
                    </p>
                  </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
