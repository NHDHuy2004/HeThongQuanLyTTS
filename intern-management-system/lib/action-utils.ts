/**
 * Wraps a server action to return { success, error } instead of throwing.
 * Use with useActionState for user-friendly feedback.
 */
export type ActionResult = {
  success: boolean
  error?: string
}

export const OK: ActionResult = { success: true }

export function fail(message: string): ActionResult {
  return { success: false, error: message }
}
