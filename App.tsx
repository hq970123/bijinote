import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { TodoView } from './components/TodoView';
import { NotesView } from './components/NotesView';
import { AskAIView } from './components/AskAIView';
import { AuthView } from './components/AuthView';
import { authService } from './services/authService';
import { ViewType } from './types';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
      authService.logout();
      setIsAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.DASHBOARD: return <Dashboard onChangeView={setCurrentView} />;
      case ViewType.CALENDAR: return <CalendarView />;
      case ViewType.TODO: return <TodoView />;
      case ViewType.NOTES: return <NotesView />;
      case ViewType.ASK_AI: return <AskAIView />;
      default: return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-screen w-screen bg-white">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1 h-full overflow-hidden bg-white relative flex flex-col transition-all duration-300">
        {!isSidebarCollapsed && (
            // Mobile overlay or specific logic if needed, but for desktop we just resize flex
            <></>
        )}
        {/* Toggle button when sidebar is effectively gone/hidden if we were doing full hide, 
            but here Sidebar handles its own collapsed state rendering. 
            We might want a button here if Sidebar completely disappears, but sticking to Sidebar 'slim' mode.
        */}
        
        {renderView()}
      </main>
    </div>
  );
};

export default App;