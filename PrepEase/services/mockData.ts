import { Course, Flashcard, Assignment, User, StudentMetric, ResourceItem } from '../types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Wasiq',
  role: 'student',
  studentId: 'CS-2024-001'
};

export const COURSES: Course[] = [
  { id: 'c1', code: 'CS-311', title: 'Web Engineering', progress: 75, nextDeadline: 'Quiz 1 - Tomorrow' },
  { id: 'c2', code: 'CS-202', title: 'Data Structures', progress: 45, nextDeadline: 'Lab Report - 2 Days' },
  { id: 'c3', code: 'CS-401', title: 'Artificial Intelligence', progress: 20 }
];

export const FLASHCARDS: Record<string, Flashcard[]> = {
  'c1': [ // Web Eng
    { id: 'f1', courseId: 'c1', question: 'What is the Virtual DOM?', answer: 'A lightweight copy of the actual DOM in memory used by React to optimize rendering.' },
    { id: 'f2', courseId: 'c1', question: 'Explain "Prop Drilling".', answer: 'The process of passing data from a parent component down to deep children through intermediate components.' }
  ],
  'c2': [ // Data Structures
    { id: 'f3', courseId: 'c2', question: 'Time complexity of Binary Search?', answer: 'O(log n)' },
    { id: 'f4', courseId: 'c2', question: 'What is a Linked List?', answer: 'A linear data structure where elements are not stored at contiguous memory locations.' }
  ],
  'c3': [ // AI
    { id: 'f5', courseId: 'c3', question: 'Define Polymorphism.', answer: 'The ability of an object to take on many forms.' }, // Kept from prompt despite being OOP usually, assuming context overlap
    { id: 'f6', courseId: 'c3', question: 'What is a Heuristic?', answer: 'A technique designed for solving a problem more quickly when classic methods are too slow.' }
  ]
};

export const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', courseId: 'c1', title: 'Quiz 1: React Basics', status: 'Pending', dueDate: '2023-11-15' },
  { id: 'a2', courseId: 'c2', title: 'Assignment 2: OOP Implementation', status: 'Submitted', dueDate: '2023-11-10', grade: 'A' },
  { id: 'a3', courseId: 'c3', title: 'Midterm Project Proposal', status: 'Pending', dueDate: '2023-11-20' }
];

export const CLASS_METRICS: StudentMetric[] = [
  { id: 's1', name: 'Wasiq', attendance: 92, avgGrade: 88, riskStatus: 'Low' },
  { id: 's2', name: 'Dawood', attendance: 75, avgGrade: 72, riskStatus: 'Medium' },
  { id: 's3', name: 'Ali', attendance: 60, avgGrade: 55, riskStatus: 'High' },
  { id: 's4', name: 'Sarah', attendance: 98, avgGrade: 95, riskStatus: 'Low' },
];

export const RECOMMENDED_RESOURCES: ResourceItem[] = [
  { id: 'r1', title: 'Understanding Recursion visually', type: 'video', reason: 'Based on your Quiz 1 Weakness' },
  { id: 'r2', title: 'State Management Patterns', type: 'article', reason: 'Recommended for Web Engineering' },
  { id: 'r3', title: 'Graph Traversal Algorithms', type: 'video', reason: 'Essential for upcoming exam' }
];

export const MOCK_CHAT_RESPONSES = (input: string, suggestVideo: boolean): string => {
  const lowerInput = input.toLowerCase();
  let response = "I'm not sure about that, but I can help you find resources in the library.";

  if (lowerInput.includes('react') || lowerInput.includes('props') || lowerInput.includes('state')) {
    response = "React Hooks allow function components to have state and other React features. Props are read-only components. State is mutable.";
  } else if (lowerInput.includes('complexity') || lowerInput.includes('big o')) {
    response = "Time complexity quantifies the amount of time taken by an algorithm to run as a function of the length of the string representing the input.";
  } else if (lowerInput.includes('polymorphism')) {
    response = "Polymorphism allows objects of different classes to be treated as objects of a common superclass.";
  }

  if (suggestVideo) {
    response += "\n\nI also found this helpful video: youtube.com/watch?v=mock-tutorial-id";
  }
  
  return response;
};

export const COURSE_SUMMARIES: Record<string, string> = {
  'c1': 'Introduction to React Components: Components are the building blocks of any React application. This lecture covers Functional vs Class components, the lifecycle of a component, and JSX syntax.',
  'c2': 'Trees and Graphs: Understanding non-linear data structures. We explore Binary Search Trees (BST), AVL Trees, and basic Graph traversal methods like BFS and DFS.',
  'c3': 'Search Algorithms: Uninformed vs Informed search. A* Search algorithm implementation details and heuristic function selection.'
};