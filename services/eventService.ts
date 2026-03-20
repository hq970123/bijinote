export interface CalendarCategory {
    id: string;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    isChecked: boolean;
    type: 'calendar' | 'other';
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    categoryId: string;
    location?: string;
    description?: string;
    isAllDay?: boolean;
}

export const CATEGORIES: CalendarCategory[] = [
    { id: 'default', label: '日历', color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200', isChecked: true, type: 'calendar' },
    { id: 'work', label: '工作', color: 'bg-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200', isChecked: true, type: 'calendar' },
    { id: 'personal', label: '个人', color: 'bg-pink-500', bgColor: 'bg-pink-100', textColor: 'text-pink-700', borderColor: 'border-pink-200', isChecked: true, type: 'calendar' },
    { id: 'family', label: '家庭', color: 'bg-purple-500', bgColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-200', isChecked: true, type: 'calendar' },
    { id: 'subscribe', label: '订阅事件', color: 'bg-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-200', isChecked: true, type: 'other' },
    { id: 'todo', label: '待办', color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200', isChecked: true, type: 'other' },
    { id: 'reminder', label: '提醒日', color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200', isChecked: true, type: 'other' },
];

const createDate = (y: number, m: number, d: number, h: number, min: number) => {
    return new Date(y, m - 1, d, h, min);
};

// Mock data for the specific demo date (Dec 2025)
const INITIAL_EVENTS_MOCK: CalendarEvent[] = [
    { 
        id: 1, 
        title: "新的日程", 
        start: createDate(2025, 12, 11, 12, 0),
        end: createDate(2025, 12, 11, 13, 0), 
        categoryId: 'work',
        location: '会议室 A'
    },
    { 
        id: 2, 
        title: "新的提醒", 
        start: createDate(2025, 12, 10, 9, 0), 
        end: createDate(2025, 12, 12, 17, 0), 
        categoryId: 'default',
        isAllDay: true
    },
    { 
        id: 3, 
        title: "平安夜晚餐", 
        start: createDate(2025, 12, 24, 18, 0), 
        end: createDate(2025, 12, 24, 21, 0), 
        categoryId: 'family',
        isAllDay: false
    },
    {
        id: 4,
        title: "圣诞节全天狂欢",
        start: createDate(2025, 12, 25, 0, 0),
        end: createDate(2025, 12, 25, 23, 59),
        categoryId: 'personal',
        isAllDay: true
    }
];

// Add some events for TODAY for the demo to work nicely
const now = new Date();
const TODAY_DEMO_EVENTS: CalendarEvent[] = [
    {
        id: 101,
        title: '团队晨会',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        categoryId: 'work',
        location: '会议室 302'
    },
    {
        id: 102,
        title: 'Project Phoenix 需求评审',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
        categoryId: 'work',
        location: 'Zoom'
    },
     {
        id: 103,
        title: '午餐',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
        categoryId: 'personal'
    },
    {
        id: 104,
        title: 'UI 验收 & 细节调整',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
        categoryId: 'work'
    }
];

class EventService {
    private events: CalendarEvent[] = [];
    private listeners: (() => void)[] = [];
    private categories: CalendarCategory[] = CATEGORIES;

    constructor() {
        this.loadEvents();
    }

    private loadEvents() {
        const stored = localStorage.getItem('edge_note_events');
        if (stored) {
            try {
                this.events = JSON.parse(stored).map((e: any) => ({
                    ...e,
                    start: new Date(e.start),
                    end: new Date(e.end)
                }));
            } catch (e) {
                console.error("Failed to parse events", e);
                this.events = [...INITIAL_EVENTS_MOCK, ...TODAY_DEMO_EVENTS];
            }
        } else {
            this.events = [...INITIAL_EVENTS_MOCK, ...TODAY_DEMO_EVENTS];
        }
    }

    private saveEvents() {
        localStorage.setItem('edge_note_events', JSON.stringify(this.events));
        this.notify();
    }

    getEvents(): CalendarEvent[] {
        return this.events;
    }

    getCategories(): CalendarCategory[] {
        return this.categories;
    }

    getCategoryById(id: string): CalendarCategory | undefined {
        return this.categories.find(c => c.id === id);
    }

    addEvent(event: CalendarEvent) {
        this.events = [...this.events, event];
        this.saveEvents();
    }

    updateEvent(updatedEvent: CalendarEvent) {
        this.events = this.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
        this.saveEvents();
    }

    deleteEvent(id: number) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveEvents();
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

export const eventService = new EventService();