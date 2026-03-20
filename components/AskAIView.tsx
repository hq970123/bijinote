import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Paperclip, Mic, StopCircle, ArrowUp, Clock } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

export const AskAIView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "抱歉，我无法生成回答。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error("Failed to send message", error);
        const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "抱歉，连接服务时出现问题，请稍后再试。",
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionCard = ({ icon, title, prompt }: { icon: React.ReactNode, title: string, prompt: string }) => (
    <button 
        onClick={() => handleSend(prompt)}
        className="text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm transition-all group flex flex-col gap-2 bg-white"
    >
        <div className="text-purple-500 group-hover:text-purple-600">{icon}</div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{title}</span>
        <span className="text-xs text-gray-400 group-hover:text-gray-500 line-clamp-2">{prompt}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
       {/* Header */}
       <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={16} fill="currentColor" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900">AI 智能助手</h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-500 font-medium">使用 Gemini 2.5 Flash 模型</span>
                </div>
            </div>
        </div>
        <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">清除历史</button>
      </div>

      {/* Messages / Empty State */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto pb-20">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                    <Bot size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">下午好, Alex</h3>
                <p className="text-gray-500 mb-10 text-center max-w-md">我是您的个人智能助手。我可以帮您处理文档、规划日程，或者激发一些新灵感。</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <SuggestionCard 
                        icon={<Sparkles size={20} />} 
                        title="头脑风暴" 
                        prompt="为我的新产品发布会想5个有创意的口号，产品是一款专注效率的笔记应用。"
                    />
                    <SuggestionCard 
                        icon={<Clock size={20} />} 
                        title="日程规划" 
                        prompt="帮我规划一下明天的日程，重点是上午要完成季度报告，下午有两个会议。"
                    />
                    <SuggestionCard 
                        icon={<Paperclip size={20} />} 
                        title="总结文档" 
                        prompt="我有一份很长的会议记录，请帮我提炼出关键的行动项 (Action Items)。"
                    />
                    <SuggestionCard 
                        icon={<Send size={20} />} 
                        title="撰写邮件" 
                        prompt="帮我写一封礼貌但坚定的邮件，催促供应商尽快发货。"
                    />
                </div>
            </div>
        ) : (
            <>
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 ${
                            msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-white text-purple-600'
                        }`}>
                            {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} fill="currentColor" />}
                        </div>
                        
                        <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3.5 rounded-2xl text-sm leading-7 whitespace-pre-wrap shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-gray-900 text-white rounded-tr-sm' 
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                            {/* Timestamp removed for cleaner look, can be added back on hover */}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                         <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5">
                            <Sparkles size={14} fill="currentColor" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white">
        <div className="max-w-3xl mx-auto relative bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="输入消息给 AI..."
                className="w-full bg-transparent border-none rounded-xl pl-4 pr-12 py-3 focus:ring-0 text-sm resize-none h-[50px] max-h-[200px]"
                disabled={isLoading}
            />
            
            <div className="flex justify-between items-center px-2 pb-2">
                 <div className="flex gap-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Attach file">
                        <Paperclip size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Voice input">
                        <Mic size={18} />
                    </button>
                 </div>
                 <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                        input.trim() && !isLoading 
                        ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <ArrowUp size={18} strokeWidth={3} />
                </button>
            </div>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">AI 可能会生成不准确的信息，请核实重要内容。</p>
        </div>
      </div>
    </div>
  );
};