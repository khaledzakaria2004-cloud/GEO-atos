import React from 'react';
import Icon from '../../../components/AppIcon';

// Access the API key from environment variable
const CHATBOT_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;

// ChatMessage component
const ChatMessage = ({ message, isUser, timestamp, isTyping = false }) => {
  // You can use CHATBOT_API_KEY in your API calls
  const formatTime = (date) => {
    return new Date(date)?.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-10 h-10 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="Bot" size={18} color="white" />
        </div>
        <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-sm md:max-w-md lg:max-w-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 mb-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-success' : 'bg-primary'
      }`}>
        <Icon name={isUser ? 'User' : 'Bot'} size={18} color="white" />
      </div>
      
      <div className="flex flex-col max-w-sm md:max-w-md lg:max-w-lg">
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-tr-md' 
            : 'bg-muted text-muted-foreground rounded-tl-md'
        }`}>
          <div
            className="text-base md:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(message) }}
          />
        </div>
        <span className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;

// renderMarkdownToHtml function
const renderMarkdownToHtml = (text) => {
  if (!text) return '';
  // Escape raw HTML for safety
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Code blocks ```
  escaped = escaped.replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${code.trim()}</code></pre>`);
  // Inline code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headings
  escaped = escaped.replace(/^######\s(.+)$/gm, '<h6>$1</h6>');
  escaped = escaped.replace(/^#####\s(.+)$/gm, '<h5>$1</h5>');
  escaped = escaped.replace(/^####\s(.+)$/gm, '<h4>$1</h4>');
  escaped = escaped.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
  escaped = escaped.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
  escaped = escaped.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');
  // Bold and italics
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links [text](url)
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists (simple grouping)
  const lines = escaped.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inUl) {
        if (inOl) { html += '</ol>'; inOl = false; }
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${line.replace(/^\s*-\s+/, '')}</li>`;
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
    } else {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      if (line.trim().length) {
        html += `<p>${line}</p>`;
      } else {
        html += '<br/>';
      }
    }
  }
  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return html;
};
