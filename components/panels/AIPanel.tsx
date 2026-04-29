'use client';
import { useState } from 'react';
import { useBrowserStore } from '@/store/browserStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Bot, Send, Sparkles, Globe, FileText, Languages, Zap, Copy, ThumbsUp, ThumbsDown, Settings } from 'lucide-react';
import styles from './Panel.module.css';

const AI_SUGGESTIONS = [
  { icon: FileText, text: 'Summarize this page' },
  { icon: Languages, text: 'Translate to Spanish' },
  { icon: Zap, text: 'Extract key facts' },
  { icon: Globe, text: 'Find similar pages' },
];

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const DEMO_RESPONSES: Record<string, string> = {
  'Summarize this page': '**Page Summary**\n\nThis page discusses modern web browser architecture and features. Key points:\n\n• Browser engines (Chromium, Gecko, WebKit) power rendering\n• Privacy features include tracker blocking and fingerprint protection\n• AI integration is becoming standard in browsers\n• Tab management innovations like Spaces are reshaping workflows\n\nOverall a comprehensive overview of 2024-2026 browser landscape.',
  'Translate to Spanish': '**Traducción al Español**\n\nEl contenido de esta página ha sido traducido:\n\n"Los navegadores modernos están incorporando características de inteligencia artificial para mejorar la experiencia del usuario, incluyendo asistentes de IA, detección de privacidad y gestión de pestañas inteligente..."',
  default: 'I\'m your **AI Co-Pilot** 🤖\n\nI can help you:\n• **Summarize** the current page\n• **Translate** content to any language\n• **Answer questions** about the page\n• **Compare** with similar content\n• **Extract** key data and facts\n\nWhat would you like to know?',
};

export default function AIPanel() {
  const { setActivePanel, navigate } = useBrowserStore();
  const { geminiApiKey } = useSettingsStore();
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: geminiApiKey ? "I'm your **AI Co-Pilot** powered by Gemini 🤖\n\nHow can I help you today?" : DEMO_RESPONSES.default },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    if (!geminiApiKey) {
      setTimeout(() => {
        const response = DEMO_RESPONSES[msg] || `I understand you're asking about: "${msg}"\n\n**API Key Required!** Please go to Settings to enter your Gemini API key to enable real-time AI responses. For now, this is a simulated offline response.`;
        setMessages(prev => [...prev, { role: 'ai', content: response }]);
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: msg }] }]
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I received an empty response from Gemini.';
      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${err.message || 'Failed to connect to Gemini API.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel animate-slide-left" style={{ borderLeft: '1px solid var(--glass-border)', borderRight: 'none', position: 'relative', right: 'auto', left: 'auto', animation: 'slideInRight var(--duration-normal) var(--ease-smooth) both' }}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className={styles.aiIcon}>
            <Bot size={16} />
          </div>
          <span className="panel-title">AI Co-Pilot</span>
          <span className="badge badge-primary" style={{ fontSize: 10 }}>Beta</span>
        </div>
        <button className="btn-icon" onClick={() => setActivePanel(null)} title="Close panel">✕</button>
      </div>

      {/* Quick actions */}
      <div className={styles.quickActions}>
        {AI_SUGGESTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.text} className={styles.quickBtn} onClick={() => sendMessage(s.text)}>
              <Icon size={12} />
              <span>{s.text}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="panel-body scroll-area">
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.aiMsg}`}>
              {msg.role === 'ai' && (
                <div className={styles.aiAvatar}><Sparkles size={12} /></div>
              )}
              <div className={styles.msgBubble}>
                <pre className={styles.msgText}>{msg.content}</pre>
                {msg.role === 'ai' && (
                  <div className={styles.msgActions}>
                    <button className={styles.msgBtn} title="Copy"><Copy size={11} /></button>
                    <button className={styles.msgBtn} title="Good response"><ThumbsUp size={11} /></button>
                    <button className={styles.msgBtn} title="Bad response"><ThumbsDown size={11} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.message}>
              <div className={styles.aiAvatar}><Sparkles size={12} /></div>
              <div className={`${styles.msgBubble} ${styles.thinking}`}>
                <div className={styles.dots}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <input
            className="input"
            placeholder="Ask anything about this page..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ borderRadius: 'var(--radius-full)', paddingRight: '40px' }}
          />
          <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={!input.trim()}>
            <Send size={14} />
          </button>
        </div>
        {geminiApiKey ? (
          <p className={styles.inputHint}>Powered by Gemini 1.5 Flash</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <p className={styles.inputHint} style={{ color: 'var(--color-warning)', margin: 0 }}>API Key missing (Simulated mode)</p>
            <button 
              onClick={() => { setActivePanel(null); navigate('binks://settings'); }} 
              style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Settings size={12} /> Configure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
