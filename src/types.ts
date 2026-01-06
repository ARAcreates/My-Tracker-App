
export interface QuestionState {
  completed: boolean;
}

export interface Section {
  id: string;
  title: string;
  type: 'EXERCISE' | 'EXAMPLES' | 'PYQS' | 'LECTURE' | 'OTHER';
  totalQuestions: number;
  completedCount: number;
  questions: boolean[];
  subSections?: Section[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  sections: Section[];
  progress: number; // 0 to 100
}

export interface Subject {
  id: string;
  title: string;
  chapterIds: string[];
  unitCount: number;
  progress: number;
  iconName: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  linkedSubjectId?: string;
  linkedChapterId?: string;
  linkedSectionId?: string;
  createdAt: number;
}

export enum NavigationTab {
  DASHBOARD = 'dashboard',
  LIBRARY = 'library',
  SETTINGS = 'settings'
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}