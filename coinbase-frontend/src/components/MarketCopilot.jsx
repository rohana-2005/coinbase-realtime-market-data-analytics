import React, { useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { copilotAPI } from '../services/api';

const SUGGESTIONS = [
  'Summarize the market',
  'Explain the RSI',
  'What is the current trend?',
  'Show the recent high and low',
];

const MarketCopilot = ({ coin }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Ask me about live ${coin.label} price, RSI, EMA or its recent range.` },
  ]);

  const ask = async (question) => {
    const clean = question.trim();
    if (!clean || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: clean }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await copilotAPI.chat(clean, coin.id);
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer, mode: data.mode }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'I could not reach the analytics service. Please check that the backend is running.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="mb-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-[#0c1220] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">CryptoLens</div>
                <div className="text-[10px] text-slate-500">Live {coin.id} analytics</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white" aria-label="Close copilot">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-64 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'border border-slate-700 bg-slate-800/70 text-slate-300'
                }`}>
                  {message.text}
                  {message.mode === 'demo' && (
                    <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">Offline demo mode</div>
                  )}
                  {message.mode === 'gemini' && (
                    <div className="mt-1 text-[9px] uppercase tracking-wider text-emerald-400">Gemini Flash-Lite · live data</div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-500">Analyzing live data…</div>}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-slate-800 px-3 py-2">
            {SUGGESTIONS.map(suggestion => (
              <button key={suggestion} onClick={() => ask(suggestion)}
                className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] text-slate-400 hover:border-blue-500/50 hover:text-blue-300">
                {suggestion}
              </button>
            ))}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); ask(input); }} className="flex gap-2 border-t border-slate-800 p-3">
            <input value={input} onChange={event => setInput(event.target.value)} maxLength={400}
              placeholder={`Ask about ${coin.label}…`}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60" />
            <button type="submit" disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white disabled:opacity-40" aria-label="Send question">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[9px] text-slate-600">Live analytics only · not financial advice</p>
        </div>
      )}

      <button onClick={() => setOpen(value => !value)}
        className="flex items-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400">
        <Sparkles className="h-4 w-4" />
        Ask CryptoLens
      </button>
    </div>
  );
};

export default MarketCopilot;
