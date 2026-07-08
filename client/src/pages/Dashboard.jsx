import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FiBox,
  FiCoffee,
  FiTrendingUp,
  FiUsers,
  FiAlertOctagon,
  FiFileText,
  FiArrowRight,
  FiCompass,
} from 'react-icons/fi';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-750">
        <FiAlertOctagon className="mx-auto text-red-550 mb-3" size={32} />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const { summary, lowStockList, peopleTrend, dishPopularity, ingredientUsage } = data;

  return (
    <div className="space-y-6">
      {/* LOW STOCK EMERGENCY BANNER */}
      {summary.lowStockCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 animate-pulse">
          <div className="flex items-center space-x-3">
            <FiAlertOctagon className="text-rose-500 flex-shrink-0" size={22} />
            <div>
              <p className="text-sm font-bold">Low Stock Warning</p>
              <p className="text-xs text-rose-600">
                There are {summary.lowStockCount} ingredient(s) running below their minimum stock levels.
              </p>
            </div>
          </div>
          <Link
            to="/ingredients"
            className="text-xs font-semibold bg-rose-650 hover:bg-rose-700 bg-rose-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
          >
            <span>Restock Now</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Ingredients */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredients</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{summary.totalIngredients}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FiCoffee size={20} />
          </div>
        </div>

        {/* Total Dishes */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dishes Configured</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{summary.totalDishes}</h3>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <FiBox size={20} />
          </div>
        </div>

        {/* People Served */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total People Served</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{summary.totalPeopleServed}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <FiUsers size={20} />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Cooking Trend */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume Cooked Trend (Last 30 Days)</h3>
          <div className="h-72">
            {peopleTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No cooking data logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peopleTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="peopleServed"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorServed)"
                    strokeWidth={2}
                    name="People Served"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dish Popularity (Pie Chart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Dish Popularity (People Served)</h3>
          <div className="h-72 flex flex-col justify-between">
            {dishPopularity.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                No dishes cooked yet.
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="105%">
                    <PieChart>
                      <Pie
                        data={dishPopularity}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dishPopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Served`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left mt-2">
                  {dishPopularity.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center space-x-1.5 truncate">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[11px] text-gray-600 truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 & LOW STOCK LIST */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ingredient Usage (Bar Chart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 10 Ingredients Consumed (Volume)</h3>
          <div className="h-72">
            {ingredientUsage.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No stock transactions found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingredientUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Quantity Consumed">
                    {ingredientUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Ingredient Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Deficit Ingredients</h3>
          <div className="flex-1 overflow-y-auto max-h-72 space-y-3 pr-1">
            {lowStockList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-sm text-gray-400 py-12">
                <FiCompass size={24} className="text-gray-300 mb-2" />
                <p>All stock levels are optimal.</p>
              </div>
            ) : (
              lowStockList.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-gray-100">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800">{ing.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Stock: {ing.stock} / Min: {ing.minStock} {ing.unit}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                    Deficit: -{ing.deficit.toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Kitchen ERP Quick Actions</h3>
          <p className="text-xs text-slate-300 mt-1">
            Navigate quickly to cooking calculators, stock adjustment logs, or fetch system audit reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/cooking"
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 rounded-lg text-xs font-semibold shadow transition-colors"
          >
            Record Cooking Session
          </Link>
          <Link
            to="/inventory"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-450 text-slate-950 rounded-lg text-xs font-semibold shadow transition-colors"
          >
            Stock In / Out
          </Link>
          <Link
            to="/reports"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <FiFileText size={13} />
            <span>Generate Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
