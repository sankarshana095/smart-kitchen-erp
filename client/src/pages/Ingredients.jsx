import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
  FiMinusCircle,
  FiFilter,
} from 'react-icons/fi';

const Ingredients = () => {
  const { isStoreManager, isAdmin } = useAuth();
  const { showToast, confirmAction } = useNotification();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, low, out, ok

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formUnit, setFormUnit] = useState('kg');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await API.get('/ingredients', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      setIngredients(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch ingredients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchIngredients();
    }, 300); // Debounce search
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormStock('0');
    setFormUnit('kg');
    setFormMinStock('0');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (ing) => {
    setEditingId(ing.id);
    setFormName(ing.name);
    setFormStock(ing.stock.toString());
    setFormUnit(ing.unit);
    setFormMinStock(ing.minStock.toString());
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formUnit) {
      return setFormError('Name and Unit are required fields');
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const data = {
        name: formName,
        unit: formUnit,
        stock: parseFloat(formStock) || 0,
        minStock: parseFloat(formMinStock) || 0,
      };

      if (editingId) {
        await API.put(`/ingredients/${editingId}`, data);
      } else {
        await API.post('/ingredients', data);
      }
      
      setModalOpen(false);
      fetchIngredients();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save ingredient.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAction({
      title: 'Delete Ingredient',
      message: 'Are you sure you want to delete this ingredient? This will affect dishes linked to it.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    try {
      await API.delete(`/ingredients/${id}`);
      showToast('Ingredient deleted successfully', 'success');
      fetchIngredients();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete ingredient.', 'error');
    }
  };

  const getStockStatusBadge = (stock, minStock) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center space-x-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-650/10">
          <FiMinusCircle size={12} />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (stock < minStock) {
      return (
        <span className="inline-flex items-center space-x-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-650/10">
          <FiAlertTriangle size={12} />
          <span>Low Stock</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-650/10">
        <FiCheckCircle size={12} />
        <span>Optimal</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">Track and manage raw items required for dishes.</p>
        </div>
        {isStoreManager && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <FiPlus size={16} />
            <span>Add Ingredient</span>
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-250 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <FiFilter className="text-gray-400 text-sm hidden md:block" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Out of Stock
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'ok'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Optimal
          </button>
        </div>
      </div>

      {/* INGREDIENTS TABLE / GRID */}
      {error ? (
        <div className="bg-red-55/10 border border-red-200 rounded-xl p-4 text-center text-red-700">{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          No ingredients match your search or filter criteria.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Ingredient Name</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Min. Alert Level</th>
                  <th className="px-6 py-4">Status</th>
                  {isStoreManager && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{ing.name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-mono text-sm ${ing.stock < ing.minStock ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                        {parseFloat(ing.stock.toFixed(4))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{ing.unit}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{parseFloat(ing.minStock.toFixed(4))}</td>
                    <td className="px-6 py-4">{getStockStatusBadge(ing.stock, ing.minStock)}</td>
                    {isStoreManager && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(ing)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors inline-block"
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(ing.id)}
                            className="p-1.5 text-red-650 hover:bg-rose-50 rounded-md transition-colors inline-block"
                            title="Delete"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-base">
                {editingId ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-650">
                <FiMinusCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Sunflower Oil"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Unit of Measure</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="L">L (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="packet">packet (Packet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min. Alert Limit</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Initial Stock Level</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Adds an initial STOCK_IN transaction audit automatically.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
                >
                  {formSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Save Ingredient</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
