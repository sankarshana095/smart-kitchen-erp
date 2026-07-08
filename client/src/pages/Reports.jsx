import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FiFileText,
  FiPlus,
  FiEye,
  FiTrash2,
  FiDownload,
  FiCalendar,
  FiX,
  FiInfo,
} from 'react-icons/fi';

const Reports = () => {
  const { isKitchenStaff, isAdmin } = useAuth();
  const { showToast, confirmAction } = useNotification();
  
  // Lists State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('DAILY_COOKING'); // DAILY_COOKING, INVENTORY, TRANSACTION, USAGE
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [generating, setGenerating] = useState(false);

  // Modal Detail State
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await API.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastWeek.toISOString().split('T')[0]);

    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!reportTitle.trim()) {
      return setFormError('Report title is required.');
    }

    setGenerating(true);
    try {
      const payload = {
        title: reportTitle,
        type: reportType,
        startDate: reportType !== 'INVENTORY' ? new Date(startDate).toISOString() : undefined,
        endDate: reportType !== 'INVENTORY' ? new Date(endDate).toISOString() : undefined,
      };

      await API.post('/reports/generate', payload);
      setFormSuccess('Report compiled and archived successfully!');
      setReportTitle('');
      fetchReports();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id) => {
    const confirm = await confirmAction({
      title: 'Delete Archived Report',
      message: 'Are you sure you want to delete this archived report? This cannot be undone.',
      confirmText: 'Delete Report',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    try {
      await API.delete(`/reports/${id}`);
      showToast('Report deleted successfully', 'success');
      fetchReports();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete report.', 'error');
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'DAILY_COOKING':
        return 'Daily Cooking Summary';
      case 'INVENTORY':
        return 'Inventory Stock Audit';
      case 'TRANSACTION':
        return 'Stock Transactions Log';
      case 'USAGE':
        return 'Ingredient Usage Details';
      default:
        return type;
    }
  };

  // Helper to render report JSON payload inside modal
  const renderReportContent = (report) => {
    const data = report.content;
    if (!data) return <p className="text-xs text-gray-400">No report content available.</p>;

    switch (report.type) {
      case 'DAILY_COOKING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-xs">
              <div>
                <p className="text-gray-400">Total Cooking Sessions</p>
                <p className="text-sm font-bold text-gray-800">{data.totalSessions}</p>
              </div>
              <div>
                <p className="text-gray-400">Total People Served</p>
                <p className="text-sm font-bold text-gray-800">{data.totalPeopleServed}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sessions List</h4>
              {data.sessions?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No cooking done in this date range.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {data.sessions?.map((s) => (
                    <div key={s.id} className="border border-gray-100 p-2.5 rounded text-xs space-y-1 bg-white">
                      <div className="flex justify-between font-semibold text-gray-700">
                        <span>{s.dishName}</span>
                        <span>{s.peopleCount} people</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>By: {s.user}</span>
                        <span>{new Date(s.time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'INVENTORY':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border text-xs text-center">
              <div>
                <p className="text-gray-400">Total Items</p>
                <p className="text-sm font-bold text-gray-800">{data.totalIngredients}</p>
              </div>
              <div>
                <p className="text-gray-400">Low Stock</p>
                <p className="text-sm font-bold text-rose-600">{data.lowStockCount}</p>
              </div>
              <div>
                <p className="text-gray-400">Out of Stock</p>
                <p className="text-sm font-bold text-rose-700">{data.outOfStockCount}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Inventory Stock Snapshot</h4>
              <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-56">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Ingredient</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-semibold text-gray-700">{item.name}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">
                          {item.stock.toFixed(1)} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                              item.status === 'OUT_OF_STOCK'
                                ? 'bg-rose-50 text-rose-700'
                                : item.status === 'LOW_STOCK'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'TRANSACTION':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border text-xs text-center">
              <div>
                <p className="text-gray-400">Total Audits</p>
                <p className="text-sm font-bold text-gray-800">{data.totalTransactions}</p>
              </div>
              <div>
                <p className="text-gray-400">Stock In</p>
                <p className="text-sm font-bold text-emerald-600">{data.stockInCount}</p>
              </div>
              <div>
                <p className="text-gray-400">Stock Out</p>
                <p className="text-sm font-bold text-rose-600">{data.stockOutCount}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Audit Logs</h4>
              {data.transactions?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No transactions in this date range.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-gray-250">
                      <tr>
                        <th className="px-3 py-2">Ingredient</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions?.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-semibold text-gray-700">{t.ingredientName}</td>
                          <td className={`px-3 py-2 font-mono ${t.quantity > 0 ? 'text-emerald-600' : 'text-rose-650'}`}>
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.unit}
                          </td>
                          <td className="px-3 py-2 uppercase text-gray-400">{t.type.replace('_', ' ')}</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate" title={t.reason}>
                            {t.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'USAGE':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ingredients Usage Summary</h4>
              {data.usages?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No consumption records found.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-gray-250">
                      <tr>
                        <th className="px-3 py-2">Ingredient</th>
                        <th className="px-3 py-2">Cooking Use</th>
                        <th className="px-3 py-2">Wastage</th>
                        <th className="px-3 py-2 text-right">Total Combined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.usages?.map((u, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-semibold text-gray-700">{u.ingredientName}</td>
                          <td className="px-3 py-2 font-mono text-gray-600">
                            {u.totalCooking.toFixed(1)} {u.unit}
                          </td>
                          <td className="px-3 py-2 font-mono text-rose-600">
                            {u.totalWastage.toFixed(1)} {u.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-gray-800">
                            {u.totalCombined.toFixed(1)} {u.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-xs text-gray-400">Unsupported report layout.</p>;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT PANEL: REPORT GENERATION FORM */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Generate Audit Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">Compile data snapshot and archive to database.</p>
          </div>

          {!isKitchenStaff ? (
            <div className="p-4 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200">
              Only authorized staff can archive new reports.
            </div>
          ) : (
            <form onSubmit={handleGenerateReport} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooking History - May 19"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="DAILY_COOKING">Daily Cooking Summary</option>
                  <option value="INVENTORY">Inventory Stock Audit</option>
                  <option value="TRANSACTION">Stock Transactions Log</option>
                  <option value="USAGE">Ingredient Usage Details</option>
                </select>
              </div>

              {reportType !== 'INVENTORY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <FiPlus size={14} />
                    <span>Compile & Save</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ARCHIVED REPORTS LIST */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 flex flex-col min-h-[500px]">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <FiFileText className="text-gray-400" />
              <span>Archived Reports Logs</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Access historic saved data compile records.</p>
          </div>

          {error ? (
            <div className="p-4 text-center text-rose-600 text-xs">{error}</div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-gray-400 py-12">
              No reports compiled yet. Use form on the left to archive one.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[450px] border border-gray-100 rounded-lg mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-250 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Generated At</th>
                    <th className="px-4 py-3">Report Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono">
                        {new Date(r.createdAt).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{r.title}</td>
                      <td className="px-4 py-3 font-medium text-gray-500">
                        {getReportTypeLabel(r.type)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{r.user?.name || 'System'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-md transition-colors inline-block"
                          title="Open Report Details"
                        >
                          <FiEye size={14} className="inline" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1 text-red-650 hover:bg-rose-50 rounded-md transition-colors inline-block"
                            title="Delete Archived Report"
                          >
                            <FiTrash2 size={14} className="inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REPORT CONTENT DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-800 text-base">{selectedReport.title}</h3>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">
                  Type: {getReportTypeLabel(selectedReport.type)}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-650">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center space-x-2 text-[10px] text-gray-450 border-b pb-3 mb-4 flex-wrap">
                <FiCalendar />
                <span>Generated: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                <span className="hidden sm:inline">•</span>
                <span>Compiled by: {selectedReport.user?.name || 'System'}</span>
              </div>

              {renderReportContent(selectedReport)}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-gray-150 text-right flex-shrink-0">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
