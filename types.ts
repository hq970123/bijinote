import React from 'react';

export enum ViewType {
  DASHBOARD = 'dashboard',
  CALENDAR = 'calendar',
  TODO = 'todo',
  NOTES = 'notes',
  ASK_AI = 'ask_ai'
}

export interface NoteFolder {
  id: string;
  name: string;
  count: number;
}

export interface TodoCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  type: 'system' | 'user';
}

export interface CalendarEvent {
  day: number;
  lunar: string;
  events?: string[];
  isHoliday?: boolean;
  holidayName?: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}