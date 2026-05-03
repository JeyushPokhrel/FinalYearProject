import SignInPopUp from "../pop-up/SignInPopUp"
import LogoutPopUp from "../pop-up/LogoutPopUp"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScaleBalanced, faSun, faMoon, faGlobe } from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const [showSignIn, setShowSignIn] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ne' : 'en');
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn")

    if (loggedIn === "true") {
      setIsLoggedIn(true)
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")

    setIsLoggedIn(false)
    setShowLogout(false)
    toast.success("Successful logout")
  }

  return (
    <>
      <nav className="bg-gray-100 dark:bg-[#302623] px-6 py-3 rounded-lg m-4 shadow-md transition-colors duration-300">

        <div className="flex items-center justify-between">

          {/* LEFT */}
          <ul className="flex items-center gap-8 text-gray-800 dark:text-[#fefbf8]">

              <Link
    to="/"
    className="flex items-center gap-3"
  >
    <FontAwesomeIcon
      icon={faScaleBalanced}
      className="text-blue-600 dark:text-[#c2a878] text-3xl transition-colors duration-300"
    />

    <h1 className="text-2xl font-bold hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300">
      {t('app_name')}
    </h1>
  </Link>

            <Link
              to="/"
              className="hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300"
            >
              {t('dashboard')}
            </Link>

            <Link
              to="/chatbot"
              className="hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300"
            >
              {t('chatbot')}
            </Link>

            <Link
              to="/law-explorer"
              className="hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300"
            >
              {t('law_explorer')}
            </Link>

            <Link
              to="/documents"
              className="hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300"
            >
              {t('documents')}
            </Link>

          </ul>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="text-gray-800 dark:text-white flex items-center gap-2 hover:text-blue-600 dark:hover:text-[#c2a878] transition-colors duration-300">
              <FontAwesomeIcon icon={faGlobe} />
              {i18n.language === 'en' ? 'NE' : 'EN'}
            </button>
            <button onClick={toggleTheme} className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-[#c2a878] transition-colors duration-300">
              <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} className="text-xl" />
            </button>
            {!isLoggedIn ? (
              <button
                className="bg-blue-600 dark:bg-[#c69f6f] text-white dark:text-[#302623] px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-[#ebddcd] transition-colors duration-300"
                onClick={() => setShowSignIn(true)}
              >
                {t('sign_in')}
              </button>
            ) : (
              <button
                onClick={() => setShowLogout(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
              >
                {t('logout')}
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* SIGNIN POPUP */}
    {showSignIn && (
  <SignInPopUp
    onClose={() => {
      setShowSignIn(false)

      const loggedIn = localStorage.getItem("isLoggedIn")

      if (loggedIn === "true") {
        setIsLoggedIn(true)
      }
    }}
  />
)}

      {/* LOGOUT POPUP */}
      {showLogout && (
        <LogoutPopUp
          onClose={() => setShowLogout(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}

export default Navbar