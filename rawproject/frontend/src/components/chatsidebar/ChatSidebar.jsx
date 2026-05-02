import { useTranslation } from "react-i18next";

const ChatSidebar = ({ history, onSelect, selectedId }) => {
  const { t } = useTranslation();

  // =========================================
  // CLEAR HISTORY
  // =========================================

  const clearHistory = () => {
    localStorage.removeItem("chatHistory")
    window.location.reload()
  }

  return (

    <div className="
      w-[320px]
      h-full
      bg-gray-100
      dark:bg-[#302623]
      text-gray-900
      dark:text-white
      p-5
      overflow-y-auto
      border-r
      border-gray-300
      dark:border-[#4a3b35]
      transition-colors
      duration-300
    ">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold text-blue-600 dark:text-[#c69f6f]">
          {t('history')}
        </h2>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="
              text-sm
              bg-red-500
              text-white
              px-3
              py-1
              rounded-md
              hover:bg-red-600
              transition-colors
            "
          >
            {t('clear')}
          </button>
        )}

      </div>

      {/* EMPTY */}
      {history.length === 0 ? (

        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {t('no_history')}
        </p>

      ) : (

        <div className="space-y-4">

          {history.map((chat, index) => {
            const isSelected = selectedId === (chat._id || chat.time);
            
            return (
              <div
                key={index}
                onClick={() => onSelect(chat)}
                className={`
                  p-4
                  rounded-xl
                  border
                  transition-all
                  duration-300
                  cursor-pointer
                  hover:shadow-md
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  ${isSelected 
                    ? 'bg-blue-50 dark:bg-[#4a3b35] border-blue-400 dark:border-[#c69f6f] shadow-sm' 
                    : 'bg-white dark:bg-[#3d312d] border-gray-200 dark:border-[#5d4a42] hover:border-blue-300 dark:hover:border-[#c69f6f]'
                  }
                `}
              >

                {/* QUESTION */}
                <p className={`
                  font-semibold
                  line-clamp-2
                  ${isSelected ? 'text-blue-600 dark:text-[#c69f6f]' : 'text-gray-900 dark:text-[#f5e6d3]'}
                `}>
                  {chat.question}
                </p>

                {/* CONFIDENCE + TIME */}
                <div className="
                  mt-3
                  flex
                  items-center
                  justify-between
                ">

                  <span className={`text-xs ${isSelected ? 'text-blue-500/80 dark:text-[#d6c0a5]' : 'text-gray-600 dark:text-[#d6c0a5]'}`}>
                    {t('confidence')} {chat.confidence}
                  </span>

                  <span className={`text-xs ${isSelected ? 'text-blue-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {chat.time || (chat.timestamp && new Date(chat.timestamp).toLocaleTimeString())}
                  </span>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  )
}

export default ChatSidebar