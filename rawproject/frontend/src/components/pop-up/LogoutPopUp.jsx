import { useTranslation } from "react-i18next";

const LogoutPopUp = ({ onClose, onLogout }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

      
      <div className="bg-white dark:bg-[#1b1b1b] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-lg p-6 w-[320px] relative transition-colors duration-300">

        
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-center text-blue-600 dark:text-[#c2a878] mb-4">
          {t('logout')}
        </h2>

        <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
          {t('logout_confirm')}
        </p>

        <div className="flex justify-center gap-4">

           
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-[#c69f6f] text-gray-700 dark:text-[#c69f6f] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            {t('cancel')}
          </button>

           
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            {t('yes_logout')}
          </button>

        </div>

      </div>
    </div>
  )
}

export default LogoutPopUp