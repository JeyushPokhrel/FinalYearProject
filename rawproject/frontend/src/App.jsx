import Navbar from "./components/navbar/Navbar"
import AppRoutes from "./routes/AppRoutes"
import { Toaster } from "react-hot-toast"

const App = () => {
  return (
    <div >
     <Navbar />
    <AppRoutes /> 
    <Toaster position="top-center" reverseOrder={false} />
    </div>
  )
}

export default App
