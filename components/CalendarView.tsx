import React, { useState, useEffect, useRef } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    MapPin, 
    Plus, 
    X, 
    Calendar as CalendarIcon, 
    AlignLeft, 
    Search,
    Filter,
    Trash2,
    CheckSquare,
    Check,
    ChevronDown,
    Bell,
    RefreshCw
} from 'lucide-react';
import { eventService, CalendarEvent, CalendarCategory } from '../services/eventService';

// --- Types ---

type ViewType = 'day' | 'week' | 'month' | 'year';

interface HolidayData {
    name: string;
    isHoliday: boolean; // Is it a significant festival (red text)
    status?: 'rest' | 'work'; // Statutory holiday status: 'rest' for 休, 'work' for 班
}

// Mock Holidays for 2025-2026
const HOLIDAYS: Record<string, HolidayData> = {
    // 2025 Jan
    '2025-01-01': { name: '元旦', isHoliday: true, status: 'rest' },
    '2025-01-28': { name: '除夕', isHoliday: true, status: 'rest' },
    '2025-01-29': { name: '春节', isHoliday: true, status: 'rest' },
    '2025-01-26': { name: '上班', isHoliday: false, status: 'work' }, 
    '2025-02-08': { name: '上班', isHoliday: false, status: 'work' },
    
    // Other 2025 major holidays
    '2025-04-04': { name: '清明', isHoliday: true, status: 'rest' },
    '2025-05-01': { name: '劳动节', isHoliday: true, status: 'rest' },
    '2025-06-02': { name: '端午', isHoliday: true, status: 'rest' },
    '2025-10-01': { name: '国庆节', isHoliday: true, status: 'rest' },
    '2025-10-06': { name: '中秋', isHoliday: true, status: 'rest' },

    // December 2025 (Demo Focus)
    '2025-12-07': { name: '大雪', isHoliday: false }, 
    '2025-12-21': { name: '冬至', isHoliday: true },  
    '2025-12-24': { name: '平安夜', isHoliday: true },
    '2025-12-25': { name: '圣诞节', isHoliday: true },
    
    // Jan 2026 (For testing future navigation)
    '2026-01-01': { name: '元旦', isHoliday: true, status: 'rest' },
};

// Simplified Lunar Calculation for Demo (Calibrated to 2025-12-11 = 10-22)
const getLunarDate = (date: Date): string => {
    const baseDate = new Date(2025, 11, 11); // Dec 11, 2025
    // Lunar 2025: Dec 11 is 10-22. 
    
    const diffTime = date.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let baseLunarMonth = 10;
    let baseLunarDay = 22;

    let currentLunarDay = baseLunarDay + diffDays;
    let currentLunarMonth = baseLunarMonth;

    // Very rough approximation of 29/30 day months
    while (currentLunarDay > 30) {
        currentLunarDay -= 30;
        currentLunarMonth++;
    }
    while (currentLunarDay <= 0) {
        currentLunarDay += 29;
        currentLunarMonth--;
    }
    
    // Normalize month (1-12)
    let displayMonth = currentLunarMonth;
    while(displayMonth > 12) displayMonth -= 12;
    while(displayMonth < 1) displayMonth += 12;

    const cnNums = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '腊月'];
    
    const prefix = currentLunarDay <= 10 ? '初' : currentLunarDay < 20 ? '十' : currentLunarDay === 20 ? '二十' : currentLunarDay < 30 ? '廿' : '三十';
    const daySuffix = currentLunarDay % 10 === 0 ? (currentLunarDay === 10 ? '初十' : currentLunarDay === 20 ? '二十' : '三十') : cnNums[currentLunarDay % 10];
    
    if (currentLunarDay === 1) {
        return months[displayMonth - 1];
    }
    
    return currentLunarDay === 10 ? '初十' : currentLunarDay === 20 ? '二十' : currentLunarDay === 30 ? '三十' : prefix + daySuffix;
};

export const CalendarView: React.FC = () => {
  // Initialize with 2025-12-11 to match screenshot for demo, but users can navigate
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 11)); 
  
  const [viewType, setViewType] = useState<ViewType>('month'); 
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formCategory, setFormCategory] = useState("default");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formNote, setFormNote] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Load Data from Service
  useEffect(() => {
      setCategories(eventService.getCategories());
      setEvents(eventService.getEvents());

      // Subscribe to changes
      const unsubscribe = eventService.subscribe(() => {
          setEvents(eventService.getEvents());
      });

      return unsubscribe;
  }, []);

  // --- Derived Data ---
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); 
  const currentDay = currentDate.getDate();
  const currentWeekDay = weekDays[currentDate.getDay()];
  
  // Header Lunar String logic
  const todayLunar = getLunarDate(currentDate);
  // Simple check for holiday today
  const todayHoliday = (() => {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      return HOLIDAYS[`${y}-${m}-${d}`];
  })();
  
  const lunarStr = "乙巳蛇年 " + (todayHoliday ? todayHoliday.name : todayLunar);

  const visibleEvents = events.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return cat && cat.isChecked;
  });

  const dayEvents = visibleEvents.filter(e => {
      return e.start.getDate() === currentDay && 
             e.start.getMonth() === currentMonth && 
             e.start.getFullYear() === currentYear;
  });

  // --- Helpers ---
  const getCategoryStyle = (catId: string) => {
      const cat = categories.find(c => c.id === catId) || categories[0] || { color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' };
      return cat;
  };

  const getHolidayInfo = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      return HOLIDAYS[key];
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
      const newDate = new Date(currentDate);
      if (direction === 'today') {
          setCurrentDate(new Date());
          return;
      }
      
      const step = direction === 'next' ? 1 : -1;
      
      if (viewType === 'day') {
          newDate.setDate(currentDate.getDate() + step);
      } else if (viewType === 'week') {
          newDate.setDate(currentDate.getDate() + (step * 7));
      } else if (viewType === 'month') {
          newDate.setMonth(currentDate.getMonth() + step);
      } else if (viewType === 'year') {
          newDate.setFullYear(currentDate.getFullYear() + step);
      }
      setCurrentDate(newDate);
  };

  const toggleCategory = (id: string) => {
      setCategories(prev => prev.map(c => 
          c.id === id ? { ...c, isChecked: !c.isChecked } : c
      ));
  };

  const parseDateTime = (dateStr: string, timeStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const [th, tm] = timeStr.split(':').map(Number);
      return new Date(y, m - 1, d, th, tm);
  };

  function weekNumberString(date: Date): string {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const result = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
      return `第${result}周`;
  }

  const getHeaderTitle = () => {
      if (viewType === 'year') {
          return `${currentYear}年`;
      }
      if (viewType === 'week') {
          return `${currentYear}年${currentMonth + 1}月 ${weekNumberString(currentDate)}`;
      }
      // Month or Day view mostly share this
      return `${currentYear}年${currentMonth + 1}月`;
  };

  // --- CRUD Operations ---

  const handleCreateEvent = (presetDate?: Date, presetHour?: number) => {
      const targetDate = presetDate || currentDate;
      
      setFormTitle("");
      setFormDate(`${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`);
      setFormNote("");
      setFormLocation("");
      setShowCategoryDropdown(false);
      
      if (presetHour !== undefined) {
          setFormStartTime(`${String(presetHour).padStart(2,'0')}:00`);
          setFormEndTime(`${String(presetHour+1).padStart(2,'0')}:00`);
      } else {
          setFormStartTime("12:00");
          setFormEndTime("13:00");
      }
      
      setFormCategory("default");
      setFormIsAllDay(false);
      setSelectedEvent(null);
      setIsModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
      setSelectedEvent(event);
      setFormTitle(event.title);
      setFormDate(`${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`);
      setFormStartTime(`${String(event.start.getHours()).padStart(2, '0')}:${String(event.start.getMinutes()).padStart(2, '0')}`);
      setFormEndTime(`${String(event.end.getHours()).padStart(2, '0')}:${String(event.end.getMinutes()).padStart(2, '0')}`);
      setFormCategory(event.categoryId);
      setFormIsAllDay(event.isAllDay || false);
      setFormNote(event.description || "");
      setFormLocation(event.location || "");
      setShowCategoryDropdown(false);
      setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
      const titleToSave = formTitle.trim() || "新的日程";
      const start = parseDateTime(formDate, formStartTime);
      const end = parseDateTime(formDate, formEndTime);

      if (selectedEvent) {
          const updatedEvent: CalendarEvent = {
              ...selectedEvent,
              title: titleToSave,
              start,
              end,
              categoryId: formCategory,
              isAllDay: formIsAllDay,
              description: formNote,
              location: formLocation
          };
          eventService.updateEvent(updatedEvent);
      } else {
          const newEvent: CalendarEvent = {
              id: Date.now(),
              title: titleToSave,
              start,
              end,
              categoryId: formCategory,
              isAllDay: formIsAllDay,
              description: formNote,
              location: formLocation
          };
          eventService.addEvent(newEvent);
      }
      setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
      if (selectedEvent) {
          eventService.deleteEvent(selectedEvent.id);
          setIsModalOpen(false);
      }
  };

  // --- Components ---

  const MiniCalendar = () => {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const startingDayOfWeek = firstDayOfMonth.getDay(); 
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(i);

      return (
          <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900 text-lg">{currentMonth + 1}月 {currentYear}</span>
                  <div className="flex gap-1">
                       <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={16} /></button>
                       <button onClick={() => navigateDate('next')} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={16} /></button>
                  </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {weekDays.map(d => <span key={d} className="text-xs text-gray-400">{d.replace('周','')}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                  {days.map((d, i) => {
                      if (!d) return <div key={i}></div>;
                      
                      const dateObj = new Date(currentYear, currentMonth, d);
                      const holiday = getHolidayInfo(dateObj);
                      const lunar = getLunarDate(dateObj);
                      const isToday = d === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
                      const isSelected = d === currentDay;

                      return (
                        <div 
                            key={i} 
                            onClick={() => {
                                const newDate = new Date(currentYear, currentMonth, d);
                                setCurrentDate(newDate);
                            }}
                            className={`flex flex-col items-center justify-center cursor-pointer group h-10`}
                        >
                            <div className={`
                                w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors mb-0.5
                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-900 group-hover:bg-gray-100'}
                                ${isToday && !isSelected ? 'text-blue-600 font-bold bg-blue-50' : ''}
                            `}>
                                {d}
                            </div>
                            <span className={`text-[10px] leading-none ${holiday?.isHoliday ? 'text-red-500' : isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
                                {holiday ? holiday.name : lunar}
                            </span>
                        </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const getGridHours = () => Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 to 23:00 roughly

  const TimeGrid = () => {
      const hours = getGridHours();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const showRedLine = now.getDate() === currentDay && now.getMonth() === currentMonth;
      const topOffset = (currentHour - 6) * 60 + currentMin;

      const ghostEvent: CalendarEvent | null = isModalOpen ? {
        id: -1,
        title: formTitle || '新的日程',
        start: parseDateTime(formDate, formStartTime),
        end: parseDateTime(formDate, formEndTime),
        categoryId: formCategory,
        isAllDay: formIsAllDay,
        description: formNote,
        location: formLocation
      } : null;
    
      const displayEvents = ghostEvent && ghostEvent.start.getDate() === currentDay && ghostEvent.start.getMonth() === currentMonth
        ? [...dayEvents.filter(e => e.id !== selectedEvent?.id), ghostEvent] 
        : dayEvents;

      return (
          <div className="flex-1 overflow-y-auto relative scrollbar-hide bg-white">
             <div className="border-b border-gray-100 flex min-h-[50px]">
                 <div className="w-16 border-r border-gray-100 flex items-center justify-center text-xs text-gray-400 bg-gray-50/30">
                     全天
                 </div>
                 <div className="flex-1 p-1 space-y-1">
                     {displayEvents.filter(e => e.isAllDay).map(e => {
                         const style = getCategoryStyle(e.categoryId);
                         const isGhost = e.id === -1;
                         return (
                             <div 
                                key={e.id}
                                onClick={() => !isGhost && handleEditEvent(e)}
                                className={`text-xs px-2 py-1 rounded border-l-4 ${style.bgColor} ${style.borderColor} ${style.textColor} ${style.color.replace('bg-', 'border-l-')} ${isGhost ? 'opacity-70 ring-2 ring-blue-300 ring-offset-1' : 'cursor-pointer hover:opacity-90'} transition-all`}
                             >
                                 {e.title}
                             </div>
                         );
                     })}
                 </div>
             </div>

             <div className="relative" style={{ height: hours.length * 60 }}>
                 {showRedLine && currentHour >= 6 && (
                     <div 
                        className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" 
                        style={{ top: topOffset }}
                     >
                         <div className="w-16 flex justify-end pr-2">
                             <div className="w-2 h-2 rounded-full bg-red-500"></div>
                         </div>
                         <div className="flex-1 h-px bg-red-500"></div>
                     </div>
                 )}

                 {hours.map((h) => (
                     <div key={h} className="flex h-[60px] border-b border-gray-50 last:border-0 relative group">
                         <div className="w-16 border-r border-gray-100 flex justify-center pt-2 text-xs text-gray-400 font-medium select-none bg-white">
                             {h > 12 ? `下午${h - 12}时` : h === 12 ? '中午12时' : `上午${h}时`}
                         </div>
                         <div 
                            className="flex-1 relative hover:bg-gray-50 transition-colors cursor-default"
                            onClick={() => handleCreateEvent(undefined, h)}
                         ></div>
                     </div>
                 ))}

                 {displayEvents.filter(e => !e.isAllDay).map(e => {
                     const startHour = e.start.getHours();
                     const startMin = e.start.getMinutes();
                     const endHour = e.end.getHours();
                     const endMin = e.end.getMinutes();
                     const isGhost = e.id === -1;
                     
                     if (startHour < 6 && endHour < 6) return null;

                     const top = Math.max(0, (startHour - 6) * 60 + startMin);
                     const height = Math.max(30, ((endHour - 6) * 60 + endMin) - top); 
                     const style = getCategoryStyle(e.categoryId);

                     return (
                         <div 
                            key={e.id}
                            onClick={(ev) => {
                                ev.stopPropagation();
                                if(!isGhost) handleEditEvent(e);
                            }}
                            className={`absolute left-16 right-2 rounded border-l-4 p-2 text-xs shadow-sm z-10 overflow-hidden ${style.bgColor} ${style.borderColor} ${style.textColor} ${style.color.replace('bg-', 'border-l-')} ${isGhost ? 'opacity-80 ring-2 ring-blue-400 ring-offset-1 pointer-events-none' : 'cursor-pointer hover:shadow-md'} transition-all`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                         >
                             <div className="font-bold flex justify-between">
                                 <span>{e.title}</span>
                                 {isGhost && <span className="text-[10px] opacity-70">创建中...</span>}
                             </div>
                             {e.location && <div className="opacity-80">{e.location}</div>}
                             <div className="opacity-70 mt-1">
                                {String(startHour).padStart(2,'0')}:{String(startMin).padStart(2,'0')} - {String(endHour).padStart(2,'0')}:{String(endMin).padStart(2,'0')}
                             </div>
                         </div>
                     );
                 })}
             </div>
          </div>
      );
  };

  const WeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDates.push(d);
    }

    const hours = getGridHours();

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex border-b border-gray-100 pl-16 scrollbar-hide">
                {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const lunar = getLunarDate(date);
                    const holiday = getHolidayInfo(date);
                    
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-center py-3 border-l border-gray-100 bg-white">
                             <div className={`text-xs mb-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{weekDays[i].replace('周','')}</div>
                             <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-900'}`}>
                                 {date.getDate()}
                             </div>
                             <div className={`text-[10px] mt-1 ${holiday?.isHoliday ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                 {holiday ? holiday.name : lunar}
                             </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto relative scrollbar-hide">
                 <div className="flex min-w-full">
                     <div className="w-16 flex-none flex flex-col text-xs text-gray-400 font-medium bg-white z-20 sticky left-0">
                         <div className="h-[50px] border-b border-gray-100 flex items-center justify-center bg-gray-50/30">全天</div>
                         {hours.map(h => (
                             <div key={h} className="h-[60px] flex justify-center pt-2 relative border-b border-transparent bg-white">
                                 {h > 12 ? `下午${h - 12}时` : h === 12 ? '中午12时' : `上午${h}时`}
                             </div>
                         ))}
                     </div>

                     <div className="flex-1 flex">
                        {weekDates.map((date, dayIdx) => {
                             const isToday = date.toDateString() === new Date().toDateString();
                             const dateEvents = visibleEvents.filter(e => 
                                 e.start.getDate() === date.getDate() && 
                                 e.start.getMonth() === date.getMonth() &&
                                 e.start.getFullYear() === date.getFullYear()
                             );
                             
                             const ghostEvent: CalendarEvent | null = isModalOpen ? {
                                id: -1,
                                title: formTitle || '新的日程',
                                start: parseDateTime(formDate, formStartTime),
                                end: parseDateTime(formDate, formEndTime),
                                categoryId: formCategory,
                                isAllDay: formIsAllDay,
                                description: formNote,
                                location: formLocation
                             } : null;
                             
                             const showGhost = ghostEvent && 
                                               ghostEvent.start.getDate() === date.getDate() &&
                                               ghostEvent.start.getMonth() === date.getMonth() &&
                                               ghostEvent.start.getFullYear() === date.getFullYear();
                            
                             const displayEvents = showGhost ? [...dateEvents, ghostEvent] : dateEvents;

                             return (
                                 <div key={dayIdx} className="flex-1 border-l border-gray-100 flex flex-col relative min-w-[100px]">
                                     <div className="h-[50px] border-b border-gray-100 p-1 space-y-1 overflow-y-auto scrollbar-hide bg-gray-50/10">
                                         {displayEvents.filter(e => e.isAllDay).map(e => {
                                             const style = getCategoryStyle(e.categoryId);
                                             const isGhost = e.id === -1;
                                             return (
                                                 <div 
                                                    key={e.id}
                                                    onClick={() => !isGhost && handleEditEvent(e)}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate ${style.bgColor} ${style.borderColor} ${style.textColor} ${style.color.replace('bg-', 'border-l-')} cursor-pointer ${isGhost ? 'opacity-70 ring-2 ring-blue-300 ring-offset-1' : 'hover:opacity-90'}`}
                                                 >
                                                     {e.title}
                                                 </div>
                                             );
                                         })}
                                     </div>

                                     <div className="relative" style={{ height: hours.length * 60 }}>
                                         {hours.map(h => (
                                             <div key={h} className="absolute w-full border-b border-gray-50 h-[60px]" style={{ top: (h-6)*60 }} 
                                                  onClick={() => handleCreateEvent(date, h)}
                                             />
                                         ))}

                                         {isToday && (() => {
                                             const now = new Date();
                                             const curH = now.getHours();
                                             if (curH >= 6) {
                                                const top = (curH - 6) * 60 + now.getMinutes();
                                                return (
                                                    <div className="absolute left-0 right-0 h-px bg-red-500 z-20 pointer-events-none" style={{ top }}>
                                                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
                                                    </div>
                                                )
                                             }
                                             return null;
                                         })()}

                                         {displayEvents.filter(e => !e.isAllDay).map(e => {
                                             const startHour = e.start.getHours();
                                             const startMin = e.start.getMinutes();
                                             const endHour = e.end.getHours();
                                             const endMin = e.end.getMinutes();
                                             
                                             if (startHour < 6 && endHour < 6) return null;

                                             const top = Math.max(0, (startHour - 6) * 60 + startMin);
                                             const height = Math.max(30, ((endHour - 6) * 60 + endMin) - top); 
                                             const style = getCategoryStyle(e.categoryId);
                                             const isGhost = e.id === -1;

                                             return (
                                                 <div 
                                                    key={e.id}
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        if(!isGhost) handleEditEvent(e);
                                                    }}
                                                    className={`absolute left-1 right-1 rounded border-l-4 p-1.5 text-xs shadow-sm z-10 overflow-hidden ${style.bgColor} ${style.borderColor} ${style.textColor} ${style.color.replace('bg-', 'border-l-')} ${isGhost ? 'opacity-70 pointer-events-none' : 'hover:shadow-md cursor-pointer'}`}
                                                    style={{ top: `${top}px`, height: `${height}px` }}
                                                 >
                                                     <div className="font-bold truncate">{e.title}</div>
                                                     <div className="opacity-80 truncate">{e.start.getHours()}:{String(e.start.getMinutes()).padStart(2,'0')} - {e.end.getHours()}:{String(e.end.getMinutes()).padStart(2,'0')}</div>
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 </div>
                             );
                        })}
                     </div>
                 </div>
            </div>
        </div>
    );
  };

  const YearGrid = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="flex-1 overflow-y-auto bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {months.map(m => {
                    const firstDay = new Date(currentYear, m, 1);
                    const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
                    const startDay = firstDay.getDay();
                    const days = [];
                    for(let k=0; k<startDay; k++) days.push(null);
                    for(let k=1; k<=daysInMonth; k++) days.push(k);

                    return (
                        <div key={m} className="flex flex-col">
                            <div className="text-lg font-bold text-gray-900 mb-4 pl-2">{m + 1}月</div>
                            <div className="grid grid-cols-7 gap-y-2 text-center">
                                {weekDays.map(d => <span key={d} className="text-xs text-gray-400 font-normal">{d.replace('周','')}</span>)}
                                {days.map((d, idx) => {
                                    if(!d) return <div key={idx}></div>;
                                    const dateObj = new Date(currentYear, m, d);
                                    const isToday = dateObj.toDateString() === new Date().toDateString();
                                    const holiday = getHolidayInfo(dateObj);
                                    
                                    return (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setCurrentDate(dateObj);
                                                setViewType('day');
                                            }}
                                            className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded aspect-square relative"
                                        >
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-blue-600 text-white font-bold' : holiday?.isHoliday ? 'text-red-500 font-medium' : 'text-gray-700'}`}>
                                                {d}
                                            </div>
                                             {holiday?.status === 'rest' && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                                             {holiday?.status === 'work' && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const MonthGrid = () => {
       const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
       const startingDay = firstDayOfMonth.getDay();
       
       const totalSlots = Math.ceil((daysInMonth + startingDay) / 7) * 7;
       const days = [];
       for (let i = 0; i < totalSlots; i++) {
           if (i < startingDay || i >= startingDay + daysInMonth) {
               days.push(null);
           } else {
               days.push(i - startingDay + 1);
           }
       }

       return (
           <div className="flex-1 flex flex-col overflow-hidden bg-white">
               <div className="grid grid-cols-7 border-b border-gray-100">
                   {weekDays.map(d => (
                       <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                           {d}
                       </div>
                   ))}
               </div>
               <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                   {days.map((d, i) => {
                       const currentDateObj = d ? new Date(currentYear, currentMonth, d) : null;
                       const isToday = d === new Date().getDate() && currentMonth === new Date().getMonth();
                       const lunar = currentDateObj ? getLunarDate(currentDateObj) : '';
                       const holiday = currentDateObj ? getHolidayInfo(currentDateObj) : null;
                       
                       const dayEvts = currentDateObj ? visibleEvents.filter(e => 
                           e.start.getDate() === d && e.start.getMonth() === currentMonth
                       ) : [];

                       return (
                           <div 
                                key={i} 
                                className={`border-b border-r border-gray-100 relative transition-colors flex flex-col min-h-[100px] ${d ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50/30'}`}
                                onClick={() => {
                                    if(d) {
                                        const newDate = new Date(currentYear, currentMonth, d);
                                        setCurrentDate(newDate);
                                        handleCreateEvent(newDate);
                                    }
                                }}
                           >
                               {d && (
                                   <>
                                        {/* Day Cell Header: Gregorian Left, Lunar/Holiday Right */}
                                        <div className="flex justify-between items-baseline px-2 pt-1.5 mb-1 relative">
                                            {/* Badge for Work/Rest */}
                                            {holiday?.status && (
                                                <div className={`absolute top-0 left-0 text-[9px] px-1 rounded-br-md leading-none py-0.5 ${holiday.status === 'rest' ? 'bg-red-50 text-red-500' : 'bg-gray-200 text-gray-500'}`}>
                                                    {holiday.status === 'rest' ? '休' : '班'}
                                                </div>
                                            )}
                                            
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-blue-600 text-white' : 'text-gray-900'} ${holiday?.status ? 'ml-3' : ''}`}>
                                                {d}
                                            </span>
                                            
                                            <span className={`text-[11px] ${holiday?.isHoliday ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                                {holiday ? holiday.name : lunar}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-1 overflow-hidden px-1">
                                            {dayEvts.slice(0, 4).map(e => {
                                                const style = getCategoryStyle(e.categoryId);
                                                return (
                                                    <div 
                                                        key={e.id} 
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            handleEditEvent(e);
                                                        }}
                                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${style.bgColor} ${style.textColor} border-l-2 ${style.color.replace('bg-', 'border-l-')}`}
                                                    >
                                                        {e.title}
                                                    </div>
                                                );
                                            })}
                                            {dayEvts.length > 4 && (
                                                <div className="text-[10px] text-gray-400 pl-1">
                                                    还有 {dayEvts.length - 4} 项...
                                                </div>
                                            )}
                                        </div>
                                   </>
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>
       );
  };

  const currentCategory = categories.find(c => c.id === formCategory) || categories[0] || { id: 'default', label: '日历', color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200', isChecked: true, type: 'calendar' };

  return (
    <div className="flex h-full bg-white relative font-sans">
      <div className="flex-1 flex flex-col relative z-0 min-w-0">
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-baseline gap-2">
                    {getHeaderTitle()}
                    {viewType === 'day' && <span className="text-lg text-gray-600">{currentDay}日</span>}
                    <span className="text-sm font-normal text-gray-400 ml-2">{lunarStr}</span>
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigateDate('prev')} className="p-1.5 hover:bg-gray-100 rounded border border-gray-200 text-gray-500"><ChevronLeft size={14} /></button>
                    <button onClick={() => navigateDate('today')} className="px-3 py-1 hover:bg-gray-100 rounded border border-gray-200 text-xs font-medium text-gray-600">今天</button>
                    <button onClick={() => navigateDate('next')} className="p-1.5 hover:bg-gray-100 rounded border border-gray-200 text-gray-500"><ChevronRight size={14} /></button>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="flex bg-gray-100 p-0.5 rounded-lg">
                    {['日', '周', '月', '年'].map((t, i) => {
                        const typeCode = i === 0 ? 'day' : i === 1 ? 'week' : i === 2 ? 'month' : 'year';
                        return (
                            <button
                                key={t}
                                onClick={() => setViewType(typeCode as ViewType)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewType === typeCode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {t}
                            </button>
                        );
                    })}
                 </div>
                 
                 <div className="h-5 w-px bg-gray-200 mx-1"></div>

                 <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="搜索日程" className="pl-8 pr-3 py-1.5 bg-gray-50 border border-transparent rounded-lg text-xs focus:bg-white focus:border-blue-200 focus:ring-0 outline-none w-32 transition-all" />
                 </div>
                 
                 <div className="relative">
                     <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`p-1.5 rounded text-gray-500 transition-colors ${showFilterMenu ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100'}`}><Filter size={16} /></button>
                     {showFilterMenu && (
                         <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                             <div className="px-2 py-1.5 text-xs font-bold text-gray-400">微秘日历</div>
                             {categories.filter(c => c.type === 'calendar').map(cat => (
                                 <div key={cat.id} onClick={() => toggleCategory(cat.id)} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                     <div className="flex items-center gap-2">
                                         <div className={`w-3 h-3 rounded ${cat.color}`}></div>
                                         <span className="text-sm text-gray-700">{cat.label}</span>
                                     </div>
                                     {cat.isChecked && <Check size={14} className="text-gray-600" />}
                                 </div>
                             ))}
                             <div className="h-px bg-gray-100 my-2"></div>
                             {categories.filter(c => c.type === 'other').map(cat => (
                                 <div key={cat.id} onClick={() => toggleCategory(cat.id)} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                      <div className="flex items-center gap-2">
                                         {cat.label.includes('订阅') ? <CalendarIcon size={14} className="text-gray-400" /> : cat.label.includes('待办') ? <CheckSquare size={14} className="text-gray-400" /> : <Clock size={14} className="text-gray-400" />}
                                         <span className="text-sm text-gray-700">{cat.label}</span>
                                     </div>
                                     {cat.isChecked && <Check size={14} className="text-gray-600" />}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            {viewType === 'day' && <TimeGrid />}
            {viewType === 'week' && <WeekGrid />}
            {viewType === 'month' && <MonthGrid />}
            {viewType === 'year' && <YearGrid />}
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-100 flex flex-col shrink-0">
        <MiniCalendar />
        <div className="px-6 pb-2 mt-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">日历列表</span>
            <div className="flex gap-2">
                 <button className="text-gray-400 hover:text-gray-600"><ChevronLeft size={14} /></button>
                 <button className="text-gray-400 hover:text-gray-600"><ChevronRight size={14} /></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
             {categories.map(cat => (
                 <div key={cat.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg -mx-2 transition-colors" onClick={() => toggleCategory(cat.id)}>
                     <div className="flex items-center gap-3">
                         <div className={`w-4 h-4 rounded flex items-center justify-center ${cat.color} text-white shadow-sm border border-black/5`}>{cat.isChecked && <Check size={10} strokeWidth={4} />}</div>
                         <span className="text-sm text-gray-700">{cat.label}</span>
                     </div>
                 </div>
             ))}
        </div>
        <button onClick={() => handleCreateEvent()} className="m-6 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium shadow-sm transition-all">
            <Plus size={18} /> 新建日程
        </button>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <div className="absolute inset-0" onClick={() => handleSaveEvent()}></div>
               <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 relative z-10 flex flex-col">
                  {/* Header & Title */}
                  <div className="p-4 border-b border-gray-50">
                      <div className="flex justify-between items-start gap-3">
                           {/* Color Marker */}
                           <div className={`w-1.5 h-6 rounded-full shrink-0 mt-1 ${currentCategory.color}`}></div>
                           
                           <input 
                              value={formTitle} 
                              onChange={e => setFormTitle(e.target.value)} 
                              placeholder="日程标题" 
                              autoFocus 
                              className="flex-1 text-lg font-semibold text-gray-900 placeholder:text-gray-400 border-none focus:ring-0 p-0 leading-tight bg-transparent" 
                           />
                           <button onClick={handleSaveEvent} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1 rounded-md transition-colors">
                               <X size={18} />
                           </button>
                      </div>
                  </div>

                  <div className="p-4 space-y-4">
                      {/* Date & Time Row */}
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                              <Clock size={18} />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                   <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer" />
                                   {/* All Day Toggle */}
                                   <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                                      <span className="text-xs text-gray-500 select-none">全天</span>
                                      <div 
                                          onClick={() => setFormIsAllDay(!formIsAllDay)}
                                          className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${formIsAllDay ? 'bg-blue-500' : 'bg-gray-200'}`}
                                      >
                                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${formIsAllDay ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                      </div>
                                   </label>
                               </div>
                               {!formIsAllDay && (
                                   <div className="flex items-center gap-1 text-sm text-gray-600">
                                       <input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="bg-gray-50 rounded px-1 py-0.5 border-none focus:ring-0 w-[70px] text-center" />
                                       <span className="text-gray-400">-</span>
                                       <input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="bg-gray-50 rounded px-1 py-0.5 border-none focus:ring-0 w-[70px] text-center" />
                                   </div>
                               )}
                          </div>
                      </div>

                      {/* Category & Location Row */}
                      <div className="flex items-center gap-3">
                           <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                              <MapPin size={18} />
                           </div>
                           <div className="flex-1 flex gap-2">
                               {/* Category Dropdown Trigger */}
                               <div className="relative">
                                   <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                       <div className={`w-2 h-2 rounded-full ${currentCategory.color}`}></div>
                                       {currentCategory.label}
                                   </button>
                                   {showCategoryDropdown && (
                                       <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-20 w-32 grid gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                                           {categories.map(c => (
                                               <button key={c.id} onClick={() => { setFormCategory(c.id); setShowCategoryDropdown(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-left text-gray-700">
                                                   <div className={`w-2 h-2 rounded-full ${c.color}`}></div>
                                                   {c.label}
                                               </button>
                                           ))}
                                       </div>
                                   )}
                               </div>
                               
                               {/* Location Input */}
                               <input 
                                  value={formLocation}
                                  onChange={e => setFormLocation(e.target.value)}
                                  placeholder="添加地点" 
                                  className="flex-1 bg-transparent border-none text-xs p-0 focus:ring-0 placeholder:text-gray-400"
                               />
                           </div>
                      </div>

                      {/* Notes Row */}
                      <div className="flex gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-500 h-fit">
                              <AlignLeft size={18} />
                          </div>
                          <textarea 
                              value={formNote}
                              onChange={e => setFormNote(e.target.value)}
                              placeholder="添加备注..." 
                              className="flex-1 bg-gray-50/50 hover:bg-gray-50 rounded-lg border-none text-sm p-3 focus:ring-0 resize-none h-20 transition-colors placeholder:text-gray-400 scrollbar-hide"
                          />
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                      {selectedEvent ? (
                          <button onClick={handleDeleteEvent} className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={18} />
                          </button>
                      ) : <div></div>}
                      
                      <button onClick={handleSaveEvent} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-gray-200 transition-all transform active:scale-95">
                          保存
                      </button>
                  </div>
               </div>
          </div>
      )}
    </div>
  );
};