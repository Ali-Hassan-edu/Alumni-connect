// src/pages/dashboard/AdminReportsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { reportQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface ReportItem {
  id: string
  reporter_id: string
  target_type: 'post' | 'thread' | 'comment'
  target_id: string
  reason: string
  status: 'open' | 'resolved' | 'dismissed'
  resolved_by?: string
  resolved_at?: string
  created_at: string
  reporter?: {
    id: string
    full_name: string
    email: string
    role: string
    profile_picture_url?: string
  }
  resolver?: {
    id: string
    full_name: string
  }
}

export default function AdminReportsPage() {
  const { dbUser } = useAuthStore()
  const [reports, setReports] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [contentSnippet, setContentSnippet] = useState<string>('Loading content context...')

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await reportQueries.getReports()
      setReports(data)
    } catch (err) {
      toast.error('Failed to load reports queue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleResolve = async (reportId: string, targetType: 'post' | 'thread' | 'comment', targetId: string) => {
    if (!dbUser) return
    const confirm = window.confirm('Are you sure you want to delete this content and resolve the report?')
    if (!confirm) return

    try {
      // 1. Delete target content
      await reportQueries.deleteReportedContent(targetType, targetId)
      // 2. Mark report as resolved
      await reportQueries.updateReportStatus(reportId, 'resolved', dbUser.id)
      
      toast.success('Reported content deleted and report resolved successfully!')
      fetchReports()
      setSelectedReport(null)
    } catch (err) {
      toast.error('Failed to resolve report')
    }
  }

  const handleDismiss = async (reportId: string) => {
    if (!dbUser) return
    const confirm = window.confirm('Are you sure you want to dismiss this report?')
    if (!confirm) return

    try {
      await reportQueries.updateReportStatus(reportId, 'dismissed', dbUser.id)
      toast.success('Report dismissed successfully!')
      fetchReports()
      setSelectedReport(null)
    } catch (err) {
      toast.error('Failed to dismiss report')
    }
  }

  const loadContentPreview = async (report: ReportItem) => {
    setSelectedReport(report)
    setContentSnippet('Loading reported content context...')
    try {
      if (report.target_type === 'post') {
        const { data, error } = await supabase
          .from('community_posts')
          .select('title, content')
          .eq('id', report.target_id)
          .maybeSingle()
        if (error || !data) setContentSnippet('[Content deleted or not found]')
        else setContentSnippet(`Post Title: "${data.title}"\n\nContent:\n${data.content}`)
      } else if (report.target_type === 'thread') {
        const { data, error } = await supabase
          .from('threads')
          .select('title, content')
          .eq('id', report.target_id)
          .maybeSingle()
        if (error || !data) setContentSnippet('[Content deleted or not found]')
        else setContentSnippet(`Thread Title: "${data.title}"\n\nContent:\n${data.content}`)
      } else if (report.target_type === 'comment') {
        const { data, error } = await supabase
          .from('comments')
          .select('content')
          .eq('id', report.target_id)
          .maybeSingle()
        if (error || !data) setContentSnippet('[Content deleted or not found]')
        else setContentSnippet(`Comment content:\n${data.content}`)
      }
    } catch (err) {
      setContentSnippet('Error loading reported content preview.')
    }
  }

  const filteredReports = reports.filter(r => filterStatus === 'all' ? true : r.status === filterStatus)

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flagged Reports Moderation</h1>
            <p className="text-muted-foreground text-sm">Review and resolve user-flagged content violation reports</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Reports</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved (Deleted)</option>
              <option value="dismissed">Dismissed (Approved)</option>
            </select>
          </div>
        </div>

        {/* Reports Grid/List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason / Violation</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-6">
                        <div className="skeleton h-12 w-full rounded-xl animate-pulse bg-slate-200/50 dark:bg-slate-800/40" />
                      </td>
                    </tr>
                  ))
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold">No reports to display</p>
                      <p className="text-xs text-muted-foreground mt-1">Excellent! All content queues are clean.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {report.reporter?.full_name || 'System Reporter'}
                          </div>
                          <div className="text-xs text-muted-foreground">{report.reporter?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 capitalize text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                          report.target_type === 'post' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                          report.target_type === 'thread' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {report.target_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-sm text-slate-600 dark:text-slate-400">
                        {report.reason}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          report.status === 'open' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                          report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => loadContentPreview(report)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-600 dark:text-blue-400"
                            title="Inspect content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {report.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleResolve(report.id, report.target_type, report.target_id)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-rose-600 dark:text-rose-450 transition-colors"
                                title="Delete reported content and resolve"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDismiss(report.id)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                                title="Dismiss report"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setSelectedReport(null)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="mb-4 border-b border-border pb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inspect Flagged Content</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">Reporter</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedReport.reporter?.full_name || 'System'}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">Report Reason</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedReport.reason}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Content Context Preview</span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-border text-slate-800 dark:text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {contentSnippet}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border mt-4">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Close
                </button>
                {selectedReport.status === 'open' && (
                  <>
                    <button
                      onClick={() => handleDismiss(selectedReport.id)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl text-sm transition-colors"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => handleResolve(selectedReport.id, selectedReport.target_type, selectedReport.target_id)}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Content
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
