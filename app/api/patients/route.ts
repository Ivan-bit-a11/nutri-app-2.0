import { NextResponse } from "next/server"
import { listPatients } from "@/server/services/patients.service"
import { AppError, toActionError } from "@/server/core/errors"

function statusFromError(error: unknown): number {
  if (error instanceof AppError) return error.status
  return 500
}

export async function GET() {
  try {
    const patients = await listPatients()
    return NextResponse.json({ success: true, data: patients })
  } catch (error) {
    const actionError = toActionError(error)
    return NextResponse.json(
      { success: false, error: actionError },
      { status: statusFromError(error) },
    )
  }
}
