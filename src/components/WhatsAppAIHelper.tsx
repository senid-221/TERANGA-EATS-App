import React, { useEffect, useRef, useState } from 'react';

const DEVELOPER_WHATSAPP = '250726969060';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'openai/gpt-4o';
const MEMORY_KEY = 'terangaeats_ai_helper_memory_v1';

const whatsappIcon = (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-current">
    <path d="M19.11 17.21c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.15-1.34-.79-.7-1.33-1.56-1.49-1.83-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.26s.98 2.62 1.11 2.8c.14.18 1.92 2.94 4.65 4.12.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.59-.65 1.81-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z" />
    <path d="M16.02 3.2a12.7 12.7 0 0 0-10.9 19.25L3.2 28.8l6.5-1.88a12.7 12.7 0 1 0 6.32-23.72Zm0 23.14c-2.05 0-4.05-.55-5.81-1.6l-.42-.25-3.86 1.12 1.03-3.76-.27-.44A10.55 10.55 0 1 1 16.02 26.34Z" />
  </svg>
);

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const initialMessage: ChatMessage = {
  role: 'assistant',
  text: 'Muraho! 👋 Ndi TerangaEats Client Helper. Nakufasha kumenya menu, gutumiza, delivery, payment, cyangwa uko wavugana na team. Mbaza ikibazo cyawe.',
};

const SYSTEM_PROMPT = `You are TerangaEats Client Helper, the customer-support AI inside the TerangaEats food ordering app.

Rules:
- Give useful, natural, accurate answers. Do not make up facts.
- Never invent product names, prices, discounts, delivery times, order status, payment confirmation, restaurant availability, addresses, or company policies.
- If the conversation does not contain the information needed, clearly say that you do not have that information and direct the customer to the TerangaEats human team on WhatsApp.
- Help with menu questions, how to order, checkout, delivery, payment methods, order tracking, and general app support.
- If the customer asks in Kinyarwanda, answer in natural Kinyarwanda. If French, answer in French. If English, answer in English. Keep the language consistent with the customer.
- Be polite, concise, practical, and friendly.
- Remember the conversation history supplied in the messages and use it to avoid asking for information the customer already provided.
- Do not claim that you performed an action in the app unless the conversation explicitly confirms it.
- If a human is needed, say so and recommend the WhatsApp Team button.`;

const loadMemory = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return [initialMessage];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [initialMessage];
    const valid = parsed.filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string'
    );
    return valid.length ? valid.slice(-40) : [initialMessage];
  } catch {
    return [initialMessage];
  }
};

export const WhatsAppAIHelper: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMemory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Memory is best-effort if browser storage is unavailable.
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: 'user', text };
    const conversation = [...messages, userMessage];
    setInput('');
    setMessages(conversation);
    setLoading(true);

    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('VITE_OPENROUTER_API_KEY is not configured');
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin || 'https://citymarketbusiness.com',
          'X-Title': 'TerangaEats',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          temperature: 0.2,
          max_tokens: 700,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversation.slice(-30).map(m => ({ role: m.role, content: m.text })),
          ],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const reply = String(data?.choices?.[0]?.message?.content || '').trim();

      if (!response.ok || !reply) {
        throw new Error(String(data?.error?.message || `OpenRouter request failed (${response.status})`));
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.warn('OpenRouter AI Helper failed:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Mbabarira, AI ntiyabashije gusubiza ubu. Niba ikibazo cyawe ari ingenzi, kanda kuri WhatsApp Team uvugane n’umuntu wacu.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = () => {
    setMessages([initialMessage]);
    try {
      localStorage.removeItem(MEMORY_KEY);
    } catch {
      // Ignore storage errors.
    }
  };

  const openDeveloperWhatsApp = () => {
    const message = encodeURIComponent('Muraho TerangaEats, ndakeneye ubufasha kuri app.');
    window.open(`https://wa.me/${DEVELOPER_WHATSAPP}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[100] w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_70px_rgba(0,0,0,.2)]">
          <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2">{whatsappIcon}</div>
              <div>
                <div className="font-bold">TerangaEats AI Helper</div>
                <div className="text-xs text-white/75">AI Client Support • OpenRouter</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full px-2 py-1 text-xl" aria-label="Close">×</button>
          </div>

          <div className="max-h-[52vh] min-h-[250px] space-y-3 overflow-y-auto bg-[#f7f7f7] p-4">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'rounded-br-sm bg-[#DCF8C6] text-slate-800' : 'rounded-bl-sm bg-white text-slate-700 shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="w-fit rounded-2xl bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">AI iratekereza…</div>}
            <div ref={endRef} />
          </div>

          <div className="border-t bg-white p-3">
            <div className="mb-2 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Andika ikibazo…"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#25D366]"
              />
              <button onClick={send} disabled={loading || !input.trim()} className="rounded-2xl bg-[#25D366] px-4 font-bold text-white disabled:opacity-40">Send</button>
            </div>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">Conversation iribukwa kuri iyi device</span>
              <button onClick={clearMemory} className="text-[11px] font-semibold text-slate-500 hover:text-slate-800">Clear memory</button>
            </div>
            <button onClick={openDeveloperWhatsApp} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#075E54] px-4 py-3 text-sm font-bold text-white">
              {whatsappIcon} Vugana na TerangaEats Team kuri WhatsApp
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-4 z-[100] flex flex-col items-end gap-3 sm:right-6">
        {!open && <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg ring-1 ring-slate-100">Need help? 💬</span>}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Open TerangaEats WhatsApp AI Helper"
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,.4)] transition duration-200 hover:scale-105 active:scale-95"
        >
          <span className="absolute inset-0 rounded-full border-4 border-white/30" />
          {whatsappIcon}
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22c55e]" />
        </button>
      </div>
    </>
  );
};
