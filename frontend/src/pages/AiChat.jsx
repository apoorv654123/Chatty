import { AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useThemeStore } from '../store/useThemeStore';

const AiChat = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Pre-filled with your API key
  const [apiKey, setApiKey] = useState("AIzaSyAQWhCftb1aAJjwEvx6QPXns1Jz-mfTDdw");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const callGeminiApi = async (prompt) => {
    if (!apiKey) {
      setError("Please enter your Gemini API key");
      return null;
    }

    try {
      // Using the gemini-2.0-flash model as specified in your curl command
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to get response from Gemini (Status: ${response.status})`);
      }

      const data = await response.json();
      
      // Extract the text from the response
      if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected response format from Gemini API");
      }
    } catch (err) {
      setError(err.message);
      console.error("Gemini API Error:", err);
      return null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;
    setError(null);

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const userPrompt = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Call Gemini API
    const geminiResponse = await callGeminiApi(userPrompt);
    
    if (geminiResponse) {
      const aiMessage = {
        id: Date.now(),
        text: geminiResponse,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 pt-20 min-h-[calc(100vh-64px)]">
      <div className="card bg-base-200 shadow-xl h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="card-title p-4 border-b border-base-300">
          <button 
            onClick={() => navigate("/")}
            className="btn btn-circle btn-ghost"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="ml-4 flex-1">
            <h2 className="font-medium">Chatty AI</h2>
            <p className="text-xs opacity-70">Ask me anything</p>
          </div>
          
          {/* API Key Input */}
          <div className="flex items-center">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Gemini API Key"
              className="input input-bordered input-sm w-48"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Area */}
        <div className="card-body p-4 overflow-y-auto flex-1">
          {messages.length === 0 && (
            <div className="text-center opacity-70 py-10">
              <p className="mb-2">👋 Welcome to Chatty AI</p>
              <p>Send a message to start the conversation</p>
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`chat ${message.sender === "user" ? "chat-end" : "chat-start"}`}
              >
                <div className={`chat-bubble ${message.sender === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"}`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-secondary">
                  <div className="flex space-x-2">
                    <div className="size-2 bg-current rounded-full animate-bounce"></div>
                    <div className="size-2 bg-current rounded-full animate-bounce delay-100"></div>
                    <div className="size-2 bg-current rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="card-actions p-4 border-t border-base-300">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="input input-bordered flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={inputMessage.trim() === "" || isLoading}
              className="btn btn-primary"
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiChat;