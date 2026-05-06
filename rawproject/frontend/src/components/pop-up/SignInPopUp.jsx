import { useState } from "react"
import axios from "axios"
import SignUpPopUp from "./SignUpPopUp"
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import API_BASE_URL from "../../api";

const SignInPopUp = ({ onClose}) => {
  const { t } = useTranslation();
  const [showSignUp, setShowSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (showSignUp) {
    return <SignUpPopUp onClose={onClose}
      switchToSignIn={() => setShowSignUp(false)}
    />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")

    const email = e.target.email.value
    const password = e.target.password.value

    try {
      setLoading(true)

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email,
          password,
        }
      )

      console.log(response.data)

      // Save login state
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      localStorage.setItem("isLoggedIn", "true")

      toast.success("Successful signIn")
      onClose();

    } catch (err) {

      console.log(err.response?.data)

      setError(
        err.response?.data?.message || "Login failed"
      )

    } finally {

      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">

      <div className="bg-white dark:bg-[#1b1b1b] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl shadow-2xl p-6 w-[380px] relative transition-colors duration-300">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-white text-xl transition"
        >
          ✕
        </button>

        {/* TITLE */}

        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-[#c2a878]">
          {t('sign_in_title')}
        </h2>

        {/* ERROR */}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
        >

          {/* EMAIL */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              {t('email')}
            </label>

            <input
              type="email"
              name="email"
              placeholder={t('enter_email')}
              className="w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-[#3a3a3a] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] focus:border-blue-600 dark:focus:border-[#c69f6f] outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              required
            />

          </div>

          {/* PASSWORD */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              {t('password')}
            </label>

            <input
              type="password"
              name="password"
              placeholder={t('enter_password')}
              className="w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-[#3a3a3a] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] focus:border-blue-600 dark:focus:border-[#c69f6f] outline-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              required
            />

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 dark:bg-[#c69f6f] text-white dark:text-black font-semibold px-4 py-3 rounded-xl hover:bg-blue-700 dark:hover:bg-[#d8b07d] transition disabled:opacity-50"
          >
            {loading ? t('signing_in') : t('sign_in_title')}
          </button>

          {/* SIGNUP */}

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">

            {t('no_account')}{" "}

            <button
              type="button"
              className="text-blue-600 dark:text-[#c69f6f] hover:underline cursor-pointer"
              onClick={() => setShowSignUp(true)}
            >
              {t('sign_up_link')}
            </button>

          </p>

        </form>

      </div>
    </div>
  )
}

export default SignInPopUp
