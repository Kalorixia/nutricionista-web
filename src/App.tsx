import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { ConfirmProvider } from "@/components/common/ConfirmDialog"
import RequireAuth from "@/routes/RequireAuth"
import RequireApprovedNutritionist from "@/routes/RequireApprovedNutritionist"
import ProLayout from "@/components/modules/layout/ProLayout"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import VerifyEmail from "@/pages/VerifyEmail"
import Pending from "@/pages/Pending"
import NotFound from "@/pages/NotFound"
import Dashboard from "@/pages/Dashboard"
import Patients from "@/pages/Patients"
import PatientDetail from "@/pages/PatientDetail"
import Planning from "@/pages/Planning"
import PlanEditor from "@/pages/PlanEditor"
import Recipes from "@/pages/Recipes"
import RecipeDetail from "@/pages/RecipeDetail"
import Lists from "@/pages/Lists"
import ListDetail from "@/pages/ListDetail"
import Premium from "@/pages/Premium"
import Account from "@/pages/Account"

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} richColors />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />

            <Route element={<RequireAuth />}>
              <Route path="/pendiente" element={<Pending />} />

              <Route element={<RequireApprovedNutritionist />}>
                <Route element={<ProLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="pacientes" element={<Patients />} />
                  <Route path="pacientes/:id" element={<PatientDetail />} />
                  <Route path="planificacion" element={<Planning />} />
                  <Route path="planificacion/:id" element={<PlanEditor />} />
                  <Route path="recetas" element={<Recipes />} />
                  <Route path="recetas/:id" element={<RecipeDetail />} />
                  <Route path="listas" element={<Lists />} />
                  <Route path="listas/:id" element={<ListDetail />} />
                  <Route path="suscripcion" element={<Premium />} />
                  <Route path="cuenta" element={<Account />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
