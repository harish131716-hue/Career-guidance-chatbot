import React, { useState, useRef, useEffect } from "react";
import { Send, Briefcase, GraduationCap, TrendingUp, Trash2, Compass, Circle, Phone } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I’m your AI career guide 👋 What are you interested in (science, gaming, business, arts, engineering, etc.)?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState("checking");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (response.ok) setOllamaStatus("connected");
      else setOllamaStatus("error");
    } catch {
      setOllamaStatus("error");
    }
  };

  const quickPrompts = [
    { icon: Compass, text: "Explore careers", prompt: "I am not sure what career path to choose." },
    { icon: GraduationCap, text: "College planning", prompt: "What should I consider when choosing a college or major?" },
    { icon: Briefcase, text: "Career info", prompt: "Can you tell me about careers in technology?" },
    { icon: TrendingUp, text: "Future skills", prompt: "What skills should I develop for future career success?" }
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory = messages
        .map((msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`)
        .join("\n");

      const fullPrompt = `
You are a career counseling chatbot for high school students.

Rules:
- You ONLY talk about careers, education, skills, or future planning.
- If the user asks something unrelated (food, games, jokes), connect it to a career instead of answering directly.
- Do NOT write puzzles or meta explanations.
- Speak like a normal helpful counselor.

Conversation:
${conversationHistory}

User: ${userMessage}
Bot:
`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "phi",
          prompt: fullPrompt,
          stream: false,
          options: { temperature: 0.6 }
        }),
      });

      if (!response.ok) throw new Error("Ollama not responding");

      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response
              .replace(/Career Counselor:/gi, "")
              .replace(/Student:/gi, "")
              .replace(/You are an AI Career Counselor.*/gi, "")
              .replace(/You are an SEO analyst.*$/gis, "")
              .replace(/In the above conversation.*$/gis, "")
              .replace(/Question:.*$/gis, "")
              .replace(/Answer:.*$/gis, "")
              .trim(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error connecting to Ollama. Make sure it is running." },
      ]);
      setOllamaStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => setInput(prompt);

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "Chat cleared 👍 What would you like to explore now?" },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-100">

      {/* Header */}
      <div className="bg-black/40 backdrop-blur border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-400">Career Compass AI</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Powered by Ollama (Phi)</span>
              <Circle
                size={8}
                className={
                  ollamaStatus === "connected"
                    ? "fill-green-500 text-green-500"
                    : ollamaStatus === "error"
                    ? "fill-red-500 text-red-500"
                    : "fill-yellow-500 text-yellow-500"
                }
              />
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-100 border border-gray-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && <p className="text-gray-400">Thinking...</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-gray-700 bg-black/40">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.prompt)}
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-indigo-300 rounded-xl"
              >
                <prompt.icon size={18} />
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input + Footer */}
      <div className="border-t border-gray  -700 bg-black/60 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about careers or your future..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading || ollamaStatus === "error"}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || ollamaStatus === "error"}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Dummy phone number */}
        <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          <Phone size={14} /> For professional counseling call:
          <span className="text-indigo-400 font-semibold"> +91 90000 00000</span>
        </p>
      </div>
    </div>
  );
}
