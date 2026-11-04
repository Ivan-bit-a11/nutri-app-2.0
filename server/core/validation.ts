import { ZodError, type ZodType } from "zod"
import { validationError } from "@/server/core/errors"

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw validationError("Validation failed", error.flatten())
    }

    throw error
  }
}

export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries())
}
