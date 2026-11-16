import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, setDisclaimerRequiredHandler } from "@/services/http"
import { disclaimerService } from "@/services/disclaimer.service"
import type { Disclaimer } from "@/types/disclaimer"

type DisclaimerStatus = "loading" | "ready" | "error"

interface DisclaimerContextValue {
  disclaimer: Disclaimer | null
  status: DisclaimerStatus
  errorMessage: string | null
  reload: () => Promise<void>
  accept: (version: number) => Promise<void>
}

const DisclaimerContext = createContext<DisclaimerContextValue>({
  disclaimer: null,
  status: "loading",
  errorMessage: null,
  reload: async () => {},
  accept: async () => {},
})

interface LoadedState {
  /** Usuario para el que se cargó este estado. */
  userId: number
  disclaimer: Disclaimer | null
  status: "loading" | "ready" | "error"
  errorMessage: string | null
}

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const { user, isNutritionist } = useAuth()
  const userId = isNutritionist && user ? user.id_usuario : null
  const [state, setState] = useState<LoadedState | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const userIdRef = useRef<number | null>(userId)

  const load = useCallback((id: number): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current
    setState({
      userId: id,
      disclaimer: null,
      status: "loading",
      errorMessage: null,
    })
    const promise = disclaimerService
      .obtener()
      .then((disclaimer) => {
        if (userIdRef.current !== id) return
        setState({
          userId: id,
          disclaimer,
          status: "ready",
          errorMessage: null,
        })
      })
      .catch((error: unknown) => {
        if (userIdRef.current !== id) return
        // Fail-closed: cualquier error, incluido el 404, deja afuera.
        setState({
          userId: id,
          disclaimer: null,
          status: "error",
          errorMessage:
            error instanceof ApiError || error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado",
        })
      })
      .finally(() => {
        if (inFlightRef.current === promise) inFlightRef.current = null
      })
    inFlightRef.current = promise
    return promise
  }, [])

  // Se re-dispara por id de usuario, no por la identidad del objeto `user`.
  useEffect(() => {
    userIdRef.current = userId
    inFlightRef.current = null
    if (userId === null) {
      // Sin usuario no queda nada del anterior (un relogin del mismo id no
      // tiene que ver un estado viejo mientras llega el GET).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(null)
      setDisclaimerRequiredHandler(null)
      return
    }
    void load(userId)
    setDisclaimerRequiredHandler(() => {
      void load(userId)
    })
    return () => {
      setDisclaimerRequiredHandler(null)
    }
  }, [userId, load])

  const reload = useCallback(async () => {
    if (userIdRef.current === null) return
    await load(userIdRef.current)
  }, [load])

  const accept = useCallback(
    async (version: number) => {
      const id = userIdRef.current
      try {
        const accepted = await disclaimerService.aceptar(version)
        if (id === null || userIdRef.current !== id) return
        setState({
          userId: id,
          disclaimer: accepted,
          status: "ready",
          errorMessage: null,
        })
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          await reload()
        }
        throw error
      }
    },
    [reload]
  )

  // Nunca se expone el estado de otro usuario ni antes del primer GET.
  const current = state && state.userId === userId ? state : null
  const value = useMemo<DisclaimerContextValue>(
    () => ({
      disclaimer: current?.disclaimer ?? null,
      status: current?.status ?? "loading",
      errorMessage: current?.errorMessage ?? null,
      reload,
      accept,
    }),
    [current, reload, accept]
  )

  return (
    <DisclaimerContext.Provider value={value}>
      {children}
    </DisclaimerContext.Provider>
  )
}

export const useDisclaimer = () => useContext(DisclaimerContext)
