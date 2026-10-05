import { useEffect, useState } from 'react';

export interface ClassStudent {
  id: string;
  sl: number;
  rollNo: number;
  name: string;
  admissionNo: string;
}

export interface ClassSubject { name: string; teacher: string; periodsPerWeek: number }
export interface ClassExam { name: string; subject: string; date: string; marks: number }
export interface ClassHomework { title: string; subject: string; dueDate: string }
export interface FeeDue { student: string; amount: number; dueDate: string }

export interface ClassSection {
  id: string;
  name: string;
  classTeacher: string;
  capacity: number;
  students: ClassStudent[];
  attendance: { present: number; absent: number; late: number };
  fee: { collected: number; pending: number; dues: FeeDue[] };
}

export interface ClassDetail {
  id: string;
  name: string;
  sections: ClassSection[];
  subjects: ClassSubject[];
  exams: ClassExam[];
  homework: ClassHomework[];
}

const CLASS_NAMES: Record<string, string> = {
  '1': 'Nursery', '2': 'LKG', '3': 'UKG', '4': 'Class 1', '5': 'Class 2', '6': 'Class 3',
};

type RawStudent = [name: string, roll: number, adm: string];

const SEC_A_RAW: RawStudent[] = [
  ['Anika Nair', 7, '0007'], ['Avni Mehta', 5, '0005'], ['Dev Singh', 2, '0002'], ['Dev Verma', 6, '0006'],
  ['Kabir Reddy', 9, '0009'], ['Laksh Gupta', 3, '0003'], ['Laksh Reddy', 8, '0008'], ['Reyansh Singh', 4, '0004'],
  ['Riya Gupta', 1, '0001'], ['Zara Verma', 10, '0010'],
];
const SEC_B_RAW: RawStudent[] = [
  ['Aarav Sharma', 1, '0011'], ['Diya Patel', 2, '0012'], ['Ishaan Kapoor', 3, '0013'],
  ['Myra Joshi', 4, '0014'], ['Vihaan Rao', 5, '0015'], ['Saanvi Iyer', 6, '0016'],
];

function toStudents(raw: RawStudent[]): ClassStudent[] {
  return raw.map(([name, rollNo, adm], i) => ({
    id: `stu-${adm}`,
    sl: i + 1,
    rollNo,
    name,
    admissionNo: `ADM-2026-${adm}`,
  }));
}

function build(id: string): ClassDetail {
  const name = CLASS_NAMES[id] ?? 'Nursery';
  const a = toStudents(SEC_A_RAW);
  const b = toStudents(SEC_B_RAW);
  return {
    id,
    name,
    sections: [
      {
        id: 'A', name: 'Section A', classTeacher: 'Meera Kulkarni', capacity: 30, students: a,
        attendance: { present: 8, absent: 1, late: 1 },
        fee: {
          collected: 184000, pending: 46000,
          dues: [
            { student: 'Dev Singh', amount: 12000, dueDate: '15/10/2026' },
            { student: 'Laksh Reddy', amount: 18000, dueDate: '15/10/2026' },
            { student: 'Zara Verma', amount: 16000, dueDate: '30/10/2026' },
          ],
        },
      },
      {
        id: 'B', name: 'Section B', classTeacher: 'Rohan Desai', capacity: 25, students: b,
        attendance: { present: 5, absent: 1, late: 0 },
        fee: {
          collected: 96000, pending: 24000,
          dues: [
            { student: 'Diya Patel', amount: 14000, dueDate: '15/10/2026' },
            { student: 'Vihaan Rao', amount: 10000, dueDate: '30/10/2026' },
          ],
        },
      },
    ],
    subjects: [
      { name: 'English', teacher: 'Meera Kulkarni', periodsPerWeek: 6 },
      { name: 'Mathematics', teacher: 'Sandeep Joshi', periodsPerWeek: 6 },
      { name: 'Environmental Science', teacher: 'Anita Rao', periodsPerWeek: 4 },
      { name: 'Hindi', teacher: 'Pooja Verma', periodsPerWeek: 4 },
      { name: 'Art & Craft', teacher: 'Neha Kapoor', periodsPerWeek: 2 },
    ],
    exams: [
      { name: 'Unit Test 2', subject: 'English', date: '12/10/2026', marks: 25 },
      { name: 'Unit Test 2', subject: 'Mathematics', date: '14/10/2026', marks: 25 },
      { name: 'Half Yearly', subject: 'Environmental Science', date: '02/11/2026', marks: 50 },
      { name: 'Half Yearly', subject: 'Hindi', date: '04/11/2026', marks: 50 },
    ],
    homework: [
      { title: 'Trace letters A to E', subject: 'English', dueDate: '05/10/2026' },
      { title: 'Count and write 1 to 50', subject: 'Mathematics', dueDate: '06/10/2026' },
      { title: 'Draw your favourite animal', subject: 'Art & Craft', dueDate: '08/10/2026' },
      { title: 'Learn the rhyme "Machli Jal Ki Rani"', subject: 'Hindi', dueDate: '09/10/2026' },
    ],
  };
}

export function useClassDetail(id: string | undefined): { data: ClassDetail | undefined; isLoading: boolean; error: Error | undefined } {
  const [data, setData] = useState<ClassDetail | undefined>(undefined);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    const t = setTimeout(() => {
      if (!id) {
        setData(undefined);
        setError(new Error('Class not found'));
      } else {
        setData(build(id));
      }
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [id]);

  return { data, isLoading, error };
}
