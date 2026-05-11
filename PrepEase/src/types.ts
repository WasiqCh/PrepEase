export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  studentId?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  progress: number;
  nextDeadline?: string;
}

export interface Flashcard {
  id: string;
  courseId: string;
  question: string;
  answer: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  dueDate: string;
  grade?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface StudentMetric {
  id: string;
  name: string;
  attendance: number;
  avgGrade: number;
  riskStatus: 'Low' | 'Medium' | 'High';
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'pdf';
  reason?: string;
}
