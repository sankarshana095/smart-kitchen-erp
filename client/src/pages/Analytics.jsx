import React, { useState, useEffect } from 'react';
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
  LineChart,
  Line,
} from 'recharts';
import {
  FiBarChart2,
  FiTrendingUp,
  FiActivity,
  FiTrendingDown,
  FiDollarSign,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consumption'); // consumption, finance, health

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const {
    summary,
    lowStockList,
    peopleTrend,
    dishPopularity,
    ingredientUsage,
    transactionTypeBreakdown,
    expenseTrend,
  } = data;

  return (
    <div className="space-y-6">
      {/* TABS SELECTOR */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('consumption')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'consumption'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kitchen Consumption
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'health'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventory Safety
          </button>
        </nav>
      </div>

      {/* CONSUMPTION TAB */}
      {activeTab === 'consumption' && (
        <div className="space-y-6">
          {/* TOP SUMMARY STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-gray-250 flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-lg">
                <FiActivity size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase">Meal Sessions</p>
                <h3 className="text-xl font-extrabold text-gray-800">{summary.totalCookingSessions}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-250 flex items-center space-x-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                <FiBarChart2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase">Volume Served</p>
                <h3 className="text-xl font-extrabold text-gray-800">{summary.totalPeopleServed} people</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-250 flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <FiTrendingUp size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase">Top Dish Volume</p>
                <h3 className="text-xl font-extrabold text-gray-800">
                  {dishPopularity[0] ? `${dishPopularity[0].name} (${dishPopularity[0].value})` : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily volume trend */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                People Served Trend (Daily)
              </h3>
              <div className="h-72">
                {peopleTrend.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-20">No history available</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={peopleTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="peopleServed"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                        name="Served"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Popular dishes */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                Dish Popularity Breakdown
              </h3>
              <div className="h-72">
                {dishPopularity.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-20">No dishes cooked yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dishPopularity}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dishPopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} Served`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Ingredient consumption volume */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                Ingredients Consumption Profile
              </h3>
              <div className="h-72">
                {ingredientUsage.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-20">No consumption logged yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ingredientUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Used">
                        {ingredientUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH TAB */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-fit space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Inventory Health Card</h3>
              <p className="text-xs text-gray-500 mt-1">Status audit of physical raw inventory safety levels.</p>
            </div>
            
            <div className="p-4 rounded-xl flex items-center space-x-3 bg-rose-50 border border-rose-200 text-rose-800">
              <FiAlertTriangle className="text-rose-550 flex-shrink-0" size={24} />
              <div>
                <p className="text-xs font-bold">Deficit Alerts</p>
                <p className="text-lg font-extrabold mt-0.5">{summary.lowStockCount}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl flex items-center space-x-3 bg-emerald-50 border border-emerald-250 text-emerald-800">
              <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={24} />
              <div>
                <p className="text-xs font-bold">Safeguarded Items</p>
                <p className="text-lg font-extrabold mt-0.5">
                  {summary.totalIngredients - summary.lowStockCount}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
              Detailed Safety Stock Deficits
            </h3>
            
            {lowStockList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No items are below minimum safety levels. Perfect inventory health!
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-250 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">Ingredient</th>
                      <th className="px-4 py-3">Current Stock</th>
                      <th className="px-4 py-3">Safety Min Limit</th>
                      <th className="px-4 py-3 text-right">Shortage Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {lowStockList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-rose-600 font-bold">
                          {item.stock} {item.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                          -{item.deficit.toFixed(1)} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
