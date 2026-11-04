import { getPatients } from "@/lib/actions/patients"
import { NewAssessmentForm } from "./new-assessment-form"

export default async function NewAssessmentPage() {
  const patients = await getPatients()
  return <NewAssessmentForm patients={patients} />
}
