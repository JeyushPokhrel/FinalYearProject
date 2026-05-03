
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
        <Route path="/lawexplorer" element={<LawExplorerPage/>} /> {/* Alias for convenience */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="*" element={<HomePage />} /> {/* Catch-all redirect to home */}

      </Routes>
    </div>
  )
}

export default AppRoutes


