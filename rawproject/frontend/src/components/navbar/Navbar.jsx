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
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("user")
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ne' : 'en');
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn")
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    if (loggedIn === "true") {
      setIsLoggedIn(true)
      setUserRole(user.role || "user")
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    setIsLoggedIn(false)
    setUserRole("user")
    setShowLogout(false)
    toast.success("Successful logout")
  }

  const handleDashboardClick = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      if (userRole === "admin") {
        window.location.href = "/admin";
      } else {
        toast.error("Access denied. Admin privileges required.");
      }
    } else {
      setShowAdminPrompt(true);
    }
  };

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

            {(userRole === "admin" || !isLoggedIn) && (
              <Link
                to="/admin"
                onClick={handleDashboardClick}
                className="hover:text-blue-800 dark:hover:text-[#c69f6f] transition-colors duration-300"
              >
                {t('dashboard')}
              </Link>
            )}

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
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      if (loggedIn === "true") {
        setIsLoggedIn(true)
        setUserRole(user.role || "user")

        // Automatically redirect admin to dashboard on login
        if (user.role === "admin") {
          window.location.href = "/admin";
        }
      }
    }}
  />
)}

      {/* ADMIN PROMPT */}
      {showAdminPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-[#1b1b1b] p-8 rounded-2xl shadow-2xl w-[400px] border border-gray-200 dark:border-[#2a2a2a] text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Are you the admin?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">This section is reserved for administrative tasks only.</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowAdminPrompt(false)}
                className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                No, Go Back
              </button>
              <button 
                onClick={() => {
                  setShowAdminPrompt(false);
                  setShowSignIn(true);
                }}
                className="px-6 py-2 rounded-xl bg-blue-600 dark:bg-[#c2a878] text-white dark:text-[#302623] font-bold hover:opacity-90 transition"
              >
                Yes, Login
              </button>
            </div>
          </div>
        </div>
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