import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FiCpu,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiUsers,
  FiEye,
  FiX,
  FiClock,
} from 'react-icons/fi';

const Cooking = () => {
  const { isKitchenStaff } = useAuth();
  const { showToast, confirmAction } = useNotification();
  
  // Lists State
  const [dishes, setDishes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Calculator State
  const [selectedDishId, setSelectedDishId] = useState('');
  const [peopleCount, setPeopleCount] = useState('100');
  const [calculation, setCalculation] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [calcError, setCalcError] = useState('');

  // Execute State
  const [executing, setExecuting] = useState(false);
  const [execSuccess, setExecSuccess] = useState('');
  
  // History Modal Detail State
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchDishes = async () => {
    try {
      setLoadingDishes(true);
      const res = await API.get('/dishes');
      setDishes(res.data);
      if (res.data.length > 0 && !selectedDishId) {
        setSelectedDishId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDishes(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await API.get('/cooking/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchHistory();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!selectedDishId || !peopleCount) return;

    const count = parseInt(peopleCount);
    if (isNaN(count) || count < 5) {
      setCalcError('People count must be a minimum of 5.');
      return;
    }

    setCalcError('');
    setExecSuccess('');
    setCalculation(null);
    setLoadingCalc(true);

    try {
      const res = await API.post('/cooking/calculate', {
        dishId: selectedDishId,
        peopleCount: count,
      });
      setCalculation(res.data);
    } catch (err) {
      console.error(err);
      setCalcError(err.response?.data?.message || 'Failed to compile recipe requirements.');
    } finally {
      setLoadingCalc(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedDishId || !peopleCount) return;
    const count = parseInt(peopleCount);
    if (isNaN(count) || count < 5) {
      showToast('People count must be a minimum of 5.', 'error');
      return;
    }

    const confirm = await confirmAction({
      title: 'Execute Cooking Preparation',
      message: `Deduct raw ingredients from inventory to cook for ${count} people?`,
      confirmText: 'Deduct & Cook',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    setExecuting(true);
    setCalcError('');
    setExecSuccess('');

    try {
      const res = await API.post('/cooking/execute', {
        dishId: selectedDishId,
        peopleCount: count,
      });
      showToast(res.data.message || 'Ingredients deducted and cooking history log updated!', 'success');
      setExecSuccess(res.data.message);
      setCalculation(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to execute cooking operation.', 'error');
      setCalcError(err.response?.data?.message || 'Failed to execute cooking operation.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: CALCULATOR & EXECUTER */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <FiCpu className="text-indigo-600" />
              <span>Cooking Quantity Calculator</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Scale recipe ingredients and run deficit checks.</p>
          </div>

          {loadingDishes ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : dishes.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-6">
              No dishes configured. Please add some first under 'Dishes'.
            </div>
          ) : (
            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Dish</label>
                <select
                  value={selectedDishId}
                  onChange={(e) => {
                    setSelectedDishId(e.target.value);
                    setCalculation(null);
                    setExecSuccess('');
                  }}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} ({dish.ingredients.length} ingredients)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-500">Number of People</label>
                  <span className="text-[10px] text-indigo-600 font-semibold">Min: 5 people</span>
                </div>
                <div className="relative">
                  <FiUsers className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    min="5"
                    required
                    value={peopleCount}
                    onChange={(e) => {
                      setPeopleCount(e.target.value);
                      setCalculation(null);
                      setExecSuccess('');
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingCalc}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                {loadingCalc ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Calculate Ingredients</span>
                )}
              </button>
            </form>
          )}

          {calcError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
              {calcError}
            </div>
          )}

          {execSuccess && (
            <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-100 flex items-center space-x-2">
              <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={16} />
              <span>{execSuccess}</span>
            </div>
          )}
        </div>

        {/* RESULTS PANEL */}
        {calculation && (
          <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4 animate-fade-in">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Required Inventory Scale</h3>
              <p className="text-sm font-bold text-gray-700 mt-1">
                Ingredients for {calculation.peopleCount} people
              </p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {calculation.ingredients.map((item) => (
                <div key={item.ingredientId} className="border-b border-gray-50 pb-2 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">{item.name}</span>
                    <span className="font-semibold text-gray-600">
                      Req: {parseFloat(item.required.toFixed(4))} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Base (5 People): {parseFloat(item.quantityPerPerson.toFixed(4))} {item.unit}</span>
                    <span>Current: {parseFloat(item.currentStock.toFixed(4))} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Remaining: {parseFloat(item.remainingStock.toFixed(4))} {item.unit}</span>
                  </div>

                  {item.isShortage && (
                    <div className="flex items-center space-x-1 text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded">
                      <FiAlertTriangle size={12} className="flex-shrink-0" />
                      <span>Shortage deficit by -{parseFloat(item.shortage.toFixed(4))} {item.unit}!</span>
                    </div>
                  )}

                  {!item.isShortage && item.isLowStockAlert && (
                    <div className="flex items-center space-x-1 text-[10px] text-amber-600 font-semibold bg-amber-50 p-1.5 rounded">
                      <FiAlertTriangle size={12} className="flex-shrink-0" />
                      <span>Will drop below safety alert minimum level!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isKitchenStaff ? (
              <button
                onClick={handleExecute}
                disabled={executing}
                className={`w-full font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 ${
                  calculation.hasShortage
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white'
                }`}
              >
                {executing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <FiActivity size={14} />
                    <span>
                      {calculation.hasShortage
                        ? 'Execute Anyway (Force Deficit)'
                        : 'Execute & Deduct Stock'}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 rounded text-center text-xs">
                Authorization required to execute stock deduction.
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: COOKING LOG HISTORY */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 flex flex-col min-h-[500px]">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <FiClock className="text-gray-400" />
              <span>Cooking Logs & Archives</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Chronological record of completed meal sessions.</p>
          </div>

          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-gray-400 py-12">
              No cooking history logged yet.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[450px] border border-gray-100 rounded-lg mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-250 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Dish Cooked</th>
                    <th className="px-4 py-3">People Served</th>
                    <th className="px-4 py-3">Authorized By</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono">
                        {new Date(h.createdAt).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{h.dish.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-750">{h.peopleCount}</td>
                      <td className="px-4 py-3 text-gray-400">{h.user?.name || 'System'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedHistory(h)}
                          className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-md transition-colors"
                          title="View Used Ingredients"
                        >
                          <FiEye size={14} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL FOR HISTORY */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-base">{selectedHistory.dish.name}</h3>
                <p className="text-[10px] text-gray-400">Cooked for {selectedHistory.peopleCount} people</p>
              </div>
              <button onClick={() => setSelectedHistory(null)} className="text-gray-400 hover:text-gray-650">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ingredients Snapshot</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedHistory.ingredientsUsed && Array.isArray(selectedHistory.ingredientsUsed) ? (
                  selectedHistory.ingredientsUsed.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-slate-50 border border-gray-100 rounded p-2 text-xs"
                    >
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="font-mono text-gray-500">
                        {parseFloat(item.quantityUsed.toFixed(4))} {item.unit}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No snapshot recorded.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-gray-150 text-right">
              <button
                onClick={() => setSelectedHistory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cooking;
