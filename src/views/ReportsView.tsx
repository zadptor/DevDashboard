import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DownloadCloud, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { useDashboardStore } from '../store';
import { format } from 'date-fns';

export default function ReportsView() {
  const { tasks } = useDashboardStore();
  const [normalWorkingHours, setNormalWorkingHours] = useState(8.5);

  const completedTasks = tasks.filter(t => t.status === 'Done');

  // Smart Filler: Merge small tasks daily by SAP Network Code + SAP Activity + SAP ActTyp
  const dailyEntries = useMemo(() => {
    const entriesMap: Record<string, any> = {};
    const dailyHours: Record<string, number> = {};

    completedTasks.forEach(task => {
      const dateStr = task.completedDate ? format(new Date(task.completedDate), 'yyyy-MM-dd') : format(new Date(task.createdAt), 'yyyy-MM-dd');
      const network = task.sapNetworkCode || task.project || 'Default';
      const act = task.sapActivity || 'General';
      const actTyp = task.sapActTyp || '001';
      
      const key = `${dateStr}_${network}_${act}_${actTyp}`;
      
      const displayRef = task.mainJiraRef || task.jiraRef;
      const ticketRef = displayRef ? `[${displayRef}]` : '';
      const textLine = task.shortDescription || task.title;
      const combinedText = ticketRef ? `${ticketRef} ${textLine}` : textLine;

      if (!entriesMap[key]) {
        entriesMap[key] = {
          date: dateStr,
          network,
          activity: act,
          actTyp,
          hours: 0,
          shortTexts: []
        };
      }
      entriesMap[key].hours += (task.actualHours || 0);
      entriesMap[key].shortTexts.push(combinedText);

      dailyHours[dateStr] = (dailyHours[dateStr] || 0) + (task.actualHours || 0);
    });

    const entries = Object.values(entriesMap).map(e => ({
      ...e,
      shortDesc: e.shortTexts.join('; ')
    }));

    return { entries, dailyHours };
  }, [completedTasks]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SAP CATS Upload');
    
    // SAP CATS Standard columns
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Network Code', key: 'network', width: 20 },
      { header: 'Activity', key: 'activity', width: 20 },
      { header: 'Act Typ', key: 'actTyp', width: 10 },
      { header: 'Hours', key: 'hours', width: 10 },
      { header: 'Short Description', key: 'shortDesc', width: 80 },
    ];

    sheet.getRow(1).font = { bold: true };

    dailyEntries.entries.forEach(entry => {
      sheet.addRow(entry);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAP_CATS_Timesheet_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const warnings = Object.keys(dailyEntries.dailyHours).filter(date => {
     const h = dailyEntries.dailyHours[date];
     return h < normalWorkingHours || h > normalWorkingHours;
  });

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">SAP CATS Reporting</h2>
          <p className="text-muted-foreground mt-1 text-sm">Smart Filler active. Tasks are auto-merged by date and Network Code.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
             <Label className="text-xs uppercase font-semibold text-muted-foreground">Daily Target (h)</Label>
             <Input type="number" step="0.5" value={normalWorkingHours} onChange={e => setNormalWorkingHours(Number(e.target.value) || 0)} className="w-16 h-7 text-sm font-mono" />
          </div>
          <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <DownloadCloud className="w-4 h-4 mr-2" /> Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <Card className="shadow-sm border-border">
           <CardContent className="p-6">
             <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Logged (Completed)</div>
             <div className="text-3xl font-bold mt-2">
               {dailyEntries.entries.reduce((sum, e) => sum + e.hours, 0)} <span className="text-xl text-muted-foreground font-normal">hrs</span>
             </div>
           </CardContent>
         </Card>
         
         {warnings.length > 0 && (
           <Card className="shadow-sm border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/20 md:col-span-2">
             <CardContent className="p-6 flex items-start space-x-4">
               <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
               <div>
                  <div className="text-sm font-bold text-orange-800 dark:text-orange-400">Timesheet Warnings</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300/80 mt-1 space-y-1">
                    {warnings.slice(0, 3).map(date => (
                      <p key={date}>
                        <strong>{date}</strong>: Logged {dailyEntries.dailyHours[date]}h (Target {normalWorkingHours}h)
                      </p>
                    ))}
                    {warnings.length > 3 && <p>...and {warnings.length - 3} more dates</p>}
                  </div>
               </div>
             </CardContent>
           </Card>
         )}
      </div>

      <Card className="flex-1 shadow-sm border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Smart Merged Timesheet Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Network Code</th>
                  <th scope="col" className="px-6 py-3">Act / Typ</th>
                  <th scope="col" className="px-6 py-3">Merged Description</th>
                  <th scope="col" className="px-6 py-3 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dailyEntries.entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileSpreadsheet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-medium text-foreground text-sm">No tasks completed yet.</p>
                      <p className="text-xs mt-1">Complete tasks in the Tasks view to build your timesheet.</p>
                    </td>
                  </tr>
                ) : (
                  dailyEntries.entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry, i) => (
                    <tr key={i} className="bg-background hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs">{entry.date}</td>
                      <td className="px-6 py-4 font-mono font-bold text-xs">
                         <span className="bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded">{entry.network}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="font-medium text-foreground">{entry.activity}</span>
                           <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{entry.actTyp}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="max-w-md truncate group-hover:whitespace-normal group-hover:break-words text-xs leading-relaxed">
                            {entry.shortDesc}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className={`font-mono font-bold ${entry.hours > normalWorkingHours ? 'text-orange-500' : 'text-primary'}`}>{entry.hours}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
