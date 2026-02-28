import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ChatInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechLang, setSpeechLang] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage?.getItem('speechLang') : null;
      if (saved) return saved;
    } catch {}
    return (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar')) ? 'ar-EG' : 'en-US';
  });
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    try { window.localStorage?.setItem('speechLang', speechLang); } catch {}
  }, [speechLang]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message?.trim() && !disabled) {
      onSendMessage(message?.trim());
      setMessage('');
      if (textareaRef?.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' && !e?.shiftKey) {
      e?.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e?.target?.value);
    // Auto-resize textarea
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef?.current?.scrollHeight, 120)}px`;
    }
  };

  const handleVoiceToggle = () => {
    if (!speechSupported) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch {}
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    let finalTranscript = '';
    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => {
      setIsRecording(false);
      setMessage((prev) => prev?.trim()?.length ? prev : finalTranscript);
    };
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      const combined = (finalTranscript + ' ' + interim).trim();
      setMessage(combined);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  };

  const quickPrompts = [
    "Create a workout plan for beginners",
    "What should I eat post-workout?",
    "How to improve my form?",
    "Suggest healthy meal prep ideas"
  ];

  const handleQuickPrompt = (prompt) => {
    if (!disabled) {
      onSendMessage(prompt);
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4">
      {/* Voice Language Selector */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Voice language</span>
        <select
          value={speechLang}
          onChange={(e) => setSpeechLang(e?.target?.value)}
          disabled={disabled}
          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border disabled:opacity-50"
        >
          <option value="en-US">English</option>
          <option value="ar-EG">العربية</option>
        </select>
      </div>
      {/* Quick Prompts */}
      <div className="mb-3 flex flex-wrap gap-2">
        {quickPrompts?.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={disabled}
            className="text-sm bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about fitness, nutrition, or workouts..."
            disabled={disabled}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] max-h-[140px]"
            rows={1}
          />
          
          {/* Voice Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 ${
              isRecording ? 'text-error animate-pulse' : 'text-muted-foreground'
            }`}
          >
            <Icon name={isRecording ? 'MicOff' : 'Mic'} size={18} />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message?.trim() || disabled}
          size="icon"
          className="w-14 h-14 sm:w-12 sm:h-12 rounded-full"
        >
          <Icon name="Send" size={20} />
        </Button>
      </form>
      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center space-x-2 text-error text-sm">
          <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
          <span>Recording... Tap to stop ({speechLang === 'ar-EG' ? 'Arabic' : 'English'})</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;