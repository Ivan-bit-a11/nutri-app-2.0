import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPatients } from "@/lib/actions/patients"
import { PatientsTable } from "@/components/patients-table"

export default async function PatientsPage() {
  const patients = await getPatients()
  const activeCount = patients.filter((p) => p.status === "active").length

  return (
    <div className="page-shell page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle mt-0.5">
            {patients.length} pacientes registados — {activeCount} ativos
          </p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button size="sm" className="h-9 w-full gap-1.5 sm:w-auto">
            <PlusCircle className="h-3.5 w-3.5" />
            Novo paciente
          </Button>
        </Link>
      </div>

      <PatientsTable patients={patients} />
    </div>
  )
}
