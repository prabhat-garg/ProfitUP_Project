import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUp,
  ClipboardCopy,
  Mic,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { answerQuestion, type AskResponse } from '../lib/engine';
import { copyText, uid } from '../lib/utils';
import { PageHeader, ConfidenceBadge } from '../components/shared';
import { Badge, Button, Card, Textarea, buttonClass, useToast } from '../components/ui';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AskResponse;
}

interface RecognitionResultLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

const quickKeys = ['ask.quick1', 'ask.quick2', 'ask.quick3', 'ask.quick4', 'ask.quick5'] as const;

export default function AskPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const autoSent = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const q = searchParams.get('q');

  const suggestedQuestion = useMemo(() => {
    if (!q) return '';
    const map: Record<string, (typeof quickKeys)[number]> = {
      order: 'ask.quick1',
      dead: 'ask.quick2',
      profit: 'ask.quick3',
      festival: 'ask.quick4',
      udhaar: 'ask.quick5',
    };
    return map[q] ? t(map[q]) : q;
  }, [q, t]);

  const send = useCallback(
    (text?: string) => {
      const question = (text ?? input).trim();
      if (!question) return;
      const response = answerQuestion(state, question, lang);
      setMessages((current) => [
        ...current,
        { id: uid('msg'), role: 'user', text: question },
        { id: uid('msg'), role: 'assistant', text: response.text, response },
      ]);
      setInput('');
    },
    [input, state, lang],
  );

  useEffect(() => {
    if (!suggestedQuestion || autoSent.current) return;
    autoSent.current = true;
    send(suggestedQuestion);
  }, [suggestedQuestion, send]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    },
    [],
  );

  const startVoice = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      push({ title: t('ask.voiceUnsupported'), tone: 'error' });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript;
      if (transcript) setInput((current) => `${current}${current ? ' ' : ''}${transcript}`);
    };
    recognition.onerror = () => {
      setListening(false);
      push({ title: t('ask.voiceUnsupported'), tone: 'error' });
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const speak = (message: ChatMessage) => {
    if (!('speechSynthesis' in window)) {
      push({ title: t('ask.voiceUnsupported'), tone: 'error' });
      return;
    }
    if (speakingId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const copyAnswer = async (message: ChatMessage) => {
    await copyText(message.text);
    push({ title: t('common.copied') });
  };

  return (
    <div>
      <PageHeader
        number="14"
        title={t('ask.title')}
        sub={t('ask.sub')}
        actions={
          messages.length > 0 ? (
            <Button variant="secondary" onClick={() => { setMessages([]); setInput(''); window.speechSynthesis?.cancel(); setSpeakingId(null); }}>
              <RotateCcw className="h-4 w-4" /> {t('ask.clear')}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.72fr_0.28fr]">
        <Card className="flex min-h-[60vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-primary-soft p-2 text-primary"><Sparkles className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-extrabold">{t('ask.assistant')}</p>
                <p className="text-[10px] text-muted">{t('ask.ruleBased')}</p>
              </div>
            </div>
            <Badge tone="blue" dot>{t('ask.ruleBased')}</Badge>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <span className="mb-4 rounded-2xl bg-primary-soft p-4 text-primary"><Sparkles className="h-7 w-7" /></span>
                <h2 className="text-lg font-extrabold">{t('ask.title')}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{t('ask.empty')}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {quickKeys.map((key) => (
                    <button key={key} type="button" className={buttonClass('secondary', 'sm')} onClick={() => send(t(key))}>
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-dark px-4 py-2.5 text-sm text-white">
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">{t('ask.you')}</p>
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-2.5">
                    <span className="mt-1 h-fit rounded-lg bg-primary-soft p-1.5 text-primary"><Sparkles className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 max-w-[92%] flex-1">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-muted">{t('ask.assistant')}</p>
                      <div className="rounded-2xl rounded-tl-md border border-line bg-bg/70 px-4 py-3">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        {message.response && (
                          <>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <ConfidenceBadge level={message.response.confidence} />
                              <Badge tone="neutral">{t('ask.ruleBased')}</Badge>
                            </div>
                            {message.response.citations.length > 0 && (
                              <dl className="mt-3 grid gap-1.5 border-t border-line pt-3 text-[11px] sm:grid-cols-3">
                                {message.response.citations.map((citation) => (
                                  <div key={`${citation.label}-${citation.value}`} className="rounded-lg bg-card px-2.5 py-1.5">
                                    <dt className="text-muted">{citation.label}</dt>
                                    <dd className="num mt-0.5 text-xs font-bold text-ink">{citation.value}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            <p className="mt-2 text-[10px] leading-relaxed text-muted">{message.response.disclaimer}</p>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => speak(message)} aria-label={t('ask.readAloud')}>
                          {speakingId === message.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          {t('ask.readAloud')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void copyAnswer(message)}>
                          <ClipboardCopy className="h-3.5 w-3.5" /> {t('common.copy')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ),
              )
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3 sm:p-4">
            {messages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {quickKeys.slice(0, 4).map((key) => (
                  <button key={key} type="button" className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-muted hover:border-primary hover:text-primary" onClick={() => send(t(key))}>
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <button
                type="button"
                onClick={startVoice}
                className={buttonClass(listening ? 'primary' : 'secondary', 'md', 'shrink-0')}
                aria-label={t('ask.voice')}
                title={t('ask.voice')}
              >
                <Mic className={listening ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
              </button>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={listening ? t('ask.listening') : t('ask.placeholder')}
                rows={1}
                className="min-h-10 flex-1 resize-none py-2"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <Button type="submit" className="shrink-0" disabled={!input.trim()} aria-label={t('ask.send')}>
                <ArrowUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t('ask.send')}</span>
              </Button>
            </form>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              {t('ask.disclosure')} {t('ask.llm')} {t('common.unavailable')}.
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="kicker">{t('ask.quick1')}</p>
            <div className="mt-2 grid gap-1.5">
              {quickKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => send(t(key))}
                  className="rounded-lg border border-line px-3 py-2 text-left text-xs font-semibold hover:border-primary"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="kicker">{t('common.dataLevel')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ConfidenceBadge level={state.business.dataLevel === 'full_sales' ? 'best' : state.business.dataLevel === 'orders_upi' ? 'good' : 'basic'} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {state.business.dataLevel === 'full_sales'
                ? t('landing.bestBody')
                : state.business.dataLevel === 'orders_upi'
                  ? t('landing.goodBody')
                  : t('landing.basicBody')}
            </p>
          </Card>

          <Card className="border-accent/30 p-4">
            <p className="text-xs font-bold">{t('common.howCalculated')}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('ask.disclosure')} {t('common.estimatedNote')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
