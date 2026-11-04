"use client"

import { useEffect, useState } from "react"
import { NewAppointmentForm } from "./new-appointment-form"

interface PatientRowDto {
  id: string
  name: string
}

interface PatientsApiSuccess {
  success: true
  data: PatientRowDto[]
}

interface PatientsApiFailure {
  success: false
  error?: { message?: string }
}

type PatientsApiResponse = PatientsApiSuccess | PatientsApiFailure

const FETCH_TIMEOUT_MS = 10000

export function NewAppointmentPageClient() {
  const [patients, setPatients] = useState<PatientRowDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const loadPatients = async () => {
      try {
        const response = await fetch("/api/patients", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        })

        const payload = (await response.json()) as PatientsApiResponse
        if (!response.ok || !payload.success) {
          setLoadError(payload.success ? null : payload.error?.message ?? "Nao foi possivel carregar pacientes.")
          return
        }

        setPatients(payload.data)
        setLoadError(null)
      } catch {
        setLoadError("Nao foi possivel carregar pacientes agora. Tente novamente em instantes.")
      } finally {
        clearTimeout(timeoutId)
      }
    }

    void loadPatients()

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return <NewAppointmentForm patients={patients} loadError={loadError} />
}
