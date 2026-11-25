'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, SendHorizontal, User, GraduationCap } from 'lucide-react';

export default function Chatbot() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [theme, setTheme] = useState('light');
  const endRef = useRef(null);

  // CREATE SESSION ID (ONCE)
  useEffect(() => {
    const storedSession = crypto.randomUUID();
    setSessionId(storedSession);
  }, []);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Theme persistence (in-memory only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const isDark = theme === 'dark';

  const cleanResponse = (text) => {
    if (!text) return '';

    return text
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^- /gm, '')
      .replace(/\|/g, ' ')
      .replace(/---+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || loading || !sessionId) return;

    const userText = inputValue;

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, '')}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          sessionId: sessionId,
        }),
      });

      const rawText = await res.text();
      if (!res.ok) {
        const snippet = rawText ? rawText.slice(0, 300) : '';
        throw new Error(`Chat request failed: ${res.status} ${res.statusText}${snippet ? ` — ${snippet}` : ''}`);
      }

      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      const reply = data?.reply ?? data?.message ?? (typeof data === 'string' ? data : rawText);
      const cleanedText = cleanResponse(reply);

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: cleanedText || 'No response from server' },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Chat request failed. ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerClass = useMemo(() => {
    return [
      'relative flex flex-col h-screen w-screen overflow-hidden transition-colors',
      isDark
        ? 'bg-slate-900'
        : 'bg-white',
    ].join(' ');
  }, [isDark]);

  const containerStyle = {
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    boxSizing: 'border-box'
  };

  const headerBorder = isDark ? 'border-slate-700' : 'border-slate-300';
  const subtleText = isDark ? 'text-slate-400' : 'text-slate-600';

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={isDark ? 'dark' : ''} style={{ overflow: 'hidden', position: 'fixed', inset: 0 }}>
      <style jsx>{`
        body {
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .theme-switch {
          position: relative;
          display: inline-block;
          width: 3.5em;
          height: 2em;
          border-radius: 1em;
          border: 2px solid currentColor;
          transition: all 0.3s ease;
        }

        .theme-switch input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .theme-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f8f9fa;
          transition: all 0.4s ease;
          border-radius: 1em;
        }

        .theme-slider:before {
          position: absolute;
          content: "";
          height: 1.2em;
          width: 1.2em;
          border-radius: 50%;
          left: 0.3em;
          bottom: 0.3em;
          background: #1e3a8a;
          transition: all 0.4s ease;
          border: 2px solid #1e3a8a;
        }

        .theme-switch input:checked + .theme-slider {
          background: #1e293b;
        }

        .theme-switch input:checked + .theme-slider:before {
          transform: translateX(1.5em);
          background: #f1f5f9;
          border-color: #f1f5f9;
        }

        .college-badge {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
          animation: float 3s ease-in-out infinite;
        }

        .message-enter {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .floating-icon {
          animation: float 4s ease-in-out infinite;
        }

        /* Hide scrollbar but keep functionality */
        .chat-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .chat-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .college-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
          border-bottom: 3px solid #1e3a8a;
        }

        .college-header-dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          border-bottom: 3px solid #0f172a;
        }

        .academic-accent {
          border-left: 4px solid #1e3a8a;
        }

        .academic-accent-dark {
          border-left: 4px solid #3b82f6;
        }
      `}</style>

      <div className={containerClass} style={containerStyle}>
        {/* Header - Classic College Style */}
        <div
          className={isDark ? 'college-header-dark' : 'college-header'}
          style={{ padding: '1.25rem 1.5rem' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-700 floating-icon">
                <GraduationCap className="w-8 h-8 text-blue-900 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  StudySync AI
                </p>
                <p className="text-sm text-blue-100 dark:text-slate-300 font-medium">
                  Teacher Portal • Academic Assistant
                </p>
              </div>
            </div>

            {/* Theme toggle */}
            <label className="theme-switch">
              <input 
                type="checkbox" 
                checked={isDark}
                onChange={handleThemeToggle}
                aria-label="Toggle theme"
              />
              <span className="theme-slider"></span>
            </label>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-6 py-6 overflow-y-auto space-y-4 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 chat-scroll">
          {messages.length === 0 && (
            <div className="mt-12 text-center px-4">
              <div className="inline-block mb-8">
                <div className="w-24 h-24 rounded-full college-badge flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-700">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome to StudySync AI
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-2 font-medium">
                Teacher Portal
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Your comprehensive academic assistant for teaching, assessments, and student support. Ask questions, generate materials, or get pedagogical guidance.
              </p>
              <div className="mt-6 inline-flex flex-col gap-3 max-w-2xl">
                <div className="group px-6 py-4 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer hover:border-blue-900 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 academic-accent dark:academic-accent-dark">
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-900 dark:bg-blue-500"></span>
                    Explain Newton's laws in simple terms for my students
                  </span>
                </div>
                <div className="group px-6 py-4 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer hover:border-blue-900 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 academic-accent dark:academic-accent-dark">
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-900 dark:bg-blue-500"></span>
                    Generate 5 multiple-choice questions on Chapter 2
                  </span>
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-3 message-enter ${m.sender === 'user' ? 'justify-end' : ''}`}
            >
              {m.sender === 'bot' && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-900 dark:bg-blue-800 shadow-md border-2 border-white dark:border-slate-700 shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] px-5 py-4 shadow-md leading-relaxed text-[15px] ${
                  m.sender === 'user'
                    ? 'bg-blue-900 dark:bg-blue-800 text-white border-2 border-blue-800 dark:border-blue-700 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl academic-accent dark:academic-accent-dark'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 dark:bg-slate-600 shadow-md border-2 border-white dark:border-slate-700 shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex items-end gap-3 message-enter">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-900 dark:bg-blue-800 shadow-md border-2 border-white dark:border-slate-700">
                <Bot className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="px-6 py-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md academic-accent dark:academic-accent-dark">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <span className="text-sm font-semibold">Processing</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-900 dark:bg-blue-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-blue-800 dark:bg-blue-600 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-700 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div
          className={`px-6 py-5 border-t-2 ${headerBorder} flex gap-3 items-center bg-white dark:bg-slate-900`}
        >
          <div className="relative flex-1">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question or request..."
              className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-300 shadow-sm"
              disabled={loading}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim()}
            className="w-14 h-14 shrink-0 flex items-center justify-center bg-blue-900 dark:bg-blue-800 hover:bg-blue-800 dark:hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white transition-all duration-300 shadow-md hover:shadow-lg border-2 border-blue-800 dark:border-blue-700"
            aria-label="Send"
          >
            <SendHorizontal size={22} className={loading ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
