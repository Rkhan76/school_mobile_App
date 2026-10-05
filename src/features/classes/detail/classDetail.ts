// Mock content for detail tabs that have no backend endpoint yet (attendance, fee, exams, homework).
// TODO: replace with real APIs when they are available.

export interface ClassExam { name: string; subject: string; date: string; marks: number }
export interface ClassHomework { title: string; subject: string; dueDate: string }
export interface FeeDue { student: string; amount: number; dueDate: string }

export const MOCK_ATTENDANCE = { present: 8, absent: 1, late: 1 };

export const MOCK_FEE: { collected: number; pending: number; dues: FeeDue[] } = {
  collected: 184000,
  pending: 46000,
  dues: [
    { student: 'Dev Singh', amount: 12000, dueDate: '15/10/2026' },
    { student: 'Laksh Reddy', amount: 18000, dueDate: '15/10/2026' },
    { student: 'Zara Verma', amount: 16000, dueDate: '30/10/2026' },
  ],
};

export const MOCK_EXAMS: ClassExam[] = [
  { name: 'Unit Test 2', subject: 'English', date: '12/10/2026', marks: 25 },
  { name: 'Unit Test 2', subject: 'Mathematics', date: '14/10/2026', marks: 25 },
  { name: 'Half Yearly', subject: 'Environmental Science', date: '02/11/2026', marks: 50 },
  { name: 'Half Yearly', subject: 'Hindi', date: '04/11/2026', marks: 50 },
];

export const MOCK_HOMEWORK: ClassHomework[] = [
  { title: 'Trace letters A to E', subject: 'English', dueDate: '05/10/2026' },
  { title: 'Count and write 1 to 50', subject: 'Mathematics', dueDate: '06/10/2026' },
  { title: 'Draw your favourite animal', subject: 'Art & Craft', dueDate: '08/10/2026' },
  { title: 'Learn the rhyme "Machli Jal Ki Rani"', subject: 'Hindi', dueDate: '09/10/2026' },
];
