
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  CheckCircle,
  MoreVertical,
  BookOpen,
  LayoutGrid,
  Check,
  X,
  Calculator,
  FlaskConical,
  Globe,
  Palette,
  Atom,
  Dna,
  Cpu,
  Music,
  Sigma,
  Languages,
  History,
  Binary
} from 'lucide-react';
import { Subject, Chapter, Section } from '../types';
import Modal from './Modal';

// Icon mapping for subjects
const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen />,
  Calculator: <Calculator />,
  FlaskConical: <FlaskConical />,
  Atom: <Atom />,
  Dna: <Dna />,
  Globe: <Globe />,
  Palette: <Palette />,
  Languages: <Languages />,
  Cpu: <Cpu />,
  Music: <Music />,
  Sigma: <Sigma />,
  History: <History />,
  Binary: <Binary />
};

interface LibraryProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
}

enum LibraryLevel {
  SUBJECTS = 'subjects',
  CHAPTERS = 'chapters',
  SECTIONS = 'sections',
  QUESTIONS = 'questions'
}

const Library: React.FC<LibraryProps> = ({ subjects, setSubjects, chapters, setChapters }) => {
  const [level, setLevel] = useState<LibraryLevel>(LibraryLevel.SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedParentSectionId, setSelectedParentSectionId] = useState<string | null>(null);

  // Modal states
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddSubExOpen, setIsAddSubExOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'SUBJECT' | 'CHAPTER' | 'SECTION' | 'SUBSECTION', parentId?: string } | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('BookOpen');
  const [numQuestions, setNumQuestions] = useState(10);
  
  // Selection state for auto-generating sections in new Unit
  const [selectedInitialSections, setSelectedInitialSections] = useState<string[]>(['EXAMPLES', 'EXERCISE', 'PYQS']);

  // Recalculate progress logic
  const updateProgress = useCallback(() => {
    setSubjects(prevSubjects => {
      const updatedSubjects = prevSubjects.map(subject => {
        const subjectChapters = chapters.filter(c => c.subjectId === subject.id);
        if (subjectChapters.length === 0) return { ...subject, progress: 0 };
        const avgProgress = subjectChapters.reduce((acc, ch) => acc + ch.progress, 0) / subjectChapters.length;
        return { ...subject, progress: Math.round(avgProgress) };
      });
      return updatedSubjects;
    });
  }, [chapters, setSubjects]);

  const handleToggleQuestion = (questionIndex: number) => {
    if (!selectedSection || !selectedChapter) return;

    const newQuestions = [...selectedSection.questions];
    newQuestions[questionIndex] = !newQuestions[questionIndex];
    const completedCount = newQuestions.filter(q => q).length;

    const updatedSection: Section = {
      ...selectedSection,
      questions: newQuestions,
      completedCount
    };

    setChapters(prev => prev.map(ch => {
      if (ch.id === selectedChapter.id) {
        // Find if this is a subsection or a direct section
        const newSections = ch.sections.map(sec => {
          if (sec.id === selectedSection.id) return updatedSection;
          if (sec.subSections) {
             const newSubs = sec.subSections.map(sub => sub.id === selectedSection.id ? updatedSection : sub);
             // Re-calc parent section count
             const totalQ = newSubs.reduce((a, s) => a + s.totalQuestions, 0);
             const compQ = newSubs.reduce((a, s) => a + s.completedCount, 0);
             return { ...sec, subSections: newSubs, totalQuestions: totalQ, completedCount: compQ };
          }
          return sec;
        });

        const totalQuestions = newSections.reduce((acc, s) => acc + s.totalQuestions, 0);
        const totalCompleted = newSections.reduce((acc, s) => acc + s.completedCount, 0);
        const progress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
        
        const updatedChapter = { ...ch, sections: newSections, progress };
        setSelectedChapter(updatedChapter);
        setSelectedSection(updatedSection);
        return updatedChapter;
      }
      return ch;
    }));

    setTimeout(updateProgress, 0);
  };

  const addSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const newSub: Subject = {
      id: crypto.randomUUID(),
      title: newItemName,
      chapterIds: [],
      unitCount: 0,
      progress: 0,
      iconName: selectedIconName
    };
    setSubjects([...subjects, newSub]);
    setIsAddSubjectOpen(false);
    setNewItemName('');
    setSelectedIconName('BookOpen');
  };

  const addChapter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim() || !selectedSubject) return;
    
    const generatedSections: Section[] = selectedInitialSections.map(title => ({
      id: crypto.randomUUID(),
      title,
      type: title as any,
      totalQuestions: 0,
      completedCount: 0,
      questions: [],
      subSections: []
    }));

    const newCh: Chapter = {
      id: crypto.randomUUID(),
      subjectId: selectedSubject.id,
      title: newItemName,
      sections: generatedSections,
      progress: 0
    };

    setChapters([...chapters, newCh]);
    setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? { ...s, unitCount: s.unitCount + 1 } : s));
    setIsAddChapterOpen(false);
    setNewItemName('');
    setSelectedInitialSections(['EXAMPLES', 'EXERCISE', 'PYQS']);
  };

  const addSubSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim() || !selectedChapter || !selectedParentSectionId) return;
    const newSub: Section = {
      id: crypto.randomUUID(),
      title: newItemName,
      type: 'OTHER',
      totalQuestions: numQuestions,
      completedCount: 0,
      questions: new Array(numQuestions).fill(false)
    };

    setChapters(prev => prev.map(ch => {
      if (ch.id === selectedChapter.id) {
        const newSections = ch.sections.map(sec => {
          if (sec.id === selectedParentSectionId) {
             const subs = sec.subSections || [];
             const newSubs = [...subs, newSub];
             const totalQ = newSubs.reduce((a, s) => a + s.totalQuestions, 0);
             const compQ = newSubs.reduce((a, s) => a + s.completedCount, 0);
             return { ...sec, subSections: newSubs, totalQuestions: totalQ, completedCount: compQ };
          }
          return sec;
        });
        const totalQuestions = newSections.reduce((acc, s) => acc + s.totalQuestions, 0);
        const totalCompleted = newSections.reduce((acc, s) => acc + s.completedCount, 0);
        const progress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
        const updated = { ...ch, sections: newSections, progress };
        setSelectedChapter(updated);
        return updated;
      }
      return ch;
    }));
    setIsAddSubExOpen(false);
    setNewItemName('');
    setSelectedParentSectionId(null);
  };

  const addSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim() || !selectedChapter) return;
    const newSec: Section = {
      id: crypto.randomUUID(),
      title: newItemName,
      type: 'OTHER',
      totalQuestions: 0,
      completedCount: 0,
      questions: [],
      subSections: []
    };

    setChapters(prev => prev.map(ch => {
      if (ch.id === selectedChapter.id) {
        const newSections = [...ch.sections, newSec];
        const updated = { ...ch, sections: newSections };
        setSelectedChapter(updated);
        return updated;
      }
      return ch;
    }));
    setIsAddSectionOpen(false);
    setNewItemName('');
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'SUBJECT') {
      setSubjects(prev => prev.filter(s => s.id !== itemToDelete.id));
      setChapters(prev => prev.filter(c => c.subjectId !== itemToDelete.id));
      setLevel(LibraryLevel.SUBJECTS);
    } else if (itemToDelete.type === 'CHAPTER') {
      setChapters(prev => prev.filter(c => c.id !== itemToDelete.id));
      setSubjects(prev => prev.map(s => s.id === selectedSubject?.id ? { ...s, unitCount: Math.max(0, s.unitCount - 1) } : s));
      setLevel(LibraryLevel.CHAPTERS);
    } else if (itemToDelete.type === 'SECTION') {
       setChapters(prev => prev.map(ch => {
         if (ch.id === selectedChapter?.id) {
           const newSections = ch.sections.filter(s => s.id !== itemToDelete.id);
           const totalQuestions = newSections.reduce((acc, s) => acc + s.totalQuestions, 0);
           const totalCompleted = newSections.reduce((acc, s) => acc + s.completedCount, 0);
           const progress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
           const updated = { ...ch, sections: newSections, progress };
           setSelectedChapter(updated);
           return updated;
         }
         return ch;
       }));
    } else if (itemToDelete.type === 'SUBSECTION') {
       setChapters(prev => prev.map(ch => {
         if (ch.id === selectedChapter?.id) {
           const newSections = ch.sections.map(sec => {
             if (sec.id === itemToDelete.parentId) {
                const newSubs = (sec.subSections || []).filter(s => s.id !== itemToDelete.id);
                const totalQ = newSubs.reduce((a, s) => a + s.totalQuestions, 0);
                const compQ = newSubs.reduce((a, s) => a + s.completedCount, 0);
                return { ...sec, subSections: newSubs, totalQuestions: totalQ, completedCount: compQ };
             }
             return sec;
           });
           const totalQuestions = newSections.reduce((acc, s) => acc + s.totalQuestions, 0);
           const totalCompleted = newSections.reduce((acc, s) => acc + s.completedCount, 0);
           const progress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
           const updated = { ...ch, sections: newSections, progress };
           setSelectedChapter(updated);
           return updated;
         }
         return ch;
       }));
    }
    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const toggleInitialSection = (section: string) => {
    setSelectedInitialSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubject?.id);

  const renderSubjectIcon = (iconName: string, className?: string) => {
     const icon = SUBJECT_ICONS[iconName] || <BookOpen />;
     return React.cloneElement(icon as React.ReactElement, { className: className || "w-6 h-6" });
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest px-2">
        {level !== LibraryLevel.SUBJECTS && (
          <button 
            onClick={() => {
              if (level === LibraryLevel.QUESTIONS) setLevel(LibraryLevel.SECTIONS);
              else if (level === LibraryLevel.SECTIONS) setLevel(LibraryLevel.CHAPTERS);
              else if (level === LibraryLevel.CHAPTERS) setLevel(LibraryLevel.SUBJECTS);
            }}
            className="flex items-center gap-1 text-slate-900 dark:text-slate-200 transition-all hover:-translate-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {level === LibraryLevel.QUESTIONS ? selectedChapter?.title : selectedSubject?.title}
          </button>
        )}
      </div>

      {level === LibraryLevel.SUBJECTS && (
        <div className="grid gap-4">
          <button 
            onClick={() => setIsAddSubjectOpen(true)}
            className="bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Plus className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            <span className="font-black text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600">Add New Subject</span>
          </button>
          
          {subjects.map(subject => (
            <div 
              key={subject.id}
              onClick={() => { setSelectedSubject(subject); setLevel(LibraryLevel.CHAPTERS); }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="bg-indigo-50 dark:bg-slate-800 p-4 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-indigo-600 dark:text-indigo-400 group-hover:scale-110">
                  {renderSubjectIcon(subject.iconName || 'BookOpen')}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{subject.title}</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{subject.unitCount} Units</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{subject.progress}%</p>
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all" style={{ width: `${subject.progress}%` }} />
                    </div>
                 </div>
                 <ChevronRight className="w-6 h-6 text-slate-200 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-white transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {level === LibraryLevel.CHAPTERS && selectedSubject && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  {renderSubjectIcon(selectedSubject.iconName || 'BookOpen', "w-8 h-8")}
               </div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedSubject.title}</h2>
            </div>
            <button 
              onClick={() => { setItemToDelete({ id: selectedSubject.id, type: 'SUBJECT' }); setIsDeleteConfirmOpen(true); }}
              className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsAddChapterOpen(true)}
            className="bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Plus className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            <span className="font-black text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600">Add Unit / Chapter</span>
          </button>

          {filteredChapters.map(chapter => (
            <div 
              key={chapter.id}
              onClick={() => { setSelectedChapter(chapter); setLevel(LibraryLevel.SECTIONS); }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
            >
              <div className="flex-1">
                <h3 className="font-black text-slate-900 dark:text-white text-2xl mb-4 uppercase tracking-tight">{chapter.title}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{chapter.sections.length} Category Sections</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{chapter.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all" style={{ width: `${chapter.progress}%` }} />
                </div>
              </div>
              <ChevronRight className="w-10 h-10 text-slate-100 dark:text-slate-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all ml-6" />
            </div>
          ))}
        </div>
      )}

      {level === LibraryLevel.SECTIONS && selectedChapter && (
        <div className="space-y-8 animate-in">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1">
               <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{selectedChapter.title}</h2>
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-50 dark:border-slate-800 flex items-center gap-4">
                 <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-700" style={{ width: `${selectedChapter.progress}%` }} />
                 </div>
                 <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{selectedChapter.progress}%</span>
               </div>
            </div>
            <button 
              onClick={() => { setItemToDelete({ id: selectedChapter.id, type: 'CHAPTER' }); setIsDeleteConfirmOpen(true); }}
              className="p-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-4"
            >
              <Trash2 className="w-7 h-7" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4">
             <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">Sections</h3>
             <button 
              onClick={() => setIsAddSectionOpen(true)}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          <div className="space-y-6">
            {selectedChapter.sections.map(section => (
              <div key={section.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{section.title}</h4>
                   <button 
                    onClick={() => { setSelectedParentSectionId(section.id); setIsAddSubExOpen(true); }}
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all"
                   >
                     <Plus className="w-3.5 h-3.5" />
                     Sub-Ex
                   </button>
                </div>
                
                <div className="space-y-4">
                  {(section.subSections || []).map(sub => (
                    <div 
                      key={sub.id} 
                      onClick={() => { setSelectedSection(sub); setLevel(LibraryLevel.QUESTIONS); }}
                      className="group p-5 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all cursor-pointer"
                    >
                       <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{sub.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400">{Math.round((sub.completedCount/sub.totalQuestions)*100)}%</span>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setItemToDelete({ id: sub.id, type: 'SUBSECTION', parentId: section.id }); 
                                setIsDeleteConfirmOpen(true); 
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                       </div>
                       <div className="w-full bg-white dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500" style={{ width: `${(sub.completedCount/sub.totalQuestions)*100}%` }} />
                       </div>
                    </div>
                  ))}
                  
                  {(section.subSections || []).length === 0 && (
                    <div 
                      onClick={() => { setSelectedSection(section); setLevel(LibraryLevel.QUESTIONS); }}
                      className="group p-5 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all cursor-pointer"
                    >
                       <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-slate-400 dark:text-slate-600 text-sm">Add a sub-exercise to start tracking questions</span>
                       </div>
                       <div className="w-full bg-white dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-slate-200 dark:bg-slate-800 transition-all" style={{ width: `0%` }} />
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {level === LibraryLevel.QUESTIONS && selectedSection && (
        <div className="space-y-8 animate-in">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800">
             <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {selectedParentSectionId ? `${selectedChapter?.sections.find(s => s.id === selectedParentSectionId)?.title} - ` : ''}
                    {selectedSection.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-4">
                     <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500" style={{ width: `${(selectedSection.completedCount/selectedSection.totalQuestions)*100}%` }} />
                     </div>
                     <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{Math.round((selectedSection.completedCount/selectedSection.totalQuestions)*100)}%</span>
                  </div>
                </div>
             </div>
             
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
               {selectedSection.questions.map((completed, idx) => (
                 <button 
                  key={idx}
                  onClick={() => handleToggleQuestion(idx)}
                  className={`aspect-square rounded-[1.2rem] flex items-center justify-center font-black text-lg transition-all active:scale-90 ${
                    completed 
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40' 
                    : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-50 dark:border-slate-700'
                  }`}
                 >
                   {idx + 1}
                 </button>
               ))}
               <button 
                 className="aspect-square rounded-[1.2rem] flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 text-slate-200 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900/30 transition-all"
                 onClick={() => { /* Handle clear or delete specifically if needed */ }}
               >
                 <Trash2 className="w-6 h-6" />
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} title="New Subject">
        <form onSubmit={addSubject} className="space-y-8">
          <input 
            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="E.g. Mathematics"
            className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] font-bold border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
            autoFocus
          />
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-2 mb-4 block">Select Subject Icon</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {Object.keys(SUBJECT_ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIconName(name)}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${
                    selectedIconName === name 
                    ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {renderSubjectIcon(name, "w-5 h-5")}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 active:scale-[0.98] transition-all">Create Subject</button>
        </form>
      </Modal>

      <Modal isOpen={isAddChapterOpen} onClose={() => setIsAddChapterOpen(false)} title="NEW UNIT">
        <form onSubmit={addChapter} className="space-y-6">
          <input 
            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="e.g. Differentiation"
            className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] font-bold border-2 border-indigo-100 dark:border-indigo-900/20 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
            autoFocus
          />
          <div className="space-y-3">
            {['EXAMPLES', 'EXERCISE', 'PYQS'].map(sectionTitle => (
              <button 
                key={sectionTitle}
                type="button"
                onClick={() => toggleInitialSection(sectionTitle)}
                className={`w-full p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${
                  selectedInitialSections.includes(sectionTitle)
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 hover:border-slate-100 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                     selectedInitialSections.includes(sectionTitle)
                     ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white'
                     : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600'
                   }`}>
                     {selectedInitialSections.includes(sectionTitle) && <Check className="w-4 h-4" />}
                   </div>
                   <span className={`font-black uppercase tracking-widest text-xs ${
                     selectedInitialSections.includes(sectionTitle) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                   }`}>{sectionTitle}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-4">
            <button type="button" onClick={() => setIsAddChapterOpen(false)} className="flex-1 text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800">CANCEL</button>
            <button type="submit" className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 transition-transform active:scale-95">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddSectionOpen} onClose={() => setIsAddSectionOpen(false)} title="Add Section">
        <form onSubmit={addSection} className="space-y-6">
          <input 
            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="E.g. LECTURES"
            className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] font-bold border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
            autoFocus
          />
          <button type="submit" className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40">Add Category</button>
        </form>
      </Modal>

      <Modal isOpen={isAddSubExOpen} onClose={() => { setIsAddSubExOpen(false); setSelectedParentSectionId(null); }} title="NEW SUB-EX">
        <form onSubmit={addSubSection} className="space-y-6">
          <input 
            type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
            placeholder="E.g. Exercise 1.1"
            className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] font-bold border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
            autoFocus
          />
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1 mb-2 block">Number of Questions</label>
            <input 
              type="number" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[2rem] font-bold border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40">Generate Grid</button>
        </form>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Danger Zone">
        <div className="text-center space-y-6">
          <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-rose-100 dark:shadow-rose-950/20 shadow-xl">
            <Trash2 className="text-rose-500 dark:text-rose-400 w-8 h-8" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Are you sure you want to delete this item? This action is permanent and cannot be undone.</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400">Cancel</button>
            <button type="button" onClick={confirmDelete} className="flex-1 py-4 bg-rose-500 dark:bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-100 dark:shadow-rose-950/40">Confirm Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Library;
