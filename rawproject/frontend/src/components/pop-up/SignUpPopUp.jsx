import { useState } from "react"
import axios from "axios"
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import API_BASE_URL from "../../api";

const SignUpPopUp = ({ onClose, switchToSignIn }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")

    if (password !== confirmPassword) {
      setError(t('passwords_no_match'))
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          name,
          email,
          password,
          confirmPassword,
        }
      )

      console.log(response.data)

      toast.success("Registration successful! Please sign in.")
      switchToSignIn()

    } catch (err) {

      setError(
        err.response?.data?.message || "Registration failed"
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

      <div className="bg-white dark:bg-[#1b1b1b] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-lg p-6 w-[350px] relative transition-colors duration-300">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white text-xl transition-colors"
        >
          ✕
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-semibold mb-4 text-center text-blue-600 dark:text-[#c2a878]">
          {t('sign_up_title')}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm px-3 py-2 rounded-md mb-3">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >

          {/* NAME */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t('name')}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('enter_name')}
              className="w-full border border-gray-300 dark:border-[#3a3a3a] rounded-md px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] outline-none transition-colors"
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t('email')}
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enter_email')}
              className="w-full border border-gray-300 dark:border-[#3a3a3a] rounded-md px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] outline-none transition-colors"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t('password')}
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enter_password')}
              className="w-full border border-gray-300 dark:border-[#3a3a3a] rounded-md px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] outline-none transition-colors"
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              {t('confirm_password')}
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder={t('confirm_password')}
              className="w-full border border-gray-300 dark:border-[#3a3a3a] rounded-md px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#c69f6f] outline-none transition-colors"
              required
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 dark:bg-[#c69f6f] text-white dark:text-[#302623] px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-[#ebddcd] transition-colors disabled:opacity-50"
          >
            {loading ? t('signing_up') : t('sign_up_title')}
          </button>

        </form>
      </div>
    </div>
  )
}

export default SignUpPopUp