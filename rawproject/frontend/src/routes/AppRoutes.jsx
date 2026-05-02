
import { Routes, Route } from "react-router-dom"
import HomePage from "../pages/HomePage"
import ChatbotPage from "../pages/ChatbotPage"
import LawExplorerPage from "../pages/LawExplorer"
import DocumentsPage from "../pages/DocumentPage"  


const AppRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/law-explorer" element={<LawExplorerPage/>} />
        <Route path="/documents" element={<DocumentsPage />} />

      </Routes>
    </div>
  )
}

export default AppRoutes


