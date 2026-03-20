import React, { useState, useEffect, useRef } from 'react';
import { 
    Inbox, 
    ArrowRightCircle, 
    Clock, 
    Star, 
    Archive, 
    Search,
    Minimize2,
    Maximize2,
    X,
    LayoutGrid,
    Calendar,
    Zap,
    Package,
    Moon,
    Sun,
    Activity, // Yoga-like
    Waves,    // Swim
    Footprints, // Walk
    Flag,
    Check,
    FolderPlus,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Smile,
    CigaretteOff,
    Wine,
    BookOpen,
    Book,
    ClipboardList,
    ClipboardCheck,
    List // Added for custom categories
} from 'lucide-react';

interface TodoCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    count: number;
    color?: string;
}

interface TodoItem {
    id: number;
    title: string;
    isCompleted: boolean;
    date?: string; // YYYY-MM-DD HH:mm
    priority: 'none' | 'low' | 'medium' | 'high';
    category: string; // 'inbox', etc.
    iconType: string;
    iconColor?: string;
}

// Configuration for Common Todos to match the screenshot
const COMMON_TODOS = [
    { 
        category: '运动健身', 
        items: [
            { label: '跑步', iconType: 'run', color: 'bg-red-500', icon: <Activity size={16} /> },
            { label: '练瑜伽', iconType: 'yoga', color: 'bg-purple-500', icon: <Activity size={16} className="rotate-45" /> },
            { label: '游泳', iconType: 'swim', color: 'bg-blue-400', icon: <Waves size={16} /> },
            { label: '每天步行一万步', iconType: 'walk', color: 'bg-emerald-500', icon: <Footprints size={16} /> },
        ]
    },
    { 
        category: '日常生活', 
        items: [
            { label: '取快递', iconType: 'package', color: 'bg-blue-600', icon: <Package size={16} /> },
            { label: '早睡', iconType: 'sleep', color: 'bg-indigo-900', icon: <Moon size={16} /> },
            { label: '早起', iconType: 'wake', color: 'bg-yellow-500', icon: <Sun size={16} /> },
            { label: '吃早餐', iconType: 'breakfast', color: 'bg-green-500', icon: <Utensils size={16} /> },
            { label: '保持微笑', iconType: 'smile', color: 'bg-yellow-400', icon: <Smile size={16} /> },
            { label: '不抽烟', iconType: 'no-smoking', color: 'bg-red-500', icon: <CigaretteOff size={16} /> },
            { label: '不喝酒', iconType: 'no-alcohol', color: 'bg-emerald-600', icon: <Wine size={16} /> },
        ]
    },
    {
        category: '学习充电',
        items: [
             { label: '背单词', iconType: 'words', color: 'bg-orange-500', icon: <BookOpen size={16} /> },
             { label: '每天阅读一小时', iconType: 'read', color: 'bg-blue-500', icon: <Book size={16} /> },
        ]
    },
    {
        category: '工作习惯',
        items: [
             { label: '一天工作计划', iconType: 'plan', color: 'bg-blue-600', icon: <ClipboardList size={16} /> },
             { label: '一天工作总结', iconType: 'summary', color: 'bg-sky-400', icon: <ClipboardCheck size={16} /> },
        ]
    }
];

export const TodoView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('inbox');
  const [searchText, setSearchText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'completed' | 'expired'>('all');

  // Popover States
  const [showCommonPopup, setShowCommonPopup] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [showPriorityPopup, setShowPriorityPopup] = useState(false);

  // New Category Popup State
  const [showNewCatPopup, setShowNewCatPopup] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCategories, setCustomCategories] = useState<{id: string, label: string}[]>([]);

  // Input Meta States (Transient state for the new todo being created)
  const [inputPriority, setInputPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Date Picker Internal State
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [timeHour, setTimeHour] = useState('12');
  const [timeMinute, setTimeMinute] = useState('00');
  const [isAllDay, setIsAllDay] = useState(true);

  // Data State
  const [todos, setTodos] = useState<TodoItem[]>([
      { id: 1, title: '取快递', isCompleted: false, category: 'inbox', priority: 'none', iconType: 'package', iconColor: 'bg-blue-600' }
  ]);

  const systemCategories: TodoCategory[] = [
      { id: 'inbox', label: '收集箱', icon: <Inbox size={18} />, count: todos.filter(t => t.category === 'inbox' && !t.isCompleted).length, color: 'text-purple-600' },
      { id: 'next', label: '下一步', icon: <ArrowRightCircle size={18} />, count: todos.filter(t => t.category === 'next' && !t.isCompleted).length, color: 'text-blue-500' },
      { id: 'future', label: '将来处理', icon: <Clock size={18} />, count: todos.filter(t => t.category === 'future' && !t.isCompleted).length, color: 'text-green-500' },
      { id: 'starred', label: '已收藏', icon: <Star size={18} />, count: todos.filter(t => t.category === 'starred' && !t.isCompleted).length, color: 'text-yellow-500' },
      { id: 'archived', label: '归档', icon: <Archive size={18} />, count: todos.filter(t => t.category === 'archived' && !t.isCompleted).length, color: 'text-gray-500' },
  ];

  const categories: TodoCategory[] = [
      ...systemCategories,
      ...customCategories.map(c => ({
          id: c.id,
          label: c.label,
          icon: <List size={18} />,
          count: todos.filter(t => t.category === c.id && !t.isCompleted).length,
          color: 'text-gray-600'
      }))
  ];

  // --- Helpers for Date Formatting ---
  const formatDate = (date: Date, withTime: boolean = false) => {
      const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (withTime) {
          return `${d} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      return d;
  };

  // --- Handlers ---

  const handleCreateCategory = () => {
      if (!newCatName.trim()) return;
      const newId = `cat-${Date.now()}`;
      setCustomCategories([...customCategories, { id: newId, label: newCatName.trim() }]);
      setNewCatName('');
      setShowNewCatPopup(false);
      setActiveCategory(newId);
  };

  const parseSmartInput = (text: string) => {
      let parsedTitle = text;
      let parsedPriority: 'none' | 'low' | 'medium' | 'high' = 'none';
      let parsedDate: Date | null = null;

      // 1. Parse Priority
      if (text.match(/!high|!高|高优先级/i)) {
          parsedPriority = 'high';
          parsedTitle = parsedTitle.replace(/!high|!高|高优先级/gi, '');
      } else if (text.match(/!medium|!中|中优先级/i)) {
          parsedPriority = 'medium';
          parsedTitle = parsedTitle.replace(/!medium|!中|中优先级/gi, '');
      } else if (text.match(/!low|!低|低优先级/i)) {
          parsedPriority = 'low';
          parsedTitle = parsedTitle.replace(/!low|!低|低优先级/gi, '');
      }

      // 2. Parse Date (Simple keywords)
      const today = new Date();
      if (text.match(/今天|today/i)) {
          parsedDate = today;
          parsedTitle = parsedTitle.replace(/今天|today/gi, '');
      } else if (text.match(/明天|tomorrow/i)) {
          const tmr = new Date(today);
          tmr.setDate(today.getDate() + 1);
          parsedDate = tmr;
          parsedTitle = parsedTitle.replace(/明天|tomorrow/gi, '');
      } else if (text.match(/后天/i)) {
           const dayAfter = new Date(today);
           dayAfter.setDate(today.getDate() + 2);
           parsedDate = dayAfter;
           parsedTitle = parsedTitle.replace(/后天/gi, '');
      }

      return {
          title: parsedTitle.trim(),
          priority: parsedPriority,
          date: parsedDate
      };
  };

  const handleAddTodo = (overrideTitle?: string, iconType: string = 'default', iconColor: string = 'bg-gray-400') => {
      const rawTitle = overrideTitle !== undefined ? overrideTitle : inputValue;
      if (!rawTitle.trim()) return;

      // Parse input for smart keywords
      const { title: cleanTitle, priority: smartPriority, date: smartDate } = parseSmartInput(rawTitle);

      // Priority precedence: Manual Selection (inputPriority) > Smart Parsing > Default 'none'
      const finalPriority = inputPriority !== 'none' ? inputPriority : smartPriority;
      
      // Date precedence: Manual Selection (selectedDate) > Smart Parsing
      const finalDateObj = selectedDate || smartDate;
      // Only include time if manually selected and All Day was OFF
      const includeTime = !!selectedDate && !isAllDay;
      const finalDateStr = finalDateObj ? formatDate(finalDateObj, includeTime) : undefined;

      const newTodo: TodoItem = {
          id: Date.now(),
          title: cleanTitle,
          isCompleted: false,
          category: activeCategory,
          priority: finalPriority,
          date: finalDateStr,
          iconType: iconType,
          iconColor: iconColor
      };
      
      setTodos([...todos, newTodo]);
      
      // Reset inputs
      setInputValue('');
      setInputPriority('none');
      setSelectedDate(null);
      setShowCommonPopup(false); 
      setShowPriorityPopup(false);
      setShowDatePopup(false);
      // Reset to default
      setIsAllDay(true);
      setTimeHour('12');
      setTimeMinute('00');
  };

  const toggleTodo = (id: number) => {
      setTodos(todos.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const togglePopup = (popup: 'common' | 'date' | 'priority') => {
      if (popup === 'common') {
          setShowCommonPopup(!showCommonPopup);
          setShowDatePopup(false);
          setShowPriorityPopup(false);
      } else if (popup === 'date') {
          setShowDatePopup(!showDatePopup);
          setShowCommonPopup(false);
          setShowPriorityPopup(false);
      } else if (popup === 'priority') {
          setShowPriorityPopup(!showPriorityPopup);
          setShowCommonPopup(false);
          setShowDatePopup(false);
      }
  };

  const confirmDateSelection = () => {
      const newDate = new Date(pickerDate);
      if (!isAllDay) {
          newDate.setHours(parseInt(timeHour) || 0);
          newDate.setMinutes(parseInt(timeMinute) || 0);
      } else {
          newDate.setHours(0, 0, 0, 0);
      }
      setSelectedDate(newDate);
      setShowDatePopup(false);
  };

  // --- Render Helpers ---

  const renderIcon = (type: string, colorClass: string = 'bg-gray-400') => {
      const allItems = COMMON_TODOS.flatMap(g => g.items);
      const matched = allItems.find(i => i.iconType === type);
      
      if (matched) {
          return (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm ${matched.color}`}>
                  {React.cloneElement(matched.icon as React.ReactElement<any>, { size: 12 })}
              </div>
          );
      }
      
      // Default fallback
      return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><Inbox size={12} /></div>;
  };

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'high': return 'text-red-500';
          case 'medium': return 'text-orange-500';
          case 'low': return 'text-blue-500';
          default: return 'text-gray-400';
      }
  };

  const getPriorityBg = (p: string) => {
      switch(p) {
          case 'high': return 'bg-red-500';
          case 'medium': return 'bg-orange-500';
          case 'low': return 'bg-blue-500';
          default: return 'bg-transparent';
      }
  };

  const renderContent = () => {
      let filtered = todos.filter(t => t.category === activeCategory);
      
      if (filterType === 'active') filtered = filtered.filter(t => !t.isCompleted);
      if (filterType === 'completed') filtered = filtered.filter(t => t.isCompleted);
      
      if (searchText) {
          filtered = filtered.filter(t => t.title.toLowerCase().includes(searchText.toLowerCase()));
      }

      if (filtered.length === 0) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 pb-20 select-none">
                <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 text-purple-200">
                    {categories.find(c => c.id === activeCategory)?.icon || <Inbox size={48} />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{categories.find(c => c.id === activeCategory)?.label}</h3>
                <p className="text-sm">暂无内容</p>
            </div>
          );
      }

      return (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {filtered.map(todo => (
                <div 
                    key={todo.id} 
                    className={`group flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all cursor-pointer shadow-sm relative overflow-hidden`}
                    onClick={() => toggleTodo(todo.id)}
                >
                    {/* Priority Indicator Line */}
                    {todo.priority !== 'none' && !todo.isCompleted && (
                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${getPriorityBg(todo.priority)}`}></div>
                    )}

                    <div className={`w-5 h-5 ml-1 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${todo.isCompleted ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 hover:border-purple-400'}`}>
                        {todo.isCompleted && <Check size={12} strokeWidth={3} />}
                    </div>
                    
                    <div className="flex-shrink-0">
                         {renderIcon(todo.iconType, todo.iconColor)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className={`text-sm text-gray-700 truncate ${todo.isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {todo.title}
                        </div>
                        {todo.date && (
                            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${todo.isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>
                                <Calendar size={10} />
                                {todo.date}
                            </div>
                        )}
                    </div>
                    
                    {/* Priority Flag Display */}
                    {todo.priority !== 'none' && !todo.isCompleted && (
                        <div className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            todo.priority === 'high' ? 'text-red-600 border-red-100 bg-red-50' : 
                            todo.priority === 'medium' ? 'text-orange-600 border-orange-100 bg-orange-50' : 
                            'text-blue-600 border-blue-100 bg-blue-50'
                        }`}>
                            {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 pl-2">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"><Flag size={14} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"><Calendar size={14} /></button>
                        <button 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            onClick={(e) => {
                                e.stopPropagation();
                                setTodos(todos.filter(t => t.id !== todo.id));
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      );
  };

  // --- Calendar Popup Component ---
  const DatePickerPopup = () => {
      const days = Array.from({length: 31}, (_, i) => i + 1); // Mock 31 days
      const weekHead = ['日', '一', '二', '三', '四', '五', '六'];
      const offset = 1; 

      return (
          <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                  <span className="text-sm font-medium text-gray-500">设置待办时间</span>
                  <button onClick={() => setPickerDate(new Date())} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">今天</button>
              </div>
              
              <div className="flex items-center justify-between mb-4 px-2">
                   <button className="text-gray-400 hover:text-gray-600"><ChevronLeft size={16}/></button>
                   <span className="text-sm font-bold text-gray-800">十二月 2025</span>
                   <button className="text-gray-400 hover:text-gray-600"><ChevronRight size={16}/></button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {weekHead.map(d => <span key={d} className="text-xs text-gray-400">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {Array(offset).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
                  {days.map(d => (
                      <div 
                        key={d} 
                        onClick={() => {
                            const newDate = new Date(2025, 11, d);
                            setPickerDate(newDate);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                            pickerDate.getDate() === d ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' : 'text-gray-700'
                        }`}
                      >
                          {d}
                      </div>
                  ))}
              </div>

              <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">全天</span>
                      <div 
                        onClick={() => setIsAllDay(!isAllDay)}
                        className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isAllDay ? 'bg-purple-500' : 'bg-gray-200'}`}
                      >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isAllDay ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                  </div>
                  
                  {!isAllDay && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 animate-in fade-in slide-in-from-right-2">
                           <input 
                                type="text" 
                                value={timeHour} 
                                onChange={e => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) val = val.slice(0, 2);
                                    if (Number(val) > 23) val = '23';
                                    setTimeHour(val);
                                }}
                                onBlur={() => setTimeHour(h => h.padStart(2,'0'))}
                                className="w-8 text-center bg-gray-50 border border-gray-200 rounded focus:border-purple-500 focus:outline-none text-xs py-0.5" 
                           />
                           <span className="text-gray-400">:</span>
                           <input 
                                type="text" 
                                value={timeMinute} 
                                onChange={e => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) val = val.slice(0, 2);
                                    if (Number(val) > 59) val = '59';
                                    setTimeMinute(val);
                                }}
                                onBlur={() => setTimeMinute(m => m.padStart(2,'0'))}
                                className="w-8 text-center bg-gray-50 border border-gray-200 rounded focus:border-purple-500 focus:outline-none text-xs py-0.5" 
                           />
                      </div>
                  )}
              </div>

              <div className="flex gap-2">
                  <button onClick={() => { setSelectedDate(null); setShowDatePopup(false); }} className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">清除</button>
                  <button onClick={confirmDateSelection} className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 shadow-sm">确认</button>
              </div>
          </div>
      );
  };

  // --- Priority Popup Component ---
  const PriorityPopup = () => (
      <div className="absolute bottom-16 right-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {[
              { label: '无优先级', value: 'none', color: 'bg-gray-300' },
              { label: '低优先级', value: 'low', color: 'bg-blue-400' },
              { label: '中优先级', value: 'medium', color: 'bg-orange-400' },
              { label: '高优先级', value: 'high', color: 'bg-red-500' },
          ].map((p, i) => (
              <button 
                key={i} 
                onClick={() => {
                    setInputPriority(p.value as any);
                    setShowPriorityPopup(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 justify-between group ${inputPriority === p.value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600'}`}
              >
                  <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-sm ${p.color}`}></div>
                      {p.label}
                  </div>
                  {inputPriority === p.value && <Check size={12} />}
              </button>
          ))}
      </div>
  );

  return (
    <div className="flex h-full bg-white font-sans" onClick={() => {
        // Optional: click outside to close popups
    }}>
      {/* Todo Sidebar (Secondary) */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col py-4">
         <div className="px-4 mb-4 flex items-center justify-between text-sm font-medium text-gray-500">
             <span>待办</span>
         </div>
         
         <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
             {categories.map(cat => (
                 <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeCategory === cat.id 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                 >
                     <div className="flex items-center gap-3">
                         <div className={activeCategory === cat.id ? cat.color : 'text-gray-400'}>{cat.icon}</div>
                         <span>{cat.label}</span>
                     </div>
                     <span className="text-xs text-gray-400">{cat.count}项</span>
                 </button>
             ))}
         </div>

         <div className="px-4 mt-auto relative">
             {showNewCatPopup && (
                 <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNewCatPopup(false)}></div>
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">新建列表</div>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 mb-3"
                            placeholder="列表名称"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleCreateCategory();
                                if(e.key === 'Escape') setShowNewCatPopup(false);
                            }}
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => setShowNewCatPopup(false)}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleCreateCategory}
                                disabled={!newCatName.trim()}
                                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                创建
                            </button>
                        </div>
                    </div>
                 </>
             )}

             <button 
                onClick={() => {
                    setNewCatName('');
                    setShowNewCatPopup(true);
                }}
                className="flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
             >
                 <FolderPlus size={18} />
                 新建分类
             </button>
         </div>
      </div>

      {/* Main Todo Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Header */}
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                  <div className="text-purple-600">
                      {categories.find(c => c.id === activeCategory)?.icon || <Inbox size={20} />}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{categories.find(c => c.id === activeCategory)?.label}</h2>
                  <span className="text-sm text-gray-400 font-normal">{todos.filter(t => t.category === activeCategory).length}项</span>
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex bg-gray-100 rounded-full p-0.5">
                      {['all', 'active', 'completed', 'expired'].map(type => (
                          <button 
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                filterType === type 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                              {type === 'all' ? '全部' : type === 'active' ? '未完成' : type === 'completed' ? '已完成' : '已过期'}
                          </button>
                      ))}
                  </div>
                  <div className="relative w-48 hidden lg:block">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="搜索待办"
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-transparent rounded-full text-xs focus:bg-white focus:border-purple-200 focus:ring-0 transition-all outline-none"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                      <Minimize2 size={16} className="cursor-pointer hover:text-gray-600" />
                      <Maximize2 size={16} className="cursor-pointer hover:text-gray-600" />
                      <X size={18} className="cursor-pointer hover:text-gray-600 ml-2" />
                  </div>
              </div>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Bottom Input Bar */}
          <div className="p-6 relative">
              
              {/* Input Box Container */}
              <div className="max-w-4xl mx-auto relative z-20">
                  
                  {/* Common Todos Popup - Adjusted Position to Right (closer to button) */}
                  {showCommonPopup && (
                      <div className="absolute bottom-full right-0 mb-4 w-[280px] max-h-[420px] overflow-y-auto bg-white rounded-2xl shadow-[0_4px_30px_-5px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 scrollbar-hide">
                          {COMMON_TODOS.map((group, idx) => (
                              <div key={idx} className="mb-4 last:mb-0">
                                  <div className="px-2 py-1 text-xs font-bold text-gray-400 mb-1">{group.category}</div>
                                  <div className="space-y-1">
                                      {group.items.map((item, i) => (
                                          <button 
                                            key={i} 
                                            onClick={() => handleAddTodo(item.label, item.iconType, item.color)}
                                            className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left group/item"
                                          >
                                              <div className={`w-7 h-7 rounded-full ${item.color} text-white flex items-center justify-center shadow-sm group-hover/item:scale-105 transition-transform`}>
                                                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 14 })}
                                              </div>
                                              <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Date & Priority Popups - Anchored to Right */}
                  {showDatePopup && <DatePickerPopup />}
                  {showPriorityPopup && <PriorityPopup />}

                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all relative">
                    <input 
                        type="text" 
                        placeholder="输入待办 or 点击 ⌘ 选择常用待办" 
                        className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent placeholder:text-gray-400"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTodo();
                        }}
                    />
                    <div className="flex items-center gap-1 pr-1 border-l border-gray-100 pl-2">
                        <button 
                            onClick={() => togglePopup('common')}
                            className={`p-2 rounded-lg transition-all ${showCommonPopup ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                            title="常用待办"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => togglePopup('date')}
                            className={`p-2 rounded-lg transition-all relative ${showDatePopup || selectedDate ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                            title="设置日期"
                        >
                            <Calendar size={18} />
                            {selectedDate && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                        </button>
                        <button 
                            onClick={() => togglePopup('priority')}
                            className={`p-2 rounded-lg transition-all ${
                                showPriorityPopup || inputPriority !== 'none' 
                                ? 'bg-blue-50 ' + getPriorityColor(inputPriority) 
                                : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                            }`}
                            title="优先级"
                        >
                            <Zap size={18} fill={inputPriority !== 'none' ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                  </div>
                  
                  {/* Tag hint below input */}
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 px-1 ml-1">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">⌘ 选择常用待办</span> 
                      {selectedDate && (
                          <span className="ml-auto bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                              {formatDate(selectedDate, !!selectedDate && !isAllDay)}
                          </span>
                      )}
                      {!selectedDate && (
                           <span className="ml-auto text-gray-300">按回车创建 · 支持输入 !高 !低 标记优先级</span>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};