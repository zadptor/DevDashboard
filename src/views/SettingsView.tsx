import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useDashboardStore } from '../store';
import { logout } from '../lib/auth';

export default function SettingsView() {
  const { config, setConfig } = useDashboardStore();
  
  const [githubToken, setGithubToken] = useState(config.githubToken || '');
  const [jiraDomain, setJiraDomain] = useState(config.jiraDomain || '');
  const [jiraEmail, setJiraEmail] = useState(config.jiraEmail || '');
  const [jiraToken, setJiraToken] = useState(config.jiraToken || '');
  const [theme, setTheme] = useState(config.theme || 'system');

  const handleSaveIntegrations = () => {
    setConfig({ githubToken, jiraDomain, jiraEmail, jiraToken });
    alert('Integrations saved. API proxies will now use these credentials.');
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    setConfig({ theme: newTheme as any });
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">Configure your integrations and preferences.</p>
        </div>
        <Button variant="destructive" onClick={logout}>Sign Out</Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>Generate a personal access token with repo scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <Input 
                  id="github-token" 
                  type="password" 
                  value={githubToken} 
                  onChange={(e) => setGithubToken(e.target.value)} 
                  placeholder="ghp_..." 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jira Cloud Integration</CardTitle>
              <CardDescription>Enter your Atlassian domain, email, and API token.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-domain">Jira Domain</Label>
                  <Input 
                    id="jira-domain" 
                    value={jiraDomain} 
                    onChange={(e) => setJiraDomain(e.target.value)} 
                    placeholder="your-company.atlassian.net" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jira-email">Account Email</Label>
                  <Input 
                    id="jira-email" 
                    value={jiraEmail} 
                    onChange={(e) => setJiraEmail(e.target.value)} 
                    placeholder="dev@company.com" 
                  />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="jira-token">API Token</Label>
                <Input 
                  id="jira-token" 
                  type="password" 
                  value={jiraToken} 
                  onChange={(e) => setJiraToken(e.target.value)} 
                  placeholder="Atlassian API token" 
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveIntegrations}>Save Integrations</Button>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
               <CardTitle>Appearance</CardTitle>
               <CardDescription>Customize the interface theme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="jarvis">Jarvis Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
