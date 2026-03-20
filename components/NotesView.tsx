import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
    Search, Grid, List, MoreVertical, Star, Clock, Archive, 
    LayoutGrid, FileText, MoreHorizontal, ChevronLeft, 
    Bold, Italic, Underline, AlignLeft, ListOrdered, 
    Image as ImageIcon, Link as LinkIcon, Hash, Calendar,
    CheckSquare, Share2, Sparkles, Eye, PenLine,
    Plus, FileType, Network, ListTree, Code, Sigma, 
    Indent, Outdent, Eraser, Scissors, Copy, Clipboard,
    Type, Quote, Divide
} from 'lucide-react';

interface Note {
    id: number;
    title: string;
    content: string;
    preview: string;
    date: string;
    color: string;
    author: string;
    tags: string[];
    type: 'simple' | 'markdown' | 'mindmap' | 'outline';
}

const MOCK_NOTES: Note[] = [
    { 
        id: 1, 
        title: 'Project Phoenix 提案', 
        content: `# Project Phoenix 核心目标\n\n本项目的主要目标是创建一个无缝集成的生产力生态系统。`,
        preview: '本项目的主要目标是创建一个无缝集成的...', 
        date: '2小时前', 
        color: 'bg-yellow-50', 
        author: 'Alex',
        tags: ['工作', '规划'],
        type: 'markdown'
    },
    { id: 2, title: '会议记录: Q4 路线图', content: '...', preview: '参会人：Sarah, Mike, John。讨论了Q4路线图...', date: '昨天', color: 'bg-green-50', author: 'Sarah', tags: ['会议', '团队'], type: 'simple' },
    { id: 3, title: '设计灵感收集', content: '...', preview: '极简排版，留白运用，柔和配色...', date: '10月20日', color: 'bg-pink-50', author: 'Alex', tags: ['设计', '灵感'], type: 'mindmap' },
];

const NoteEditor: React.FC<{ note: Note; onBack: () => void }> = ({ note, onBack }) => {
    const [content, setContent] = useState(note.content);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    
    // Menu States
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, show: boolean}>({ x: 0, y: 0, show: false });
    const [insertMenu, setInsertMenu] = useState<{x: number, y: number, show: boolean}>({ x: 0, y: 0, show: false });
    
    // Close menus on click outside
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.show) setContextMenu({ ...contextMenu, show: false });
            if (insertMenu.show) setInsertMenu({ ...insertMenu, show: false });
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [contextMenu.show, insertMenu.show]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            show: true
        });
        setInsertMenu({ ...insertMenu, show: false });
    };

    const handleAiGenerate = () => {
        setIsAiGenerating(true);
        setTimeout(() => {
            const aiText = `\n\n## AI 建议补充\n\n基于当前文档内容...`;
            setContent(prev => prev + aiText);
            setIsAiGenerating(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-10 duration-200 relative" onContextMenu={handleContextMenu}>
            
            {/* Context Menu (Right Click) */}
            {contextMenu.show && (
                <div 
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-100 w-48 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col">
                        <button className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                            <span>剪切</span>
                            <span className="text-xs text-gray-400">Ctrl+X</span>
                        </button>
                        <button className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                            <span>拷贝</span>
                            <span className="text-xs text-gray-400">Ctrl+C</span>
                        </button>
                        <button className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                            <span>粘贴</span>
                            <span className="text-xs text-gray-400">Ctrl+V</span>
                        </button>
                        <button className="flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left border-b border-gray-100">
                            <span>粘贴纯文本</span>
                            <span className="text-xs text-gray-400">Ctrl+Shift+V</span>
                        </button>
                        
                        <div className="py-1">
                            <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                                <span>段落样式</span>
                                <ChevronLeft size={14} className="rotate-180 text-gray-400" />
                            </button>
                            <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                                <span>字体样式</span>
                                <ChevronLeft size={14} className="rotate-180 text-gray-400" />
                            </button>
                             <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">
                                <span>列表</span>
                                <ChevronLeft size={14} className="rotate-180 text-gray-400" />
                            </button>
                        </div>

                        <div className="border-t border-gray-100 py-1">
                            <button className="w-full px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">添加链接</button>
                            <button className="w-full px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">引用</button>
                        </div>
                        
                         <div className="border-t border-gray-100 py-1">
                            <button className="w-full px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">插入分割线</button>
                            <button className="w-full px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">插入代码块</button>
                            <button className="w-full px-4 py-2 hover:bg-purple-50 hover:text-purple-600 text-gray-700 transition-colors text-left">插入图片</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Insert/Format Menu (Floating Triggered) */}
            {insertMenu.show && (
                <div 
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-100 w-56 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: insertMenu.y, right: 80 }} // Fixed position relative to button or context
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col">
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors text-left">
                            <Code size={16} className="text-gray-400" />
                            <span>代码块</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors text-left">
                            <Sigma size={16} className="text-gray-400" />
                            <span>行内方程式</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors text-left border-b border-gray-100">
                             <div className="w-4 flex justify-center text-gray-400 font-serif font-bold">TeX</div>
                            <span>块级方程式</span>
                        </button>
                        
                        <div className="py-1">
                             <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <Indent size={16} className="text-gray-400" />
                                    <span>段落缩进</span>
                                </div>
                                <span className="text-xs text-gray-400">Ctrl + ]</span>
                            </button>
                             <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <Outdent size={16} className="text-gray-400" />
                                    <span>减少缩进</span>
                                </div>
                                <span className="text-xs text-gray-400">Ctrl + [</span>
                            </button>
                        </div>

                         <div className="border-t border-gray-100 py-1">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors text-left">
                                <Eraser size={16} className="text-gray-400" />
                                <span>清除样式</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-2">
                        <Clock size={12} />
                        最后编辑于 {note.date}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${isPreviewMode ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title={isPreviewMode ? "切换到编辑模式" : "切换到预览模式"}
                    >
                        {isPreviewMode ? <PenLine size={18} /> : <Eye size={18} />}
                        <span className="hidden sm:inline">{isPreviewMode ? '编辑' : '预览'}</span>
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Share2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                        <Star size={18} />
                    </button>
                    
                    {/* Insert Menu Trigger */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setInsertMenu({ x: e.clientX, y: e.clientY + 20, show: !insertMenu.show });
                            setContextMenu({ ...contextMenu, show: false });
                        }}
                        className={`p-2 rounded-lg transition-colors ${insertMenu.show ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-10">
                    {/* Title */}
                    <input 
                        type="text" 
                        defaultValue={note.title}
                        className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent mb-6"
                        placeholder="无标题"
                    />

                    {/* Metadata / Tags */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                {note.author.slice(0,1)}
                            </div>
                            <span className="text-sm text-gray-500">{note.author}</span>
                        </div>
                        <div className="flex gap-2">
                            {note.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                    <Hash size={10} className="mr-1 opacity-50" />
                                    {tag}
                                </span>
                            ))}
                            <button className="text-xs text-gray-400 hover:text-purple-600 px-2 py-0.5 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                + 标签
                            </button>
                        </div>
                    </div>

                    {/* Formatting Toolbar (Only visible in Edit Mode) */}
                    {!isPreviewMode && (
                        <div className="sticky top-20 z-10 mb-8 mx-auto w-fit animate-in fade-in slide-in-from-top-4 duration-200">
                            <div className="flex items-center gap-1 bg-white shadow-lg border border-gray-100 rounded-xl p-1.5 px-3">
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Bold size={16} /></button>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Italic size={16} /></button>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><Underline size={16} /></button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><AlignLeft size={16} /></button>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><ListOrdered size={16} /></button>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><CheckSquare size={16} /></button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><LinkIcon size={16} /></button>
                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><ImageIcon size={16} /></button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button 
                                    onClick={handleAiGenerate}
                                    disabled={isAiGenerating}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        isAiGenerating 
                                        ? 'bg-purple-100 text-purple-600 cursor-wait' 
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-md hover:scale-105'
                                    }`}
                                >
                                    <Sparkles size={14} className={isAiGenerating ? 'animate-spin' : ''} />
                                    {isAiGenerating ? '生成中...' : 'AI 续写'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Body */}
                    {isPreviewMode ? (
                        <div className="prose prose-purple max-w-none animate-in fade-in duration-200">
                            <ReactMarkdown
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-8 text-gray-900 border-b pb-2" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-8 text-gray-800" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-2 mt-6 text-gray-800" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-700 text-lg" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                                    li: ({node, ...props}) => <li className="ml-4" {...props} />,
                                    a: ({node, ...props}) => <a className="text-purple-600 hover:underline hover:text-purple-700 font-medium transition-colors" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-200 pl-4 py-1 italic text-gray-600 my-6 bg-gray-50/50 rounded-r-lg" {...props} />,
                                    code: ({node, ...props}) => <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-purple-600" {...props} />,
                                    pre: ({node, ...props}) => <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-6 border border-gray-100 text-sm" {...props} />,
                                    img: ({node, ...props}) => <img className="rounded-xl shadow-sm my-6 max-h-[400px] object-cover" {...props} />,
                                    hr: ({node, ...props}) => <hr className="my-8 border-gray-100" {...props} />,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <textarea 
                            className="w-full h-[calc(100vh-400px)] resize-none border-none focus:ring-0 text-lg leading-relaxed text-gray-700 placeholder-gray-300 bg-transparent font-sans"
                            placeholder="开始输入 Markdown 文本..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export const NotesView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  const [showNewNoteMenu, setShowNewNoteMenu] = useState(false);

  const createNewNote = (type: Note['type']) => {
      setSelectedNote({ 
          id: Date.now(), 
          title: '', 
          content: '', 
          preview: '', 
          date: '刚刚', 
          color: 'bg-white', 
          author: 'Me', 
          tags: [],
          type
      });
      setShowNewNoteMenu(false);
  };

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === id 
            ? 'bg-gray-900 text-white shadow-md' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-full bg-white overflow-hidden">
       {/* Sidebar / List View */}
       <div className={`flex flex-col border-r border-gray-100 bg-white ${selectedNote ? 'w-[320px] hidden md:flex' : 'w-full'} transition-all`}>
           
           {/* Sidebar Header */}
           <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-gray-100 rounded-md">
                       <FileText size={16} className="text-gray-600" />
                   </div>
                   <h2 className="text-sm font-bold text-gray-900">所有笔记</h2>
               </div>
               
               {/* New Note Button & Menu */}
               <div className="relative">
                   <button 
                        onClick={() => setShowNewNoteMenu(!showNewNoteMenu)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                   >
                       <Plus size={18} className="text-gray-600" />
                   </button>
                   
                   {showNewNoteMenu && (
                       <>
                           <div className="fixed inset-0 z-20" onClick={() => setShowNewNoteMenu(false)}></div>
                           <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-200">
                               <button onClick={() => createNewNote('simple')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                   <FileText size={16} className="text-gray-400" /> 简单笔记
                               </button>
                               <button onClick={() => createNewNote('markdown')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                   <FileType size={16} className="text-gray-400" /> 新Markdown
                               </button>
                               <button onClick={() => createNewNote('mindmap')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                   <Network size={16} className="text-gray-400" /> 新思维导图
                               </button>
                               <button onClick={() => createNewNote('outline')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                   <ListTree size={16} className="text-gray-400" /> 新大纲笔记
                               </button>
                           </div>
                       </>
                   )}
               </div>
           </div>
           
           {/* Sidebar List */}
           <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
               {MOCK_NOTES.map(note => (
                   <div 
                       key={note.id}
                       onClick={() => setSelectedNote(note)}
                       className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                           selectedNote?.id === note.id 
                           ? 'bg-purple-50 border border-purple-100' 
                           : 'hover:bg-gray-50 border border-transparent'
                       }`}
                   >
                       <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-gray-900 text-sm line-clamp-1">{note.title || '无标题'}</div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{note.date}</span>
                       </div>
                       <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed opacity-80">{note.preview}</p>
                   </div>
               ))}
           </div>
       </div>

       {/* Main Content Area */}
       <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!selectedNote ? 'flex' : 'hidden md:flex'}`}>
           {selectedNote ? (
               <NoteEditor note={selectedNote} onBack={() => setSelectedNote(null)} />
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                   <div className="mb-6 opacity-80">
                       <span className="text-4xl text-gray-300 font-light">+</span>
                   </div>
                   <h3 className="text-lg font-medium text-gray-600 mb-8">从左侧列表中打开笔记或下列选项中添加</h3>
                   
                   <div className="grid grid-cols-1 max-w-sm w-full gap-4">
                       <button onClick={() => createNewNote('simple')} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg border border-gray-100 transition-all group text-left">
                           <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                               <FileText size={20} className="text-gray-500" />
                           </div>
                           <div>
                               <div className="font-medium text-gray-900 text-sm">简单笔记</div>
                               <div className="text-xs text-gray-400">简单笔记，所见即所得模式</div>
                           </div>
                       </button>
                       <button onClick={() => createNewNote('markdown')} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg border border-gray-100 transition-all group text-left">
                           <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                               <FileType size={20} className="text-gray-500" />
                           </div>
                           <div>
                               <div className="font-medium text-gray-900 text-sm">Markdown</div>
                               <div className="text-xs text-gray-400">简单笔记，Markdown模式</div>
                           </div>
                       </button>
                       <button onClick={() => createNewNote('mindmap')} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg border border-gray-100 transition-all group text-left">
                           <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                               <Network size={20} className="text-gray-500" />
                           </div>
                           <div>
                               <div className="font-medium text-gray-900 text-sm">思维导图</div>
                               <div className="text-xs text-gray-400">思维导图，思维导图模式</div>
                           </div>
                       </button>
                        <button onClick={() => createNewNote('outline')} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg border border-gray-100 transition-all group text-left">
                           <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                               <ListTree size={20} className="text-gray-500" />
                           </div>
                           <div>
                               <div className="font-medium text-gray-900 text-sm">大纲笔记</div>
                               <div className="text-xs text-gray-400">思维导图，大纲笔记模式</div>
                           </div>
                       </button>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};