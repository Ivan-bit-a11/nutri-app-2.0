import { getPatients } from "@/lib/actions/patients"
import { getTemplatesForDietPlanCreation } from "@/lib/actions/templates"
import { NewDietPlanForm } from "./new-diet-plan-form"

export default async function NewDietPlanPage() {
  const [patients, templates] = await Promise.all([
    getPatients(),
    getTemplatesForDietPlanCreation(),
  ])

  return <NewDietPlanForm patients={patients} templates={templates} />
}
