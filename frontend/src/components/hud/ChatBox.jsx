import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Input } from '../ui/input';

const ChatBox = () => {
  const { chatMessages = [], sendMessage, username } = useGameStore();
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  // Safely get messages array
  const messages = Array.isArray(chatMessages) ? chatMessages : [];

  return (
    <div 
      className={`chat-box transition-all ${isExpanded ? 'w-80 h-64' : 'w-64 h-40'}`}
      data-testid="chat-box"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b border-[#44403c] cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-rajdhani text-xs text-[#fbbf24] uppercase tracking-wider">Global Chat</span>
        <span className="text-[10px] text-[#78716c]">{isExpanded ? '▼' : '▲'}</span>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="overflow-y-auto p-2"
        style={{ height: isExpanded ? '180px' : '100px' }}
      >
        {messages.length === 0 ? (
          <p className="text-xs text-[#78716c] text-center py-4">No messages yet...</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="chat-message">
              <span className="username">{msg?.username || 'Unknown'}: </span>
              <span className="text-[#f5f5f4]">{msg?.message || ''}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-[#44403c]">
        <Input
          data-testid="chat-input"
          className="input-medieval h-7 text-xs"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
        />
      </form>
    </div>
  );
};

export default ChatBox;
