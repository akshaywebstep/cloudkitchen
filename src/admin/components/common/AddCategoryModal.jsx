import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import { X, Plus, FolderPlus, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';
import { useTheme } from '../../context/ThemeContext';
import { createMenuCategoryApi, getMenuCategoriesApi } from '../../services/api';
import { extractFieldErrors, getErrorMessage } from '../../utils/errorHelper';
import { AlertTriangle } from 'lucide-react';

export const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded }) => {
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [categoriesList, setCategoriesList] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await getMenuCategoriesApi({ limit: 200 });
      if (res && res.status && Array.isArray(res.data)) {
        setCategoriesList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  if (!isOpen) return null;

  const parentOptions = [
    { value: '', label: 'None (Root Category)' },
    ...categoriesList.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'INACTIVE', label: 'INACTIVE' },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused ? '#8C0D0D' : theme === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: '0.75rem',
      padding: '2px 4px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.2)' : 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '0.75rem',
      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
          ? theme === 'dark' ? '#334155' : '#f8fafc'
          : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : theme === 'dark' ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
    }),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name || !name.trim()) {
      newErrors.name = 'Category name is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please enter a valid category name.');
      return;
    }

    setErrors({});
    showLoading('Creating menu category...');

    const payload = {
      name: name.trim(),
      ...(parentId ? { parentId: Number(parentId) } : {}),
      status: status || 'ACTIVE',
    };
    try {
      const res = await createMenuCategoryApi(payload);
      hideLoading();
      if (res && (res.status === true || (res.status !== false && (res.id || res.data)))) {
        toast.success(res.message || `Category "${name}" created successfully!`);
        setName('');
        setParentId('');
        setStatus('ACTIVE');
        if (onCategoryAdded) onCategoryAdded();
        onClose();
      } else {
        const fieldErrors = extractFieldErrors(res);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
        toast.error(getErrorMessage(res, 'Failed to create menu category.'));
      }
    } catch (err) {
      hideLoading();
      toast.error('Failed to connect to menu server.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop flex flex-col">
        {/* Header */}
        <div className="bg-[#8C0D0D] text-white p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-black flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-rose-200" />
              Create Menu Category
            </h3>
            <p className="text-xs text-rose-100 mt-0.5 font-medium">
              Add new culinary line or sub-category
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 text-xs font-semibold">
          {(errors.general || errors.form) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs font-bold leading-relaxed">{errors.general || errors.form}</div>
            </div>
          )}
          {/* Category Name */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
              Category Name *
            </label>
            <input
              type="text"
              placeholder="Enter category name (e.g. Biryani, Desserts)..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none ${errors.name
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#8C0D0D]'
                }`}
            />
            {errors.name && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
              Parent Category (Optional)
            </label>
            <Select
              options={parentOptions}
              value={parentOptions.find((opt) => String(opt.value) === String(parentId)) || parentOptions[0]}
              onChange={(opt) => setParentId(opt ? opt.value : '')}
              styles={customSelectStyles}
              isSearchable={true}
              placeholder="Select parent category (optional)..."
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-extrabold">
              Status
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === status)}
              onChange={(opt) => setStatus(opt ? opt.value : 'ACTIVE')}
              styles={customSelectStyles}
              isSearchable={false}
              placeholder="Select status..."
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#8C0D0D] hover:bg-[#700a0a] text-white font-extrabold shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
