import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  FileText, 
  Search, 
  Folder, 
  Plus,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  User,
  Settings,
  Gift,
  PlusCircle,
  Star,
  Trash2,
  Tag,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { ViewType } from '../types';
import { authService } from '../services/authService';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, collapsed, onToggleCollapse }) => {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
      authService.logout();
      window.location.reload(); 
  };

  const NavItem = ({ view, icon, label }: { view: ViewType; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
        currentView === view 
          ? 'bg-[#E8EAF0] text-gray-900' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <div className={`transition-colors ${currentView === view ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
        {icon}
      </div>
      {!collapsed && <span>{label}</span>}
    </button>
  );

  const SectionHeader = ({ label, action, isOpen, onToggle }: { label: string; action?: React.ReactNode; isOpen: boolean, onToggle: () => void }) => (
    collapsed ? null : (
      <div 
          className="flex items-center justify-between px-3 mt-6 mb-2 text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          onClick={onToggle}
      >
        <div className="flex items-center gap-1">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{label}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      </div>
    )
  );

  const FolderItem = ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
    <div className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 cursor-pointer group transition-colors ${collapsed ? 'justify-center' : ''}`}>
      <div className="text-gray-400 group-hover:text-gray-600">
        {icon || <Folder size={16} />}
      </div>
      {!collapsed && <span className="group-hover:text-gray-900 truncate">{label}</span>}
    </div>
  );

  const currentUser = authService.getCurrentUser();
  const displayName = currentUser?.phone ? `用户 ${currentUser.phone.slice(-4)}` : '边境悍匪TT';

  return (
    <div className={`${collapsed ? 'w-[64px]' : 'w-[240px]'} bg-[#F7F8FA] h-full flex flex-col flex-shrink-0 font-sans border-r border-gray-200 select-none text-gray-700 transition-all duration-300 relative group/sidebar`}>
      
      {/* Top Header & Toggle */}
      <div className="h-12 flex items-center justify-between px-3 mb-1">
          {!collapsed && (
              <span className="font-bold text-gray-700 text-sm ml-1 truncate max-w-[150px]">Edge Note</span>
          )}
          <button 
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
      </div>

      {/* Main Navigation */}
      <div className="px-2 space-y-1">
        <NavItem view={ViewType.DASHBOARD} icon={<LayoutDashboard size={18} />} label="今天" />
        <NavItem view={ViewType.CALENDAR} icon={<Calendar size={18} />} label="日历" />
        <NavItem view={ViewType.TODO} icon={<CheckSquare size={18} />} label="待办" />
        <NavItem view={ViewType.ASK_AI} icon={<Sparkles size={18} />} label="Ask AI" />
      </div>

      {/* Workspace Section */}
      <div className="flex-1 overflow-y-auto px-2 mt-2 scrollbar-hide">
         {!collapsed && <div className="mt-4 mb-2 px-3 text-xs font-medium text-gray-400">笔记</div>}
         {collapsed && <div className="h-4"></div>}
         
         <FolderItem label="所有笔记" icon={<FileText size={16} />} />

        <SectionHeader 
            label="工作内容" 
            isOpen={isWorkspaceOpen}
            onToggle={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            action={<Plus size={14} className="hover:text-gray-900" />} 
        />
        {(isWorkspaceOpen || collapsed) && (
            <div className={`space-y-0.5 ${collapsed ? 'mt-2' : 'pl-2'}`}>
                <FolderItem label="产品设计" />
                <FolderItem label="会议记录" />
                {!collapsed && <FolderItem label="周报" />}
            </div>
        )}
        
        {!collapsed && (
            <>
                <SectionHeader 
                    label="创意灵感" 
                    isOpen={isTagsOpen}
                    onToggle={() => setIsTagsOpen(!isTagsOpen)}
                />
                
                <SectionHeader 
                    label="日常记录" 
                    isOpen={true}
                    onToggle={() => {}}
                />

                <div className="mt-4 flex items-center px-3 gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    <div className="text-gray-400"><Tag size={16} /></div>
                    <span>标签</span>
                </div>
            </>
        )}
      </div>

      {/* Footer Area / Profile */}
      <div className="p-3 mt-auto">
         {/* Dropup Profile Menu */}
         <div className="relative mb-2" ref={profileRef}>
             <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200/50 cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}
             >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                    TT
                </div>
                {!collapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{displayName}</div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </>
                )}
             </div>

             {/* Profile Popup */}
             {isProfileOpen && (
                 <div className="absolute bottom-full left-0 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1.5 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                     <div className="px-3 py-2 border-b border-gray-50 mb-1">
                         <div className="font-bold text-sm text-gray-900">{displayName}</div>
                         <div className="text-xs text-gray-400">Pro 会员</div>
                     </div>
                     <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                         <User size={16} /> 账号设置
                     </button>
                     <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                         <Gift size={16} /> 邀请与积分
                     </button>
                     <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                         <LogOut size={16} /> 退出登录
                     </button>
                 </div>
             )}
         </div>
        
        {!collapsed && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-gray-500">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><Star size={18} /></button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><Trash2 size={18} /></button>
                <div className="flex-1"></div>
                <button className="p-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full shadow-md transition-all">
                    <Plus size={20} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};