import { useEffect, useState } from 'react';
import SkillDetail from '../components/SkillDetail';

export default function ExplorePage({ onAddSkill }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [itemsRes, categoriesRes] = await Promise.all([
          fetch('/api/explore'),
          fetch('/api/explore/categories')
        ]);

        const itemsData = await itemsRes.json();
        const categoriesData = await categoriesRes.json();

        setItems(itemsData);
        setCategories(categoriesData);
        setLastUpdated(new Date().toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
        setFromCache(false);
      } catch (error) {
        setFromCache(true);
        const cached = localStorage.getItem('exploreData');
        if (cached) {
          const { items: cachedItems, categories: cachedCategories, lastUpdated: cachedLastUpdated } = JSON.parse(cached);
          setItems(cachedItems);
          setCategories(cachedCategories);
          setLastUpdated(cachedLastUpdated);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredItems = items.filter(item => {
    const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleAddSkill = (skillName) => {
    onAddSkill(skillName);
  };

  const isAdded = (skillName) => {
    return localStorage.getItem(`added_${skillName}`) === 'true';
  };

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  if (loading && !fromCache) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-blue-300">探索中心</h1>
          
          {/* Search box */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="搜尋技能..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            />
            <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Offline cache warning */}
          {fromCache && (
            <div className="bg-yellow-600/20 border-l-4 border-yellow-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-200">
                    <span className="font-semibold">離線模式：</span>
                    資料可能不是最新（上次更新：{lastUpdated}）
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">沒有符合條件的項目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-lg hover:border-gray-600 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-blue-300 transition-colors">
                    {item.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.source === 'featured'
                        ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
                        : item.source === 'official'
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                        : 'bg-orange-900/30 text-orange-400 border border-orange-800/50'
                    }`}
                  >
                    {item.source === 'featured' ? '⭐ 精選' : item.source === 'official' ? '官方' : '社群'}
                  </span>
                </div>

                <p className="text-gray-300 mb-4 line-clamp-2">
                  {item.description.length > 60
                    ? `${item.description.substring(0, 60)}...`
                    : item.description}
                </p>

                {item.source === 'community' && (
                  <div className="mb-4 text-xs text-orange-400 bg-orange-900/20 px-3 py-2 rounded border border-orange-900/30">
                    ⚠️ 社群維護，非官方
                  </div>
                )}
                {item.source === 'featured' && (
                  <div className="mb-4 text-xs text-purple-400 bg-purple-900/20 px-3 py-2 rounded border border-purple-900/30">
                    ⭐ 社群精選推薦
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSkill(item.name);
                      localStorage.setItem(`added_${item.name}`, 'true');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isAdded(item.name)
                        ? 'bg-gray-700 text-gray-300 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
                    }`}
                  >
                    {isAdded(item.name) ? '已加入 ✓' : '+ 加入'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Overlay */}
        {selectedItem && (
          <SkillDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={() => {
              handleAddSkill(selectedItem.name);
              localStorage.setItem(`added_${selectedItem.name}`, 'true');
              setSelectedItem(null);
            }}
            isAdded={isAdded(selectedItem.name)}
          />
        )}
      </div>
    </div>
  );
}