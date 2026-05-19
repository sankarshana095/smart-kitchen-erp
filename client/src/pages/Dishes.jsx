import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMinus,
  FiCoffee,
  FiMenu,
  FiGrid,
  FiX,
  FiFolder,
} from 'react-icons/fi';

const Dishes = () => {
  const { isStoreManager, isAdmin } = useAuth();
  const { showToast, confirmAction } = useNotification();
  
  // Data State
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishIngredients, setDishIngredients] = useState([]); // [{ ingredientId, quantityPerPerson }]
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dishesRes, ingredientsRes] = await Promise.all([
        API.get('/dishes'),
        API.get('/ingredients'),
      ]);
      setDishes(dishesRes.data);
      setIngredients(ingredientsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dishes or ingredients data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setDishName('');
    setDishDesc('');
    setDishIngredients([{ ingredientId: ingredients[0]?.id || '', quantityPerPerson: '10' }]);
    setModalError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (dish) => {
    setEditingId(dish.id);
    setDishName(dish.name);
    setDishDesc(dish.description || '');
    
    // Map existing ingredients
    const mappedIngs = dish.ingredients.map((di) => ({
      ingredientId: di.ingredientId,
      quantityPerPerson: di.quantityPerPerson.toString(),
    }));
    setDishIngredients(mappedIngs.length > 0 ? mappedIngs : [{ ingredientId: ingredients[0]?.id || '', quantityPerPerson: '10' }]);
    
    setModalError('');
    setModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    setDishIngredients((prev) => [
      ...prev,
      { ingredientId: ingredients[0]?.id || '', quantityPerPerson: '10' },
    ]);
  };

  const handleRemoveIngredientRow = (index) => {
    setDishIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setDishIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveDishSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!dishName.trim()) {
      return setModalError('Dish name is required.');
    }

    if (dishIngredients.length === 0) {
      return setModalError('Please define at least one ingredient.');
    }

    // Validate quantities
    const cleanedIngredients = [];
    for (const item of dishIngredients) {
      if (!item.ingredientId) {
        return setModalError('Please select valid ingredients.');
      }
      const qty = parseFloat(item.quantityPerPerson);
      if (isNaN(qty) || qty <= 0) {
        return setModalError('Quantity must be a positive number.');
      }
      cleanedIngredients.push({
        ingredientId: item.ingredientId,
        quantityPerPerson: qty,
      });
    }

    setSaving(true);
    try {
      const payload = {
        name: dishName,
        description: dishDesc,
        ingredients: cleanedIngredients,
      };

      if (editingId) {
        await API.put(`/dishes/${editingId}`, payload);
      } else {
        await API.post('/dishes', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to save dish recipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDish = async (id) => {
    const confirm = await confirmAction({
      title: 'Delete Dish Recipe',
      message: 'Are you sure you want to delete this dish recipe? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    try {
      await API.delete(`/dishes/${id}`);
      showToast('Dish recipe deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete dish recipe.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">Configure dishes and specify ingredient requirements per 5 people served.</p>
        </div>
        {isStoreManager && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <FiPlus size={16} />
            <span>Create Dish</span>
          </button>
        )}
      </div>

      {/* DISHES LIST */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center text-rose-700">{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : dishes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          No dishes configured yet. Click 'Create Dish' to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="p-5 border-b border-gray-100 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-800 line-clamp-1">{dish.name}</h3>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                    ID: {dish.id.substring(0, 8)}
                  </span>
                </div>
                {dish.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{dish.description}</p>
                )}

                <div className="pt-2">
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Ingredients (Per 5 People)
                  </h4>
                  {dish.ingredients.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No ingredients defined.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {dish.ingredients.map((di) => (
                        <div
                          key={di.id}
                          className="flex justify-between items-center bg-slate-50 px-2.5 py-1 rounded text-xs"
                        >
                          <span className="font-semibold text-gray-700">{di.ingredient.name}</span>
                          <span className="font-mono text-gray-500">
                            {di.quantityPerPerson} {di.ingredient.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isStoreManager && (
                <div className="bg-slate-50 px-5 py-3 border-t border-gray-100 flex justify-end space-x-3">
                  <button
                    onClick={() => handleOpenEditModal(dish)}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-650 hover:text-indigo-850"
                  >
                    <FiEdit2 size={12} />
                    <span>Edit Recipe</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-850"
                    >
                      <FiTrash2 size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DISH CREATION/EDITING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-gray-800 text-base">
                {editingId ? 'Edit Dish Recipe' : 'Create Dish Recipe'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-650">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDishSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sambar, Vegetable Biryani"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Provide details about cooking preparations or kitchen instructions..."
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="border-t border-gray-150 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-gray-700">Ingredients Composition (Required for 5 people)</h4>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-850"
                  >
                    <FiPlus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {dishIngredients.map((item, index) => {
                    const matchedIng = ingredients.find((i) => i.id === item.ingredientId);
                    const unitStr = matchedIng ? matchedIng.unit : 'unit';

                    return (
                      <div key={index} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <label className="block text-[9px] font-semibold text-gray-400 mb-0.5">Ingredient</label>
                          <select
                            value={item.ingredientId}
                            onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <label className="block text-[9px] font-semibold text-gray-400 mb-0.5">Qty per 5 people ({unitStr})</label>
                          <input
                            type="number"
                            step="any"
                            min="0.00001"
                            required
                            value={item.quantityPerPerson}
                            onChange={(e) => handleIngredientChange(index, 'quantityPerPerson', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(index)}
                          disabled={dishIngredients.length === 1}
                          className="mt-4 p-1.5 text-rose-650 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <FiMinus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-150 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Save Dish</span>
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

export default Dishes;
