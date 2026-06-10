import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DownloadCloud, FileSpreadsheet } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { useDashboardStore } from '../store';

export default function ReportsView() {
  const { tasks } = useDashboardStore();

  // For reports, we primarily care about completed work
  const completedTasks = tasks.filter(t => t.status === 'Done');

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SAP CATS Upload');
    
    // SAP CATS Standard columns
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Project Code', key: 'project', width: 20 },
      { header: 'Ticket Number', key: 'ticket', width: 15 },
      { header: 'Activity', key: 'activity', width: 40 },
      { header: 'Hours', key: 'hours', width: 10 },
      { header: 'Short Description', key: 'shortDesc', width: 40 },
    ];

    sheet.getRow(1).font = { bold: true };

    completedTasks.forEach(task => {
      sheet.addRow({
        date: task.completedDate ? new Date(task.completedDate).toLocaleDateString() : (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''),
        project: task.project || 'GEN-01',
        ticket: task.jiraRef || 'N/A',
        activity: task.title,
        hours: task.actualHours || 0,
        shortDesc: task.shortDescription || ''
      });
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

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">SAP CATS Reporting</h2>
          <p className="text-muted-foreground mt-1">Generate weekly and monthly timesheet summaries for SAP.</p>
        </div>
        <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <DownloadCloud className="w-4 h-4 mr-2" /> Export to Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <Card>
           <CardContent className="p-6">
             <div className="text-sm font-medium text-muted-foreground">Total Logged (Completed)</div>
             <div className="text-3xl font-bold mt-2">
               {completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)} hrs
             </div>
           </CardContent>
         </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">Timesheet Preview (Completed Tasks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto shadow-sm sm:rounded-lg border border-border">
            <table className="w-full text-sm text-left text-muted-foreground dark:text-muted-foreground">
              <thead className="text-xs text-neutral-700 uppercase bg-background dark:text-muted-foreground border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Project</th>
                  <th scope="col" className="px-6 py-3">Activity</th>
                  <th scope="col" className="px-6 py-3">Short Description</th>
                  <th scope="col" className="px-6 py-3 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p>No tasks completed yet.</p>
                    </td>
                  </tr>
                ) : (
                  completedTasks.map((task, i) => (
                    <tr key={task.id || i} className="bg-card bg-background border-b border-border hover:bg-muted dark:hover:bg-neutral-900/50">
                      <td className="px-6 py-4">{task.completedDate ? new Date(task.completedDate).toLocaleDateString() : (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A')}</td>
                      <td className="px-6 py-4">{task.project || 'Core'}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{task.title}</td>
                      <td className="px-6 py-4">{task.shortDescription || '--'}</td>
                      <td className="px-6 py-4 text-right">{task.actualHours || 0}</td>
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
