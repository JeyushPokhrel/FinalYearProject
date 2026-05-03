import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useTranslation } from "react-i18next";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ChatSidebar from "../components/chatsidebar/ChatSidebar"
import SignInPopUp from "../components/pop-up/SignInPopUp"

const ChatbotPage = () => {

  const { t } = useTranslation();

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const [chatHistory, setChatHistory] = useState([])
  const [questionCount, setQuestionCount] = useState(0)
  const [showSignIn, setShowSignIn] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)

  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn")
      setIsLoggedIn(loggedIn === "true")
    }

    checkLoginStatus()
    window.addEventListener("storage", checkLoginStatus)
    const interval = setInterval(checkLoginStatus, 500)

    return () => {
      window.removeEventListener("storage", checkLoginStatus)
      clearInterval(interval)
    }
  }, []);

  // Load current messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("currentChatMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  // Save current messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("currentChatMessages", JSON.stringify(messages))
    } else {
      localStorage.removeItem("currentChatMessages")
    }
  }, [messages])

  // Fetch history from backend if logged in
  useEffect(() => {
    const fetchHistory = async () => {
      if (isLoggedIn) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get("https://finalyearproject-ian2.onrender.com/api/chat/history", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setChatHistory(response.data);
        } catch (error) {
          console.error("Error fetching history:", error);
          const savedHistory = localStorage.getItem("chatHistory")
          if (savedHistory) {
            setChatHistory(JSON.parse(savedHistory))
          }
        }
      } else {
        const savedHistory = localStorage.getItem("chatHistory")
        if (savedHistory) {
          setChatHistory(JSON.parse(savedHistory))
        }
      }
    }

    fetchHistory()
  }, [isLoggedIn])

  const handleAsk = async () => {
    if (!message.trim()) return

    if (!isLoggedIn && questionCount >= 3) {
      setShowSignIn(true)
      return
    }

    const userMessage = message;
    setMessage("")
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setSelectedHistoryId(null) // Clear selection when asking a new question

    try {
      setLoading(true)

      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "https://finalyearproject-ian2.onrender.com/api/chat",
        { message: userMessage },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : ""
          }
        }
      )

      const aiReply = response.data.reply
      const confidence = response.data.confidence !== undefined ? response.data.confidence + "%" : null
      
      setMessages(prev => [...prev, { role: 'ai', text: aiReply, confidence: confidence }])

      if (isLoggedIn) {
        const newChat = {
          question: userMessage,
          answer: aiReply,
          confidence: confidence,
          time: new Date().toLocaleTimeString(),
        }
        const updatedHistory = [newChat, ...chatHistory]
        setChatHistory(updatedHistory)
        localStorage.setItem("chatHistory", JSON.stringify(updatedHistory))
      }

      if (!isLoggedIn) {
        setQuestionCount(questionCount + 1)
      }

    } catch (error) {
      console.log(error)
      if (error.response?.data?.limitReached) {
        setShowSignIn(true)
        setMessages(prev => [...prev, { role: 'ai', text: error.response.data.message }])
      } else {
        // Show specific error from backend if available, else fallback to translation
        const errorText = error.response?.data?.message || t('error_msg') || "Something went wrong.";
        setMessages(prev => [...prev, { role: 'ai', text: errorText }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHistory = (chat) => {
    setMessages([
      { role: 'user', text: chat.question },
      { role: 'ai', text: chat.answer || chat.reply, confidence: chat.confidence }
    ])
    setSelectedHistoryId(chat._id || chat.time) // Use ID if available, else fallback
    setShowMobileSidebar(false) // Close sidebar on mobile after selection
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk()
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-[#1e1917] transition-colors duration-300 relative overflow-hidden">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* SIDEBAR */}
      {isLoggedIn && (
        <div className={`
          fixed md:relative 
          h-full z-50 md:z-auto
          transition-transform duration-300 
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          border-r border-gray-200 dark:border-[#4a3b35]
        `}>
           <ChatSidebar 
             history={chatHistory} 
             onSelect={handleSelectHistory} 
             selectedId={selectedHistoryId}
           />
        </div>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER AREA */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#4a3b35] flex items-center justify-between bg-white dark:bg-[#1e1917] shadow-sm z-10">
           <div className="flex items-center gap-4">
             {isLoggedIn && (
               <button 
                 onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                 className="md:hidden p-2 text-gray-600 dark:text-[#c69f6f] hover:bg-gray-100 dark:hover:bg-[#302623] rounded-lg transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                 </svg>
               </button>
             )}
             <h1 className="text-2xl font-bold text-blue-600 dark:text-[#c69f6f]">
               {t('chatbot')}
             </h1>
           </div>

           {messages.length > 0 && (
             <button 
               onClick={() => {
                 setMessages([]);
                 setSelectedHistoryId(null);
                 localStorage.removeItem("currentChatMessages");
               }}
               className="text-xs bg-gray-200 dark:bg-[#302623] px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-[#3d312d] transition-colors font-medium text-gray-700 dark:text-[#f5e6d3]"
             >
               {t('new_chat') || "+ New Chat"}
             </button>
           )}
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-[#1e1917]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-[#c69f6f] mb-4">
                {t('app_name')}
              </h1>
              <p className="text-gray-500 dark:text-[#f5e6d3] max-w-md">
                {t('ask_placeholder')}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 dark:bg-[#c69f6f] text-white dark:text-[#302623] rounded-br-none shadow-md font-medium' 
                    : 'bg-white dark:bg-[#302623] border border-gray-200 dark:border-[#5d4a42] text-gray-800 dark:text-[#f5e6d3] rounded-bl-none shadow-sm'
                }`}>
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'ai' && msg.confidence && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] opacity-60 flex justify-between items-center">
                      <span>Confidence: {msg.confidence}</span>
                      {parseFloat(msg.confidence) > 70 ? (
                        <span className="text-green-500 font-bold">● High</span>
                      ) : parseFloat(msg.confidence) > 40 ? (
                        <span className="text-yellow-500 font-bold">● Medium</span>
                      ) : (
                        <span className="text-red-500 font-bold">● Low</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-[#302623] border border-gray-200 dark:border-[#5d4a42] p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-600 dark:bg-[#c69f6f] rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-blue-600 dark:bg-[#c69f6f] rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                 <div className="w-2 h-2 bg-blue-600 dark:bg-[#c69f6f] rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-white dark:bg-[#1e1917] border-t border-gray-200 dark:border-[#4a3b35]">
          <div className="max-w-4xl mx-auto relative flex items-end bg-gray-100 dark:bg-[#302623] border border-gray-300 dark:border-[#5d4a42] rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-blue-600 dark:focus-within:ring-[#c69f6f] transition-all">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ask_placeholder')}
              className="w-full max-h-48 min-h-[56px] bg-transparent text-gray-900 dark:text-[#f5e6d3] placeholder-gray-500 dark:placeholder-gray-400 p-4 pr-16 outline-none resize-none"
              rows={1}
            />
            
            <button
              onClick={handleAsk}
              disabled={loading || !message.trim()}
              className="absolute right-2 bottom-2 bg-blue-600 dark:bg-[#c69f6f] text-white dark:text-[#302623] p-2 rounded-xl hover:bg-blue-700 dark:hover:bg-[#d6c0a5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
          
          {!isLoggedIn && (
            <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
              {t('free_questions_left')} {3 - questionCount}
            </p>
          )}
        </div>

      </div>

      {/* SIGN IN POPUP */}
      {showSignIn && (
        <SignInPopUp
          onClose={() => {
            setShowSignIn(false)
            const loggedIn = localStorage.getItem("isLoggedIn")
            if (loggedIn === "true") setIsLoggedIn(true)
          }}
        />
      )}
    </div>
  )
}

export default ChatbotPage;