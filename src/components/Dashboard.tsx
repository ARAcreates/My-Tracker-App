
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Target, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { Subject, Chapter, Section, Task } from '../types';
import Modal from './Modal';

interface DashboardProps {
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  subjects, chapters, tasks, setTasks, setSubjects, setChapters 
}) => {
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [goalType, setGoalType] = useState<'CUSTOM' | 'LINKED'>('CUSTOM');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const overallMastery = useMemo(() => {
    if (subjects.length === 0) return 0;
    const totalProgress = subjects.reduce((acc, sub) => acc + sub.progress, 0);
    return Math.round(totalProgress / subjects.length);
  }, [subjects]);

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (goalType === 'CUSTOM' && !newGoalTitle.trim()) return;
    
    let title = newGoalTitle;
    if (goalType === 'LINKED') {
      const sub = subjects.find(s => s.id === selectedSubjectId);
      if (!sub) return;
      const ch = chapters.find(c => c.id === selectedChapterId);
      const sec = ch?.sections.find(s => s.id === selectedSectionId);
      title = `${sub?.title} - ${ch?.title}${sec ? ` (${sec.title})` : ''}`;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      linkedSubjectId: goalType === 'LINKED' ? selectedSubjectId : undefined,
      linkedChapterId: goalType === 'LINKED' ? selectedChapterId : undefined,
      linkedSectionId: goalType === 'LINKED' ? selectedSectionId : undefined,
      createdAt: Date.now()
    };

    setTasks([newTask, ...tasks]);
    setIsAddGoalModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewGoalTitle('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedSectionId('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  return (
    <div className="space-y-10 animate-in">
      {/* Mastery Card - Refined */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em] mb-1">Mastery Progress</h3>
            <p className="text-6xl font-black text-slate-900 dark:text-white transition-colors">{overallMastery}%</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-3xl">
            <TrendingUp className="text-indigo-600 dark:text-indigo-400 w-7 h-7" />
          </div>
        </div>
        <div className="w-full bg-slate-50 dark:bg-slate-950 h-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            style={{ width: `${overallMastery}%` }}
          />
        </div>
      </section>

      {/* Today's Goals (Inbox) - Clean Aesthetic */}
      <section>
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
               <Inbox className="text-slate-900 dark:text-slate-400 w-4 h-4" />
             </div>
             <h2 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em]">Goal Inbox</h2>
          </div>
          <button 
            onClick={() => setIsAddGoalModalOpen(true)}
            className="bg-slate-900 dark:bg-indigo-600 text-white p-2.5 rounded-2xl transition-all active:scale-90 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {tasks.length === 0 ? (
            <div className="bg-white/30 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 p-12 rounded-[2.5rem] text-center transition-colors">
              <p className="text-slate-300 dark:text-slate-700 font-bold text-sm uppercase tracking-widest">Inbox is Empty</p>
              <button onClick={() => setIsAddGoalModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase mt-3 tracking-[0.2em] hover:opacity-70">Add Your First Goal</button>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`group bg-white dark:bg-slate-900/80 p-5 rounded-[1.8rem] flex items-center justify-between transition-all border border-slate-100 dark:border-slate-800/50 ${task.completed ? 'opacity-40 grayscale-[0.5]' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button onClick={() => toggleTask(task.id)} className="transition-all active:scale-75">
                    {task.completed ? (
                      <CheckCircle2 className="text-emerald-500 w-6 h-6 fill-emerald-50 dark:fill-emerald-950/20" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-bold text-slate-800 dark:text-slate-100 text-[13px] transition-colors tracking-tight ${task.completed ? 'line-through decoration-slate-300' : ''}`}>
                      {task.title}
                    </p>
                    {task.linkedSubjectId && (
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-indigo-500 dark:text-indigo-400 mt-1.5 tracking-widest">
                        <Target className="w-2.5 h-2.5" />
                        Synced Asset
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-slate-200 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal 
        isOpen={isAddGoalModalOpen} 
        onClose={() => setIsAddGoalModalOpen(false)}
        title="Quick Goal"
      >
        <form onSubmit={addTask} className="space-y-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
            <button 
              type="button"
              onClick={() => setGoalType('CUSTOM')}
              className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${goalType === 'CUSTOM' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Manual
            </button>
            <button 
              type="button"
              onClick={() => setGoalType('LINKED')}
              className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${goalType === 'LINKED' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Linked
            </button>
          </div>

          {goalType === 'CUSTOM' ? (
            <input 
              type="text"
              placeholder="E.g. Revise Chemistry Unit 1"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-5 rounded-[1.8rem] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
              autoFocus
            />
          ) : (
            <div className="space-y-4">
              <select 
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId('');
                  setSelectedSectionId('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-5 rounded-[1.8rem] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all appearance-none outline-none"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>

              {selectedSubjectId && (
                <select 
                  value={selectedChapterId}
                  onChange={(e) => {
                    setSelectedChapterId(e.target.value);
                    setSelectedSectionId('');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none p-5 rounded-[1.8rem] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all appearance-none outline-none"
                >
                  <option value="">Select Chapter</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={goalType === 'CUSTOM' ? !newGoalTitle : !selectedSubjectId}
            className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-300 dark:disabled:text-slate-600"
          >
            Insert Goal
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
