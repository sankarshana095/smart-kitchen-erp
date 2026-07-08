import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FiPlusCircle,
  FiMinusCircle,
  FiFileText,
  FiTrendingUp,
  FiSearch,
} from 'react-icons/fi';

const Inventory = () => {
  const { isStoreManager } = useAuth();
  
  // Data State
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form State
  const [selectedIngId, setSelectedIngId] = useState('');
  const [actionType, setActionType] = useState('STOCK_IN'); // STOCK_IN, STOCK_OUT, WASTAGE
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Audit Logs Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchIngredients = async () => {
    try {
      setLoadingList(true);
      const res = await API.get('/ingredients');
      setIngredients(res.data);
      if (res.data.length > 0 && !selectedIngId) {
        setSelectedIngId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingHistory(true);
      const res = await API.get('/inventory/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchTransactions();
  }, []);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedIngId || !quantity) {
      return setFormError('Please fill in all required fields.');
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return setFormError('Quantity must be a positive number.');
    }

    setSubmitting(true);
    try {
      const payload = {
        ingredientId: selectedIngId,
        quantity: qty,
        reason: reason,
      };

      if (actionType === 'STOCK_IN') {
        await API.post('/inventory/stock-in', payload);
        setFormSuccess('Stock checked IN successfully!');
      } else {
        // STOCK_OUT or WASTAGE
        await API.post('/inventory/stock-out', {
          ...payload,
          type: actionType,
        });
        setFormSuccess('Stock checked OUT successfully!');
      }

      setQuantity('');
      setReason('');
      fetchIngredients();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter transaction logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reason && t.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
            Stock In
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/10">
            Stock Out
          </span>
        );
      case 'COOKING':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/10">
            Stock Out
          </span>
        );
      case 'WASTAGE':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/10">
            Wastage
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: STOCK ADJUSTMENT FORM */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Add or Remove Stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">Post inventory transactions with reason audits.</p>
          </div>

          {!isStoreManager ? (
            <div className="p-4 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200">
              Only Store Managers or Admins can modify stock levels.
            </div>
          ) : loadingList ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-6">
              No ingredients configured. Please add some first under 'Ingredients'.
            </div>
          ) : (
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Ingredient</label>
                <select
                  value={selectedIngId}
                  onChange={(e) => setSelectedIngId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({parseFloat(ing.stock.toFixed(4))} {ing.unit} remaining)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Transaction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('STOCK_IN')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                      actionType === 'STOCK_IN'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                        : 'bg-white hover:bg-slate-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <FiPlusCircle size={14} />
                    <span>In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('STOCK_OUT')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                      actionType === 'STOCK_OUT'
                        ? 'bg-blue-50 text-blue-800 border-blue-500'
                        : 'bg-white hover:bg-slate-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <FiMinusCircle size={14} />
                    <span>Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('WASTAGE')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                      actionType === 'WASTAGE'
                        ? 'bg-rose-50 text-rose-800 border-rose-500'
                        : 'bg-white hover:bg-slate-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <FiMinusCircle size={14} />
                    <span>Wastage</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.00001"
                  required
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Audit Reason / Description</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Purchased fresh tomatoes from wholesale market, discard moldy bread bags"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <FiTrendingUp size={14} />
                    <span>Submit Transaction</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: TRANSACTION LOG HISTORY */}
      <div className="lg:col-span-2 space-y-4">
        {/* LOG HISTORY CARD */}
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 flex flex-col h-full min-h-[500px]">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
                <FiFileText className="text-gray-400" />
                <span>Transaction History Logs</span>
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="COOKING">Stock Out</option>
                <option value="WASTAGE">Wastage</option>
              </select>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative my-3">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ingredient or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-gray-400 py-12">
              No transactions matched.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[400px] border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-250 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Ingredient</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono">
                        {new Date(t.createdAt).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{t.ingredient.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <span className={t.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {t.quantity > 0 ? `+${parseFloat(t.quantity.toFixed(4))}` : parseFloat(t.quantity.toFixed(4))} {t.ingredient.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getTransactionBadge(t.type)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate" title={t.reason}>
                        {t.reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 truncate max-w-[80px]">{t.user?.name || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
