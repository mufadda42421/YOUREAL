export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Add at least one letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  return null;
}

export function validatePin(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "PIN must be exactly 4 digits.";
  return null;
}

/** Map Firebase Auth error codes to human messages. */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try signing in.";
    case "auth/weak-password":
      return "That password is too weak. Use at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For your security, please sign in again before doing this.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed before completing.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled for this Firebase project.";
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
      return "Firebase is misconfigured. Check your environment variables.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function storageErrorMessage(code: string | undefined): string {
  switch (code) {
    case "storage/unauthorized":
      return "You don't have permission to upload this file.";
    case "storage/quota-exceeded":
      return "Storage quota exceeded. Delete some files and try again.";
    case "storage/object-not-found":
      return "That file could not be found.";
    case "storage/retry-limit-exceeded":
      return "Upload kept failing. Check your connection and try again.";
    default:
      return "Upload failed. Please try again.";
  }
}
