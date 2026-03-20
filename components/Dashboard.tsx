import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronRight, 
    Plus, 
    MoreHorizontal, 
    Calendar as CalendarIcon, 
    ChevronUp, 
    MoreVertical, 
    X, 
    Check, 
    ArrowLeft, 
    Repeat, 
    PenLine, 
    Trash2,
    RefreshCw,
    Cloud,
    Sun,
    CloudRain,
    MapPin,
    Wind,
    Droplets,
    RotateCw,
    CloudFog,
    Clock,
    Bell,
    Quote
} from 'lucide-react';
import { ViewType } from '../types';
import { eventService, CalendarEvent } from '../services/eventService';

interface DashboardProps {
  onChangeView: (view: ViewType) => void;
}

// Interfaces
interface Reminder {
    id: number;
    title: string;
    date: string; // YYYY-MM-DD
    type: string;
    alert: string;
    repeat: string;
    isAllDay: boolean;
    time: string; // HH:mm:ss
    displayMode: 'include_today' | 'exclude_today';
    displayFormat?: 'days' | 'ymd'; // New field for display toggle
    note?: string;
    // Calculated fields for display
    days?: number; 
    isPast?: boolean;
}

// Constants
const DEFAULT_REMINDER_TYPES = ['提醒日', '纪念日', '生日', '节日', '假日', '旅行', '上学', '毕业', '恋爱', '结婚', '工作'];
const ALERT_OPTIONS = [
    { label: '无', value: 'none' },
    { label: '当日9点提醒 (默认)', value: 'day_9am' },
    { label: '当日0点提醒', value: 'day_0am' },
    { label: '提前1小时提醒', value: 'before_1h' },
    { label: '提前3小时提醒', value: 'before_3h' },
    { label: '提前6小时提醒', value: 'before_6h' },
    { label: '提前一天提醒', value: 'before_1d' },
    { label: '提前三天提醒', value: 'before_3d' },
    { label: '提前一周提醒', value: 'before_1w' },
    { label: '提前两周提醒', value: 'before_2w' },
    { label: '按设置时间提醒', value: 'custom_time' },
];
const REPEAT_OPTIONS = ['不重复', '每周重复', '每月重复', '每年重复'];
const DISPLAY_MODES = [
    { label: '已有几天 (含今天)', value: 'include_today' },
    { label: '已过去几天 (不含今天)', value: 'exclude_today' },
];

const DAILY_QUOTES = [
    { text: "种一棵树最好的时间是十年前，其次是现在。", author: "Dambisa Moyo" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "生活不止眼前的苟且，还有诗和远方。", author: "高晓松" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "知行合一。", author: "王阳明" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
    { text: "既然选择了远方，便只顾风雨兼程。", author: "汪国真" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "不积跬步，无以至千里。", author: "荀子" }
];

// Helper to calculate days diff
const calculateDays = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        days: Math.abs(diffDays),
        isPast: diffDays < 0
    };
};

// Helper to calculate Year/Month/Day diff
const getDateDiff = (dateStr: string) => {
    const now = new Date();
    const target = new Date(dateStr);
    now.setHours(0,0,0,0);
    target.setHours(0,0,0,0);

    let d1 = now < target ? now : target;
    let d2 = now < target ? target : now;
    
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();

    if (days < 0) {
        months--;
        const prevMonthLastDay = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
        days += prevMonthLastDay;
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months, days };
};

const UNSPLASH_IMAGES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501854140884-074bf86ee911?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=2076&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop"
];

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const [isCoverCollapsed, setIsCoverCollapsed] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  
  // Schedule Settings State
  const [scheduleSettings, setScheduleSettings] = useState({
      showSubscriptions: true,
      showHolidays: true,
      showLunar: true
  });

  // Cover Image & Quote State
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(DAILY_QUOTES[0]);
  const [isRefreshingCover, setIsRefreshingCover] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  
  // Cover Reposition State
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPositionY, setCoverPositionY] = useState(50); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef<number | null>(null);
  const startPosY = useRef<number>(50);

  // Modal States
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  
  // Dynamic Types State
  const [availableTypes, setAvailableTypes] = useState<string[]>(DEFAULT_REMINDER_TYPES);

  // Synced Schedule State
  interface DisplayEvent {
      id: number;
      title: string;
      time: string;
      type: string;
      color: string;
      bgColor: string;
      textColor: string;
  }
  const [todaySchedule, setTodaySchedule] = useState<DisplayEvent[]>([]);

  // Form State
  const [formData, setFormData] = useState<Reminder>({
      id: 0,
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: '提醒日',
      alert: 'day_9am',
      repeat: '不重复',
      isAllDay: true,
      time: '09:00:00',
      displayMode: 'include_today',
      displayFormat: 'days',
      note: ''
  });
  
  // UI Logic State for Modal
  const [activeSelector, setActiveSelector] = useState<'type' | 'alert' | 'repeat' | 'time' | 'displayMode' | null>(null);
  const [isEditingCustomType, setIsEditingCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  // Drag and Drop State
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);

  // Initialize cover image and quote
  useEffect(() => {
      const savedDate = localStorage.getItem('cover_date');
      const todayStr = new Date().toDateString();
      
      // Randomize quote on mount
      setCurrentQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);

      if (savedDate !== todayStr) {
           refreshCoverImage();
           localStorage.setItem('cover_date', todayStr);
      } else {
           const savedIdx = localStorage.getItem('cover_idx');
           if (savedIdx) {
               setCoverImage(UNSPLASH_IMAGES[parseInt(savedIdx)]);
           } else {
               refreshCoverImage();
           }
      }
  }, []);

  // Fetch and Sync Schedule
  useEffect(() => {
    const fetchTodayEvents = () => {
        const allEvents = eventService.getEvents();
        const now = new Date();
        const todayEvents = allEvents.filter(e => 
            e.start.getDate() === now.getDate() &&
            e.start.getMonth() === now.getMonth() &&
            e.start.getFullYear() === now.getFullYear()
        );

        // Map to display format
        let mappedEvents: DisplayEvent[] = todayEvents.map(e => {
            const cat = eventService.getCategoryById(e.categoryId);
            const timeStr = e.isAllDay 
                ? '全天' 
                : `${String(e.start.getHours()).padStart(2,'0')}:${String(e.start.getMinutes()).padStart(2,'0')} - ${String(e.end.getHours()).padStart(2,'0')}:${String(e.end.getMinutes()).padStart(2,'0')}`;
            
            return {
                id: e.id,
                title: e.title,
                time: timeStr,
                type: cat?.label || '日程',
                categoryId: e.categoryId, // Keep raw category id for filtering
                color: cat?.color || 'bg-blue-500',
                bgColor: cat?.bgColor || 'bg-blue-50',
                textColor: cat?.textColor || 'text-blue-700'
            };
        });

        // Filter based on settings
        if (!scheduleSettings.showSubscriptions) {
            mappedEvents = mappedEvents.filter(e => {
                // Assuming 'subscribe' is the ID for subscription events
                return (e as any).categoryId !== 'subscribe';
            });
        }

        // Sort by time
        mappedEvents.sort((a, b) => a.time.localeCompare(b.time));
        setTodaySchedule(mappedEvents);
    };

    fetchTodayEvents();
    const unsubscribe = eventService.subscribe(fetchTodayEvents);
    return unsubscribe;
  }, [scheduleSettings.showSubscriptions]); // Re-run when subscription setting changes

  const refreshCoverImage = () => {
      setIsRefreshingCover(true);
      setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * UNSPLASH_IMAGES.length);
          setCoverImage(UNSPLASH_IMAGES[randomIndex]);
          
          // Refresh Quote
          const randomQuoteIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
          setCurrentQuote(DAILY_QUOTES[randomQuoteIndex]);

          localStorage.setItem('cover_idx', randomIndex.toString());
          setIsRefreshingCover(false);
          setCoverPositionY(50);
      }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setCoverImage(url);
          setCoverPositionY(50); 
          localStorage.removeItem('cover_idx');
      }
      setShowCoverMenu(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      e.preventDefault();
      dragStartY.current = e.clientY;
      startPosY.current = coverPositionY;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
          if (dragStartY.current === null) return;
          const deltaY = moveEvent.clientY - dragStartY.current;
          const newPos = Math.max(0, Math.min(100, startPosY.current - (deltaY * 0.2)));
          setCoverPositionY(newPos);
      };

      const handleMouseUp = () => {
          dragStartY.current = null;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  // Mock Data
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const weekDayStr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDate.getDay()];
  const lunarDate = "乙巳年十月廿一";
  const weekNumber = "第50周";
  const year = currentDate.getFullYear();
  const yearProgress = 94;

  const holidays = [
      { date: '2月11日 周三', name: '北方小年', type: 'holiday', dayType: '南方小年' },
      { date: '2月14日 周六', name: '情人节', type: 'festival', dayType: '腊月廿七' },
      { date: '2月16日 周一', name: '除夕', type: 'holiday', dayType: '腊月廿九' },
      { date: '2月17日 周二', name: '春节', type: 'holiday', dayType: '春节' },
      { date: '3月3日 周二', name: '元宵节', type: 'festival', dayType: '元宵' },
  ];

  const [reminders, setReminders] = useState<Reminder[]>([
      { 
          id: 1,
          title: '春节还有', 
          date: '2026-02-17',
          type: '节日',
          alert: 'day_9am',
          repeat: '每年重复',
          isAllDay: true,
          time: '09:00:00',
          displayMode: 'include_today',
          displayFormat: 'days'
      },
      { id: 2, title: '在一起已有', date: '2024-05-20', type: '恋爱', alert: 'none', repeat: '不重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
      { id: 3, title: '见宝宝已有', date: '2024-05-14', type: '纪念日', alert: 'none', repeat: '不重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
      { id: 4, title: '认识老婆已有', date: '2024-04-10', type: '纪念日', alert: 'none', repeat: '不重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
      { id: 5, title: '来长沙当牛马已有', date: '2020-05-20', type: '工作', alert: 'none', repeat: '不重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
      { id: 6, title: '宝宝出生已有', date: '1998-12-10', type: '生日', alert: 'day_9am', repeat: '每年重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
      { id: 7, title: '出生已有', date: '1995-12-10', type: '生日', alert: 'day_9am', repeat: '每年重复', isAllDay: true, time: '00:00:00', displayMode: 'include_today', displayFormat: 'days' },
  ]);

  const handleAddSchedule = () => {
      onChangeView(ViewType.CALENDAR);
  };

  const openAddReminder = () => {
      setFormData({
        id: Date.now(),
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: '提醒日',
        alert: 'day_9am',
        repeat: '不重复',
        isAllDay: true,
        time: '09:00:00',
        displayMode: 'include_today',
        displayFormat: 'days',
        note: ''
      });
      setIsEditingCustomType(false);
      setActiveSelector(null);
      setShowAddReminderModal(true);
      setShowScheduleMenu(false); // Close menu if open
  };

  const openEditReminder = (reminder: Reminder) => {
      setFormData({ ...reminder });
      setIsEditingCustomType(false);
      setActiveSelector(null);
      setSelectedReminder(null);
      setShowAddReminderModal(true);
  };

  const saveReminder = () => {
      let finalType = formData.type;
      
      // If user is currently editing custom type and presses save, use that input
      if (isEditingCustomType && customTypeInput.trim()) {
          finalType = customTypeInput.trim();
      }

      // Add to available types if it's new
      if (!availableTypes.includes(finalType)) {
          setAvailableTypes(prev => [...prev, finalType]);
      }

      const isPast = calculateDays(formData.date).isPast;
      const title = formData.title || (finalType + (isPast ? '已有' : '还有'));
      const newReminder = { ...formData, type: finalType, title };
      
      setReminders(prev => {
          const exists = prev.find(r => r.id === newReminder.id);
          if (exists) {
              return prev.map(r => r.id === newReminder.id ? newReminder : r);
          }
          return [newReminder, ...prev];
      });
      setShowAddReminderModal(false);
      setIsEditingCustomType(false); // Reset mode
  };

  const deleteReminder = (id: number) => {
      setReminders(prev => prev.filter(r => r.id !== id));
      setSelectedReminder(null);
  };
  
  const toggleDisplayFormat = () => {
      if (!selectedReminder) return;
      // Explicitly type newFormat to ensure correct type inference for the Reminder interface
      const newFormat: 'days' | 'ymd' = selectedReminder.displayFormat === 'ymd' ? 'days' : 'ymd';
      const updated: Reminder = { ...selectedReminder, displayFormat: newFormat };
      setSelectedReminder(updated);
      setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  // --- Drag and Drop Handlers ---
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDragItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Optional: Set drag image or data if needed
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      // Prevent redundant updates and flickering
      if (dragItemIndex === null || dragItemIndex === index) return;

      const newReminders = [...reminders];
      const draggedItemContent = newReminders[dragItemIndex];
      
      // Remove from old index
      newReminders.splice(dragItemIndex, 1);
      // Insert at new index
      newReminders.splice(index, 0, draggedItemContent);

      // Update index tracking immediately
      setDragItemIndex(index);
      setReminders(newReminders);
  };

  const onDragEnd = () => {
      setDragItemIndex(null);
  };

  const ScheduleMenu = () => (
      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-100 p-1 w-48 z-50 animate-in fade-in zoom-in-95 duration-200 select-none">
          <div 
              onClick={() => setScheduleSettings(s => ({ ...s, showSubscriptions: !s.showSubscriptions }))}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded transition-colors"
          >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${scheduleSettings.showSubscriptions ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  {scheduleSettings.showSubscriptions && <Check size={10} strokeWidth={4} />}
              </div>
              显示订阅事件
          </div>
          <div 
              onClick={() => setScheduleSettings(s => ({ ...s, showHolidays: !s.showHolidays }))}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded transition-colors"
          >
               <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${scheduleSettings.showHolidays ? 'bg-gray-900' : 'bg-gray-200'}`}>
                   {scheduleSettings.showHolidays && <Check size={10} strokeWidth={4} />}
               </div>
              显示节假日
          </div>
          <div 
              onClick={() => setScheduleSettings(s => ({ ...s, showLunar: !s.showLunar }))}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded transition-colors"
          >
               <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${scheduleSettings.showLunar ? 'bg-gray-900' : 'bg-gray-200'}`}>
                   {scheduleSettings.showLunar && <Check size={10} strokeWidth={4} />}
               </div>
              显示农历信息
          </div>
          <div className="h-px bg-gray-100 my-1"></div>
          <div 
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded transition-colors" 
            onClick={(e) => {
                e.stopPropagation();
                openAddReminder();
            }}
          >
              <Plus size={14} /> 添加提醒日
          </div>
      </div>
  );

  // --- Sub-Components for Modal Selections ---
  const SelectorHeader = ({ title, onBack }: { title: string, onBack: () => void }) => (
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
              <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="flex-1 text-center font-medium text-gray-900">{title}</div>
          <div className="w-5"></div>
      </div>
  );

  const SelectionList = ({ items, current, onSelect }: { items: string[], current: string, onSelect: (val: string) => void }) => (
      <div className="flex flex-col py-1">
          {items.map(item => (
              <button 
                key={item} 
                onClick={() => onSelect(item)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                  <span className={`text-sm ${item === current ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                      {item}
                  </span>
                  {item === current && <Check size={16} className="text-blue-600" />}
              </button>
          ))}
      </div>
  );

  const TimePicker = () => {
    // Parsing current time
    const [h, m, s] = formData.time ? formData.time.split(':') : ['09', '00', '00'];
    const [hh, setHh] = useState(h);
    const [mm, setMm] = useState(m);
    const [ss, setSs] = useState(s);

    const updateTime = (nh: string, nm: string, ns: string) => {
        setHh(nh); setMm(nm); setSs(ns);
        setFormData({ ...formData, time: `${nh}:${nm}:${ns}` });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <SelectorHeader title="时间" onBack={() => setActiveSelector(null)} />
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-gray-700">全天</span>
                    <button 
                        onClick={() => setFormData({ ...formData, isAllDay: !formData.isAllDay })}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors ${formData.isAllDay ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.isAllDay ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {!formData.isAllDay && (
                    <div className="flex items-center justify-center gap-4 py-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        {/* Hour */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-2">时</span>
                            <div className="h-24 w-16 bg-gray-50 rounded-lg overflow-hidden relative">
                                <input 
                                    type="number" 
                                    min="0" max="23"
                                    value={hh}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value);
                                        if (val < 0) val = 0; if (val > 23) val = 23;
                                        updateTime(val.toString().padStart(2, '0'), mm, ss);
                                    }}
                                    className="w-full h-full text-center text-2xl font-bold bg-transparent outline-none appearance-none"
                                />
                                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none"></div>
                                <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                        <span className="text-xl font-bold text-gray-300 mt-6">:</span>
                        {/* Minute */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-2">分</span>
                             <div className="h-24 w-16 bg-gray-50 rounded-lg overflow-hidden relative">
                                <input 
                                    type="number" 
                                    min="0" max="59"
                                    value={mm}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value);
                                        if (val < 0) val = 0; if (val > 59) val = 59;
                                        updateTime(hh, val.toString().padStart(2, '0'), ss);
                                    }}
                                    className="w-full h-full text-center text-2xl font-bold bg-transparent outline-none appearance-none"
                                />
                            </div>
                        </div>
                        <span className="text-xl font-bold text-gray-300 mt-6">:</span>
                        {/* Second */}
                         <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-2">秒</span>
                             <div className="h-24 w-16 bg-gray-50 rounded-lg overflow-hidden relative">
                                <input 
                                    type="number" 
                                    min="0" max="59"
                                    value={ss}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value);
                                        if (val < 0) val = 0; if (val > 59) val = 59;
                                        updateTime(hh, mm, val.toString().padStart(2, '0'));
                                    }}
                                    className="w-full h-full text-center text-2xl font-bold bg-transparent outline-none appearance-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-transparent shrink-0 z-10">
          <div className="flex items-center gap-4">
               <div className="flex items-center text-gray-400 gap-2">
                   <ChevronRight size={16} className="rotate-180 cursor-pointer hover:text-gray-600" />
                   <ChevronRight size={16} className="cursor-pointer hover:text-gray-600" />
               </div>
               <h1 className="text-lg font-medium text-gray-600">今天</h1>
          </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto">
            {/* Illustration/Cover Area */}
            <div 
                className={`w-full rounded-3xl mb-6 relative overflow-hidden flex items-end justify-center transition-all duration-500 ease-in-out group/cover ${isCoverCollapsed ? 'h-0 mb-0 opacity-0' : 'h-48 md:h-64'}`}
            >
                 {/* Illustration Controls */}
                 <div className={`absolute top-4 right-4 z-20 flex gap-2 transition-opacity duration-300 ${isRepositioning ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                     <button 
                        onClick={refreshCoverImage}
                        disabled={isRefreshingCover}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
                        title="刷新封面"
                     >
                         <RefreshCw size={16} className={isRefreshingCover ? 'animate-spin' : ''} />
                     </button>
                     <button 
                        onClick={() => setIsCoverCollapsed(true)}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
                        title="折叠封面"
                    >
                         <ChevronUp size={16} />
                     </button>
                     
                     {/* Cover Menu Button */}
                     <div className="relative">
                         <button 
                            onClick={() => setShowCoverMenu(!showCoverMenu)}
                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
                         >
                             <MoreVertical size={16} />
                         </button>

                         {showCoverMenu && (
                             <>
                                <div className="fixed inset-0 z-20 cursor-default" onClick={() => setShowCoverMenu(false)}></div>
                                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 w-32 z-30 animate-in fade-in zoom-in-95 duration-200 select-none">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                                    >
                                        更换封面
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowCoverMenu(false);
                                            setIsRepositioning(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                                    >
                                        重设位置
                                    </button>
                                </div>
                             </>
                         )}
                     </div>
                 </div>

                 {/* Cover Image or Fallback SVG */}
                 <div className="absolute inset-0 bg-gray-100">
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*" 
                         onChange={handleFileUpload} 
                     />
                     
                     {coverImage ? (
                         <div className="relative w-full h-full">
                             <img 
                                src={coverImage} 
                                alt="Cover" 
                                style={{ objectPosition: `center ${coverPositionY}%` }}
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isRefreshingCover ? 'opacity-80 blur-sm' : 'opacity-100'} ${isRepositioning ? 'cursor-move' : ''}`} 
                             />
                             <div className={`absolute inset-0 bg-black/10 pointer-events-none transition-opacity duration-200 ${isRepositioning ? 'opacity-0' : 'opacity-100'}`}></div>
                             
                             {/* Reposition Overlay */}
                             {isRepositioning && (
                                <div 
                                    className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-move bg-black/5"
                                    onMouseDown={handleMouseDown}
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                                        <button 
                                            onClick={() => setIsRepositioning(false)}
                                            className="px-4 py-1.5 bg-white rounded-full text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
                                        >
                                            保存
                                        </button>
                                    </div>
                                    <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md pointer-events-none select-none">
                                        按住拖动调整位置
                                    </div>
                                </div>
                             )}
                             
                             {/* Weather Overlay on Cover (Hidden when Repositioning) */}
                             {!isRepositioning && (
                                <div className="absolute top-6 left-8 text-white z-10 flex items-start gap-6 pointer-events-none select-none animate-in fade-in duration-300">
                                    <div className="flex gap-4 items-center">
                                        <CloudFog size={56} className="text-white drop-shadow-md" />
                                        <div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-xl font-medium drop-shadow-md">雾</span>
                                                <span className="text-4xl font-bold drop-shadow-md">12°C</span>
                                            </div>
                                            <div className="text-sm text-white/90 mt-1 flex flex-col gap-0.5 drop-shadow-sm font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Wind size={14} />
                                                        <span>南风 1级</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Droplets size={14} />
                                                        <span>湿度 88%</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs opacity-80 mt-1">当前区域无PM2.5数据</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden md:flex h-16 w-px bg-white/30 mx-2"></div>

                                    <div className="hidden md:flex flex-col justify-between h-full gap-2">
                                        <div className="flex items-center gap-2 text-sm font-medium drop-shadow-md">
                                            <MapPin size={16} />
                                            <span>岳麓</span>
                                            <button className="pointer-events-auto hover:bg-white/20 rounded p-1 transition-colors ml-1">
                                                <RotateCw size={14} />
                                            </button>
                                        </div>

                                        <div className="flex gap-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-medium drop-shadow-sm">今天</span>
                                                <span className="text-[10px] opacity-90">晴</span>
                                                <Sun size={18} />
                                                <span className="text-[10px] opacity-90">7°~21°</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-medium drop-shadow-sm">明天</span>
                                                <span className="text-[10px] opacity-90">多云</span>
                                                <Cloud size={18} />
                                                <span className="text-[10px] opacity-90">9°~22°</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-medium drop-shadow-sm">后天</span>
                                                <span className="text-[10px] opacity-90">小雨</span>
                                                <CloudRain size={18} />
                                                <span className="text-[10px] opacity-90">6°~16°</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             )}

                             {/* Daily Quote Overlay */}
                             {!isRepositioning && (
                                <div className="absolute bottom-6 left-8 text-white z-10 max-w-lg pointer-events-none select-none hidden md:block animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-lg font-medium drop-shadow-md tracking-wide leading-relaxed">“{currentQuote.text}”</p>
                                    <div className="flex items-center gap-2 mt-2 opacity-90">
                                         <div className="h-px w-6 bg-white/60"></div>
                                         <span className="text-xs font-medium drop-shadow-sm uppercase tracking-wider">{currentQuote.author}</span>
                                    </div>
                                </div>
                             )}

                             <a 
                                href="https://unsplash.com" 
                                target="_blank" 
                                rel="noreferrer"
                                className={`absolute bottom-3 right-4 text-[10px] text-white/70 hover:text-white bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-md transition-opacity ${isRepositioning ? 'opacity-0' : 'opacity-100'}`}
                             >
                                 Photo by Unsplash
                             </a>
                         </div>
                     ) : (
                         /* Fallback SVG with Weather Overlay styled slightly differently for light background */
                         <div className="w-full h-full relative">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none bg-gradient-to-b from-white to-blue-50/30">
                                <svg className="w-full h-full max-w-3xl" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 220 C 120 210, 140 230, 160 220" stroke="#CBD5E1" strokeWidth="2" fill="none" />
                                    <path d="M90 230 C 110 220, 130 240, 150 230" stroke="#CBD5E1" strokeWidth="2" fill="none" opacity="0.6"/>
                                    <path d="M400 120 Q 300 120 150 200" stroke="#64748B" strokeWidth="2" fill="none" strokeDasharray="5 5" />
                                    <circle cx="150" cy="200" r="5" fill="#EF4444" />
                                    <circle cx="150" cy="200" r="15" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                                    <g transform="translate(480, 80)">
                                        <circle cx="50" cy="50" r="40" fill="white" stroke="#333" strokeWidth="2"/>
                                        <path d="M15 30 L 15 10 L 40 25" fill="#FCD34D" stroke="#333" strokeWidth="2"/>
                                        <path d="M85 30 L 85 10 L 60 25" fill="#FCD34D" stroke="#333" strokeWidth="2"/>
                                        <path d="M10 35 Q 50 10 90 35" fill="#FCD34D" stroke="#333" strokeWidth="2"/>
                                        <path d="M30 20 Q 50 0 70 20" fill="#FCD34D" stroke="#333" strokeWidth="2"/>
                                        <circle cx="35" cy="45" r="4" fill="#333"/>
                                        <circle cx="65" cy="45" r="4" fill="#333"/>
                                        <path d="M45 55 Q 50 60 55 55" stroke="#333" strokeWidth="2" fill="none"/>
                                        <path d="M50 50 L 50 53" stroke="#333" strokeWidth="2"/>
                                        <path d="M30 85 Q 50 120 70 85" fill="#FCD34D" stroke="#333" strokeWidth="2"/>
                                        <line x1="80" y1="80" x2="-80" y2="40" stroke="#8B4513" strokeWidth="3" />
                                    </g>
                                    <path d="M420 200 Q 500 180 600 200 T 750 220" stroke="#333" strokeWidth="1.5" fill="none"/>
                                    <path d="M620 190 Q 630 160 640 190" stroke="#22C55E" strokeWidth="2" fill="#22C55E"/>
                                    <path d="M630 195 Q 640 150 650 195" stroke="#22C55E" strokeWidth="2" fill="#22C55E"/>
                                </svg>
                            </div>
                            {/* Weather for Light Illustration Background - Dark Text */}
                            <div className="absolute top-6 left-8 text-gray-700 z-10 flex items-start gap-6 pointer-events-none select-none">
                                <div className="flex gap-4 items-center">
                                    <CloudFog size={56} className="text-gray-400" />
                                    <div>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-xl font-medium">雾</span>
                                            <span className="text-4xl font-bold text-gray-800">12°C</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex flex-col gap-0.5 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Wind size={14} />
                                                    <span>南风 1级</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Droplets size={14} />
                                                    <span>湿度 88%</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">当前区域无PM2.5数据</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Date */}
                <div className="md:col-span-4 flex flex-col gap-6 h-full">
                    {/* Date Card */}
                    <div 
                        onClick={() => onChangeView(ViewType.CALENDAR)}
                        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] flex justify-between items-center relative overflow-hidden h-[180px] cursor-pointer hover:shadow-lg hover:border-purple-100 transition-all group shrink-0"
                    >
                        <div className="z-10 pointer-events-none">
                            <div className="text-5xl font-light text-gray-800 mb-2 font-sans tracking-tight group-hover:text-purple-600 transition-colors">
                                {month}月{day}日 <span className="text-2xl text-gray-500 font-normal ml-1">{weekDayStr}</span>
                            </div>
                            <div className="text-gray-500 text-sm mb-1">{lunarDate}</div>
                            <div className="text-gray-400 text-xs">{weekNumber} <span className="float-right ml-16">{year}</span></div>
                        </div>
                        
                        {/* Year Progress Circle */}
                        <div className="relative w-24 h-24 flex items-center justify-center shrink-0 -mr-2">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#F3F4F6" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="50" cy="50" r="40" 
                                    stroke="#8B5CF6" 
                                    strokeWidth="8" 
                                    fill="none" 
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - yearProgress / 100)}`}
                                    strokeLinecap="round"
                                />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600">
                                 {yearProgress}%
                             </div>
                        </div>
                    </div>

                    {/* Today's Schedule (Synced from EventService) */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] flex-1 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                             <div className="text-gray-500 font-medium">今日安排</div>
                             <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{todaySchedule.length} 项</span>
                        </div>
                        
                        {todaySchedule.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                                <CalendarIcon size={32} strokeWidth={1.5} />
                                <span className="text-sm">暂无安排</span>
                                <button onClick={handleAddSchedule} className="mt-2 text-xs text-blue-500 hover:underline">去日历添加</button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[4.5rem] top-2 bottom-2 w-px bg-gray-100"></div>

                                {todaySchedule.map((event) => (
                                    <div key={event.id} className="flex gap-4 relative group cursor-pointer hover:bg-gray-50/50 rounded-lg -mx-2 px-2 py-1 transition-colors">
                                        <div className="w-14 text-right pt-1 flex-shrink-0">
                                            <div className="text-sm font-semibold text-gray-900 font-sans whitespace-nowrap overflow-hidden text-ellipsis">{event.time.split(' - ')[0]}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{event.time.split(' - ')[1]}</div>
                                        </div>
                                        
                                        {/* Timeline Dot */}
                                        <div className="relative pt-2 flex flex-col items-center">
                                             <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${event.color}`}></div>
                                        </div>

                                        <div className={`flex-1 p-3 rounded-xl border-l-2 mb-1 ${event.bgColor} ${event.textColor} ${event.color.replace('bg-', 'border-l-')} hover:shadow-sm transition-all`}>
                                            <div className="font-bold text-sm mb-1">{event.title}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 border border-black/5 font-medium">
                                                    {event.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="h-4"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Column: Upcoming Schedule */}
                <div className="md:col-span-4 h-full">
                     <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] h-full min-h-[600px] relative z-20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-gray-500 font-medium">日程</h3>
                            <div className="flex gap-2 text-gray-400 relative">
                                <button onClick={handleAddSchedule} className="hover:text-gray-600 hover:bg-gray-100 rounded p-0.5 transition-colors">
                                    <Plus size={18} />
                                </button>
                                
                                {/* Schedule Settings Menu */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                                        className="hover:text-gray-600 hover:bg-gray-100 rounded p-0.5 transition-colors"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    {showScheduleMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowScheduleMenu(false)}></div>
                                            <ScheduleMenu />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                             {/* First special row for "Today" if needed, or just list */}
                             <div className="flex justify-between items-center py-1">
                                 <div className="flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                                     <span className="text-gray-600 text-sm">北方小年</span>
                                 </div>
                                 <span className="text-gray-400 text-sm">全天</span>
                             </div>

                             {scheduleSettings.showHolidays && holidays.map((h, i) => (
                                 <div key={i} className="flex justify-between items-start group cursor-pointer hover:bg-gray-50 rounded-lg p-1 -mx-1 transition-colors">
                                     <div>
                                         <div className="text-gray-800 text-sm mb-0.5">{h.date}</div>
                                         <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                                {h.name === '情人节' ? '情' : h.name === '除夕' ? '除' : h.name === '春节' ? '春' : '商'}
                                            </span>
                                            <span className="text-gray-500 text-xs">{h.name}</span>
                                         </div>
                                     </div>
                                     {scheduleSettings.showLunar && (
                                         <div className="text-gray-400 text-xs pt-0.5">{h.dayType === '全天' ? '全天' : h.dayType}</div>
                                     )}
                                 </div>
                             ))}
                        </div>
                     </div>
                </div>

                {/* Right Column: Countdown Days */}
                <div className="md:col-span-4 h-full">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] h-full min-h-[600px] z-10">
                         <div className="flex justify-between items-center mb-6 relative">
                            <h3 className="text-gray-500 font-medium">提醒日</h3>
                            <button 
                                onClick={openAddReminder}
                                className="text-gray-400 cursor-pointer hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Featured Countdown (using first item) */}
                            {reminders.length > 0 && (() => {
                                const item = reminders[0];
                                const { days, isPast } = calculateDays(item.date);
                                
                                return (
                                <div 
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, 0)}
                                    onDragEnter={(e) => onDragEnter(e, 0)}
                                    onDragEnd={onDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => setSelectedReminder(item)}
                                    className={`mb-6 p-5 rounded-2xl cursor-move group transition-all relative overflow-hidden ${
                                        dragItemIndex === 0 ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-md'
                                    } ${isPast ? 'bg-orange-50' : 'bg-blue-50'}`}
                                >
                                    {/* Decorative background element */}
                                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 pointer-events-none ${isPast ? 'bg-orange-300' : 'bg-blue-300'}`}></div>

                                    <div className={`text-sm mb-2 font-medium transition-colors pointer-events-none ${isPast ? 'text-orange-900' : 'text-blue-900'}`}>
                                        {item.title}
                                    </div>
                                    <div className={`flex items-baseline gap-1 pointer-events-none ${isPast ? 'text-orange-500' : 'text-blue-500'}`}>
                                        <span className="text-6xl font-light tracking-tighter">{days}</span>
                                        <span className="text-sm font-medium">天</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pointer-events-none">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPast ? 'bg-white/60 text-orange-700' : 'bg-white/60 text-blue-700'}`}>
                                            {item.type}
                                        </span>
                                        <span className={`text-xs ${isPast ? 'text-orange-600/70' : 'text-blue-600/70'}`}>
                                            {item.date}
                                        </span>
                                    </div>
                                </div>
                                );
                            })()}

                            {/* List Countdowns */}
                            <div className="space-y-5">
                                {reminders.slice(1).map((item, i) => {
                                    const index = i + 1;
                                    const { days, isPast } = calculateDays(item.date);
                                    return (
                                        <div 
                                            key={item.id} 
                                            draggable
                                            onDragStart={(e) => onDragStart(e, index)}
                                            onDragEnter={(e) => onDragEnter(e, index)}
                                            onDragEnd={onDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            onClick={() => setSelectedReminder(item)}
                                            className={`flex justify-between items-center group cursor-move hover:bg-gray-50 rounded-lg p-1 -mx-1 transition-all ${dragItemIndex === index ? 'opacity-40 bg-gray-50' : ''}`}
                                        >
                                            <div className="pointer-events-none">
                                                <div className="text-gray-600 text-sm group-hover:text-gray-900 mb-0.5">{item.title}</div>
                                                <div className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit">{item.type}</div>
                                            </div>
                                            <div className={`flex items-baseline gap-1 font-medium pointer-events-none ${isPast ? 'text-orange-500' : 'text-blue-500'}`}>
                                                <span className="text-2xl font-normal">{days}</span>
                                                <span className="text-xs text-gray-400">天</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Reminder Detail Modal (View Only) */}
        {selectedReminder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <div className="bg-white rounded-3xl shadow-2xl w-[340px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col min-h-[400px]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4">
                         <button 
                            onClick={() => setSelectedReminder(null)} 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                         >
                            <ArrowLeft size={22} />
                         </button>
                         <button 
                            onClick={() => setSelectedReminder(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                         >
                             <X size={22} />
                         </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center pb-8 -mt-4">
                        <div className="text-gray-500 text-lg mb-6 font-normal tracking-wide">{selectedReminder.title}</div>
                        
                        {/* Countdown Display Area */}
                        <div 
                            className="flex items-center justify-center mb-8 cursor-pointer select-none hover:opacity-80 transition-opacity px-4 text-center"
                            onClick={toggleDisplayFormat}
                        >
                            {selectedReminder.displayFormat === 'ymd' ? (
                                (() => {
                                    const { years, months, days } = getDateDiff(selectedReminder.date);
                                    const isPast = calculateDays(selectedReminder.date).isPast;
                                    const colorClass = isPast ? 'text-orange-500' : 'text-blue-500';
                                    
                                    return (
                                        <div className={`flex items-center justify-center gap-1 ${colorClass}`}>
                                            {years > 0 && (
                                                <>
                                                    <span className="text-6xl font-bold tracking-tighter">{years}</span>
                                                    <span className="text-6xl font-normal">年</span>
                                                </>
                                            )}
                                            {months > 0 && (
                                                <>
                                                    <span className="text-6xl font-bold tracking-tighter ml-1">{months}</span>
                                                    <span className="text-6xl font-normal">月</span>
                                                </>
                                            )}
                                            {(days > 0 || (years === 0 && months === 0)) && (
                                                <>
                                                    <span className="text-6xl font-bold tracking-tighter ml-1">{days}</span>
                                                    <span className="text-6xl font-normal">天</span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className={`flex items-center justify-center gap-1 ${calculateDays(selectedReminder.date).isPast ? 'text-orange-500' : 'text-blue-500'}`}>
                                     <span className="text-7xl font-bold tracking-tighter">
                                        {calculateDays(selectedReminder.date).days}
                                     </span>
                                     <span className="text-6xl font-normal">天</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Sub Info Pill */}
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                             <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">
                                 {selectedReminder.type}
                             </span>
                             <span className="text-sm text-gray-500 font-sans">
                                 {selectedReminder.date}
                             </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                             <RefreshCw size={16} />
                             <span>{selectedReminder.repeat}</span>
                        </div>
                        <div className="flex items-center gap-5 text-gray-400">
                             <button 
                                onClick={() => openEditReminder(selectedReminder)}
                                className="hover:text-purple-600 transition-colors"
                             >
                                <PenLine size={22} />
                             </button>
                             <button 
                                onClick={() => deleteReminder(selectedReminder.id)}
                                className="hover:text-red-500 transition-colors"
                             >
                                <Trash2 size={22} />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};