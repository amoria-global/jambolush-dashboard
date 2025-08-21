// types.ts

export interface Review {
  id: number;
  clientName: string;
  clientImage: string;
  rating: number; // out of 5
  comment: string;
  date: string;
}

export interface Tour {
  id: number;
  title: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  pax: number; // number of people
  price: number;
  description: string;
}

export interface ScheduleEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  type: 'Tour' | 'Booking' | 'Reminder';
}

export interface Notification {
  id: number;
  icon: string; // Bootstrap icon class e.g., 'bi-calendar-check'
  message: string;
  timestamp: string;
  isRead: boolean;
}

export type UserRole = 'user' | 'host' | 'agent' | 'tourguide';