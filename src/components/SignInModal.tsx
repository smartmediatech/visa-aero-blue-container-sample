import { useRef, useState } from "react";
import { Form, Field, Button, Dialog } from "@base-ui/react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SignInModal({ onClose, onSuccess }: SignInModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const errorMessage = errors.password ?? "";

  return (
    <Dialog.Root
      open
      modal
      disablePointerDismissal={loading}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[10000] bg-black/50 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Viewport className="fixed inset-0 z-[10001] flex min-h-full items-center overflow-y-auto overscroll-contain p-4 sm:p-6">
          <Dialog.Popup
            initialFocus={emailInputRef}
            className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-2xl sm:p-10"
          >
            <Dialog.Title className="mb-6 text-2xl font-bold text-gray-800">
              Sign in
            </Dialog.Title>
            <p className="sr-only" aria-live="polite">
              {loading ? "Signing in…" : errorMessage}
            </p>

            <Form<{ email: string; password: string }>
              errors={errors}
              className="flex flex-col gap-4"
              onFormSubmit={async ({ email, password }) => {
                setErrors({});
                setLoading(true);

                try {
                  await login({ email, password });
                  onSuccess();
                } catch (err) {
                  setErrors({
                    password:
                      err instanceof Error ? err.message : "Login failed",
                  });
                  passwordInputRef.current?.focus();
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Field.Root name="email" className="flex flex-col gap-1.5">
                <Field.Label className="text-sm font-medium text-gray-600">
                  Email address
                </Field.Label>
                <Field.Control
                  ref={emailInputRef}
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="you@example.com…"
                  disabled={loading}
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus-visible:border-[#1a1f36]"
                  onBlur={(e) => {
                    e.currentTarget.value = e.currentTarget.value.trim();
                  }}
                />
                <Field.Error className="text-sm text-red-600" />
              </Field.Root>

              <Field.Root name="password" className="flex flex-col gap-1.5">
                <Field.Label className="text-sm font-medium text-gray-600">
                  Password
                </Field.Label>
                <Field.Control
                  ref={passwordInputRef}
                  type="password"
                  required
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="Enter your password…"
                  disabled={loading}
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus-visible:border-[#1a1f36]"
                />
                <Field.Error className="text-sm text-red-600" />
              </Field.Root>

              <div className="mt-2 flex gap-3">
                <Dialog.Close
                  className={clsx(
                    "flex-1 py-2.5 rounded-lg text-sm font-semibold",
                    "bg-gray-100 text-gray-800 hover:bg-gray-200",
                    "cursor-pointer",
                    "touch-manipulation",
                    "focus-visible:ring-2 focus-visible:ring-[#1a1f36] focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                  disabled={loading}
                >
                  Cancel
                </Dialog.Close>
                <Button
                  type="submit"
                  className={clsx(
                    "flex-1 py-2.5 rounded-lg text-sm font-semibold",
                    "bg-[#1a1f36] text-white hover:bg-[#2a3050]",
                    "cursor-pointer",
                    "touch-manipulation",
                    "focus-visible:ring-2 focus-visible:ring-[#1a1f36] focus-visible:ring-offset-2",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  )}
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </div>
            </Form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
