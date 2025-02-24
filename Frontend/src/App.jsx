/* eslint-disable react/prop-types */
import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { useEffect } from "react"


import { useAuthStore } from "./store/authStore.js"
import LoadingSpinner from "./components/LoadingSpinner.jsx"
import FloatingShape from "./components/FloatingShape"
import LoginPage from "./pages/LoginPage.jsx"
import SignUpPage from "./pages/SignUpPage.jsx"
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx"
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx"

//protect routes that require authentication
const ProtctedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if(!isAuthenticated) {
    return <Navigate to = "/login" replace/>;
  }
  if(!user.isVerified) {
    return <Navigate to="/verify-email" replace/>;
  }
  return children;
}

//redirect authenticated users to the Home Page
const RedirectAuthenticatedUser = ({children}) => {
  const { isAuthenticated, user } = useAuthStore();

  if(isAuthenticated && user.isVerified) {
    return <Navigate to="/" replace/>;
  }
  return children;
}


function App() {
  const { isCheckingAuth, checkAuth, isAuthenticated, user} = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if(isCheckingAuth) return <LoadingSpinner/>
  console.log("isAuthenticated ", isAuthenticated);
  console.log("User ", user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900
    flex items-center justify-center relative overflow-hidden">
      <FloatingShape color="bg-green-500" size="w-64 h-64" top="5%" left="10%" delay={0}/>
      <FloatingShape color="bg-emarald-500" size="w-48 h-48" top="70%" left="80%" delay={5}/>
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2}/>

      <Routes>
        <Route path="/" element={<ProtctedRoute>
          <DashboardPage/>
        </ProtctedRoute>} />
        <Route path="/signup" element={<RedirectAuthenticatedUser>
          <SignUpPage/>
        </RedirectAuthenticatedUser>} />
        <Route path="/login" element={<RedirectAuthenticatedUser>
          <LoginPage/>
        </RedirectAuthenticatedUser>} />
        <Route path="/verify-email" element={<EmailVerificationPage/>}/>
        <Route path="/forgot-password" element={<RedirectAuthenticatedUser>
          <ForgotPasswordPage/>
        </RedirectAuthenticatedUser>}/>
        <Route path="/reset-password/:token" element={<RedirectAuthenticatedUser>
          <ResetPasswordPage/>
        </RedirectAuthenticatedUser>}></Route>
          {/* catch all routes */}
        <Route path="*" element={<Navigate to="/" replace/>}></Route>
      </Routes>
      <Toaster/>
    </div>  
  ) 
} 
 
export default App 
 