'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../components/ui/toast';
import { getNotes, saveNote, deleteNote } from '../../services/db';
import { Note, NoteType } from '../../types';
import {
  FileText,
  Plus,
  Trash,
  Save,
  Eye,
  Edit2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Image as ImageIcon,
  FolderOpen,
  Calendar,
} from 'lucide-react';

export default function NotesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Note Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteType>('DAILY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  
  // Active Category filter
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<NoteType>('DAILY');
  
  // Editor view tab ('write' | 'preview')
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadNotes = async () => {
    if (!user) return;
    try {
      const allNotes = await getNotes(user.id);
      // Sort by date descending
      const sorted = allNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotes(sorted);
    } catch (err) {
      showToast('Failed to load notes', 'error');
    }
  };

  useEffect(() => {
    loadNotes();
  }, [user]);

  // Sync filtered notes list
  useEffect(() => {
    setFilteredNotes(notes.filter((n) => n.type === activeCategoryFilter));
  }, [notes, activeCategoryFilter]);

  // Create new note template
  const handleCreateNewNote = () => {
    setSelectedNote(null);
    setTitle('Untitled Journal');
    setCategory(activeCategoryFilter);
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setActiveTab('write');
  };

  // Select note to edit
  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setCategory(note.type);
    setDate(note.date);
    setContent(note.content);
    setActiveTab('write');
  };

  // Save Note CRUD
  const handleSaveNote = async () => {
    if (!user) return;
    if (!title.trim()) {
      showToast('Please enter a note title', 'error');
      return;
    }

    const noteId = selectedNote?.id || crypto.randomUUID();
    const newNote: Note = {
      id: noteId,
      userId: user.id,
      title: title.trim(),
      type: category,
      content,
      date,
      createdAt: selectedNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveNote(newNote);
      showToast('Note saved successfully', 'success');
      await loadNotes();
      setSelectedNote(newNote);
    } catch (err) {
      showToast('Failed to save note', 'error');
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await deleteNote(id);
      showToast('Entry deleted', 'success');
      await loadNotes();
      
      // If deleted note was selected, clear editor
      if (selectedNote?.id === id) {
        handleCreateNewNote();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  // Formatting helpers
  const insertTextAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || '') + after;
    
    setContent(text.substring(0, start) + replacement + text.substring(end));
    
    // Reset cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Insert markdown image tag
        insertTextAtCursor(`\n![Attached Image](${reader.result})\n`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Simple Markdown to HTML parser for dynamic preview
  const parseMarkdown = (md: string) => {
    if (!md) return '<p class="text-fg-muted italic">Awaiting text entry...</p>';
    
    let html = md;
    
    // Escape HTML to prevent XSS in preview
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-md font-bold text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-primary-main mt-4 mb-2">$1</h2>');

    // Bold & Italics
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="my-4 border border-border-color rounded-xl overflow-hidden aspect-video bg-[#0d1426]"><img src="$2" alt="$1" class="w-full h-full object-cover"/></div>');

    // Tasks checklists
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded bg-bg-card-solid border-border-color"/> <span class="text-sm text-fg-muted">$1</span></div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled checked class="rounded bg-bg-card-solid border-border-color text-primary-main"/> <span class="text-sm line-through text-white">$1</span></div>');

    // Bullet Lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-sm text-fg-muted my-0.5">$1</li>');

    // Replace linebreaks with paragraph/breaks
    html = html.replace(/\n$/gim, '<br />');
    html = html.replace(/\n/gim, '<br />');

    return html;
  };

  const categoriesList: { name: string; value: NoteType }[] = [
    { name: 'Daily Journal', value: 'DAILY' },
    { name: 'Weekly Review', value: 'WEEKLY' },
    { name: 'Monthly Review', value: 'MONTHLY' },
    { name: 'Trading Psychology', value: 'PSYCHOLOGY' },
    { name: 'Performance Goals', value: 'GOALS' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[75vh]">
      {/* Sidebar: Categories and entries (1/4 width) */}
      <div className="space-y-4 flex flex-col h-full border-r border-border-color pr-4 lg:pr-6">
        {/* Categories select list */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-fg-muted tracking-wider mb-2">Notebook Folders</label>
          {categoriesList.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategoryFilter(cat.value);
                handleCreateNewNote();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                activeCategoryFilter === cat.value
                  ? 'bg-primary-main/15 border-l-2 border-primary-main text-white'
                  : 'text-fg-muted hover:bg-bg-card hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-card-solid border border-border-color">
                {notes.filter((n) => n.type === cat.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="h-px bg-border-color" />

        {/* Entries scroll list */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase text-fg-muted tracking-wider">Entries Feed</span>
            <button
              onClick={handleCreateNewNote}
              className="p-1 rounded bg-[#1e293b] hover:bg-slate-800 border border-slate-700 text-white transition-colors"
              title="Add Entry"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-1">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 relative group ${
                      isSelected
                        ? 'border-primary-main bg-primary-main/5'
                        : 'border-border-color bg-bg-card-solid/40 hover:bg-bg-card'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-white truncate flex-1 group-hover:text-primary-main transition-colors">
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-fg-muted hover:text-red-400 transition-all shrink-0"
                        title="Delete Entry"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                    
                    <span className="text-[10px] text-fg-muted flex items-center gap-1 font-semibold uppercase">
                      <Calendar size={10} />
                      {note.date}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <FolderOpen className="text-fg-muted w-8 h-8 stroke-1 mb-1.5" />
                <p className="text-[10px] text-fg-muted">Folder is empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Panel (3/4 width) */}
      <div className="lg:col-span-3 flex flex-col h-full space-y-4">
        {/* Editor Settings Topbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-color pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-main/15 text-primary-main">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">Notebook Space</h3>
              <p className="text-[10px] text-fg-muted uppercase tracking-wider font-bold">Write & review reflections</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveNote}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-main to-blue-600 text-white font-semibold rounded-xl text-xs hover:opacity-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Save size={14} />
              Save Entry
            </button>
          </div>
        </div>

        {/* Note Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Entry Title..."
              className="w-full px-4 py-2 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm font-semibold"
            />
          </div>
          <div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-bg-card-solid border border-border-color focus:border-primary-main focus:outline-none text-white text-sm"
            />
          </div>
        </div>

        {/* Write vs Preview Tabs & Text Formatting toolbar */}
        <div className="flex flex-col flex-1 border border-border-color rounded-2xl overflow-hidden bg-bg-card-solid">
          {/* Subheader Toolbar */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-border-color bg-[#0a0f1d]/50">
            {/* Tabs */}
            <div className="flex gap-1.5 p-0.5 bg-bg-card-solid rounded-lg border border-border-color">
              <button
                onClick={() => setActiveTab('write')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'write' ? 'bg-primary-main/20 text-white' : 'text-fg-muted hover:text-white'
                }`}
              >
                <Edit2 size={12} />
                Write
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'preview' ? 'bg-primary-main/20 text-white' : 'text-fg-muted hover:text-white'
                }`}
              >
                <Eye size={12} />
                Preview
              </button>
            </div>

            {/* Markdown shortcuts formatting buttons (Only visible in edit mode) */}
            {activeTab === 'write' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => insertTextAtCursor('**', '**')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Bold (**text**)"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => insertTextAtCursor('*', '*')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Italic (*text*)"
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() => insertTextAtCursor('# ')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Header 1 (# text)"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  onClick={() => insertTextAtCursor('## ')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Header 2 (## text)"
                >
                  <Heading2 size={14} />
                </button>
                <div className="w-px h-4 bg-border-color mx-1" />
                <button
                  onClick={() => insertTextAtCursor('- ')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Bullet List (- item)"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => insertTextAtCursor('- [ ] ')}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Task Checklist (- [ ] item)"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-[#1e293b] text-fg-muted hover:text-white"
                  title="Insert Image"
                >
                  <ImageIcon size={14} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageInsert}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-h-[350px] p-4 bg-[#060913]/30">
            {activeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your reflections here... Use the markdown helpers in the toolbar (headers, lists, bold text, checklists, and screenshots uploads)."
                className="w-full h-full min-h-[350px] bg-transparent border-0 focus:outline-none text-sm text-white resize-none leading-relaxed font-sans placeholder-fg-muted/40"
              />
            ) : (
              <div
                className="w-full h-full min-h-[350px] overflow-y-auto leading-relaxed select-text space-y-3 prose prose-invert max-w-none no-scrollbar"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
