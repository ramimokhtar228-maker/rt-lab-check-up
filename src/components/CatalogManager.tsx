import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Filter, 
  Clock, 
  Droplet, 
  Check, 
  Sparkles,
  Tag,
  Stethoscope,
  DollarSign
} from 'lucide-react';
import { LabTest, CheckupPackage, TestCategory, SampleType } from '../types';
import { deleteTest, saveTest, savePackage } from '../utils/storage';
import { RTLogo } from './RTLogo';
import { EditModal, EditEntity } from './EditModal';

interface CatalogManagerProps {
  tests: LabTest[];
  packages: CheckupPackage[];
  onCatalogChanged: () => void;
  onSelectTestForBooking?: (test: LabTest) => void;
  onSelectPackageForBooking?: (pkg: CheckupPackage) => void;
  readOnly?: boolean;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  tests,
  packages,
  onCatalogChanged,
  onSelectTestForBooking,
  onSelectPackageForBooking,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'packages'>('tests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingEntity, setEditingEntity] = useState<EditEntity | null>(null);
  const [showAddNewTestModal, setShowAddNewTestModal] = useState(false);

  // New test blank form state
  const [newTest, setNewTest] = useState<LabTest>({
    id: '',
    code: '',
    nameAr: '',
    nameEn: '',
    category: 'أمراض الدم والسيولة',
    price: 100,
    sampleType: 'مصل دم (Serum)',
    fastingHours: 0,
    turnaroundHours: 4,
    description: '',
    isPopular: false,
    isCustom: false,
  });

  const categories: TestCategory[] = [
    'أمراض الدم والسيولة',
    'وظائف الكبد',
    'وظائف الكلى واليوريك',
    'السكر والتمثيل الغذائي',
    'دهون وكوليسترول الدم',
    'الهرمونات والغدد',
    'الفيتامينات والمعادن',
    'دلالات الأورام والمناعة',
    'الفيروسات والأمراض المعدية',
    'التحاليل الميكروسكوبية والسريرية',
    'فحوصات مخصصة'
  ];

  // Filtered tests
  const filteredTests = tests.filter(t => {
    const matchesSearch = 
      t.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Filtered packages
  const filteredPackages = packages.filter(p => {
    return (
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    const created: LabTest = {
      ...newTest,
      id: `test_${Date.now()}`,
      code: newTest.code || `RT-${Math.floor(100 + Math.random() * 900)}`,
    };
    saveTest(created);
    onCatalogChanged();
    setShowAddNewTestModal(false);
    setNewTest({
      id: '',
      code: '',
      nameAr: '',
      nameEn: '',
      category: 'أمراض الدم والسيولة',
      price: 100,
      sampleType: 'مصل دم (Serum)',
      fastingHours: 0,
      turnaroundHours: 4,
      description: '',
    });
  };

  const handleDeleteTest = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الفحص (${name}) من الكتالوج؟`)) {
      deleteTest(id);
      onCatalogChanged();
    }
  };

  const handleSaveEdit = (entity: EditEntity) => {
    if (entity.type === 'test') {
      saveTest(entity.data);
    } else if (entity.type === 'package') {
      savePackage(entity.data);
    }
    onCatalogChanged();
    setEditingEntity(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RTLogo variant="icon-only" size="sm" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              دليل الفحوصات والكتالوج الطبي المعتمد ({tests.length} فحص متاح)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            استعرض كافة التحاليل المخبرية، باقات الفحص الشامل، الشروط والتحضيرات، والأسعار المعتمدة مع إمكانية التعديل
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={() => setShowAddNewTestModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة تحليل جديد للكتالوج
            </button>
          )}

          {/* Switcher Tab */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'tests' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              التحاليل المفردة ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'packages' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              باقات الفحص الشامل ({packages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم العربي، الإنجليزي، الكود (مثل CBC, سكر, وظائف كبد, هرمونات)..."
              className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {activeTab === 'tests' && (
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
              >
                <option value="all">جميع الأقسام الطبية ({tests.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat} ({tests.filter(t => t.category === cat).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categories fast pills */}
        {activeTab === 'tests' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TESTS LIST */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between group"
            >
              <div>
                {/* Header item */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                      {test.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {test.nameAr}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500">
                      {test.nameEn}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-base font-black text-sky-800">
                      {test.price} <span className="text-xs font-semibold">ج.م</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {test.description && (
                  <p className="text-[11px] text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>
                )}

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-red-500" />
                    <span>{test.sampleType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{test.fastingHours > 0 ? `صيام ${test.fastingHours} س` : 'بدون صيام'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    خلال {test.turnaroundHours} س
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                {onSelectTestForBooking ? (
                  <button
                    onClick={() => onSelectTestForBooking(test)}
                    className="w-full py-1.5 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة إلى قائمة حجزك
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">معامل RT المعتمدة</span>
                )}

                {!readOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingEntity({ type: 'test', data: test })}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="تعديل بيانات وسعر الفحص"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id, test.nameAr)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف الفحص من الكتالوج"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PACKAGES LIST */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map(pkg => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-sky-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    {pkg.badge && (
                      <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 mb-1">
                        {pkg.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {pkg.nameAr}
                    </h3>
                    <p className="text-xs font-mono text-slate-500">
                      {pkg.nameEn}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-xl font-black text-sky-800">
                      {pkg.price} <span className="text-xs font-semibold">ج.م</span>
                    </div>
                    {pkg.originalPrice > pkg.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {pkg.originalPrice} ج.م
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  {pkg.description}
                </p>

                {/* Included tests pills */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                    الفحوصات المشمولة بالباقة ({pkg.testIds.length} فحص):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.testIds.map(tid => {
                      const t = tests.find(x => x.id === tid);
                      return (
                        <span
                          key={tid}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                        >
                          {t ? t.nameAr : tid}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">الفئة المستهدفة:</span>
                  <span>{pkg.targetAudience}</span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100">
                {onSelectPackageForBooking && (
                  <button
                    onClick={() => onSelectPackageForBooking(pkg)}
                    className="flex-1 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    حجز هذه الباقة الآن
                  </button>
                )}

                {!readOnly && (
                  <button
                    onClick={() => setEditingEntity({ type: 'package', data: pkg })}
                    className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors shrink-0"
                    title="تعديل سعر وبيانات الباقة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW TEST MODAL */}
      {showAddNewTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 border border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-600" />
              إضافة فحص مخبري جديد إلى كتالوج معامل RT
            </h3>

            <form onSubmit={handleCreateNewTest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفحص بالعربي</label>
                  <input
                    type="text"
                    required
                    value={newTest.nameAr}
                    onChange={e => setNewTest({ ...newTest, nameAr: e.target.value })}
                    placeholder="مثال: تحليل كالسيوم متأين"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفحص بالإنجليزي</label>
                  <input
                    type="text"
                    required
                    value={newTest.nameEn}
                    onChange={e => setNewTest({ ...newTest, nameEn: e.target.value })}
                    placeholder="Ionized Calcium"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newTest.price}
                    onChange={e => setNewTest({ ...newTest, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sky-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم الطبي</label>
                  <select
                    value={newTest.category}
                    onChange={e => setNewTest({ ...newTest, category: e.target.value as TestCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع العينة المطلوبة</label>
                  <select
                    value={newTest.sampleType}
                    onChange={e => setNewTest({ ...newTest, sampleType: e.target.value as SampleType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="مصل دم (Serum)">مصل دم (Serum)</option>
                    <option value="دم كامل (EDTA)">دم كامل (EDTA)</option>
                    <option value="بلازما (Citrate)">بلازما (Citrate)</option>
                    <option value="عينة بول (Urine)">عينة بول (Urine)</option>
                    <option value="عينة براز (Stool)">عينة براز (Stool)</option>
                    <option value="مسحة (Swab)">مسحة (Swab)</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعات الصيام (0 = بدون)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={newTest.fastingHours}
                    onChange={e => setNewTest({ ...newTest, fastingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الطبي والأهمية السريرية</label>
                <textarea
                  rows={2}
                  value={newTest.description}
                  onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="وصف مختصر لمؤشرات الفحص..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddNewTestModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  إضافة الفحص إلى الكتالوج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Edit Modal */}
      {editingEntity && (
        <EditModal
          entity={editingEntity}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntity(null)}
        />
      )}
    </div>
  );
};
