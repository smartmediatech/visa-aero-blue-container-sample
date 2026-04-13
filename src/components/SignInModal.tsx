import { useState } from "react";
import { Form, Field, Button } from "@base-ui/react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SignInModal({ open, onClose, onSuccess }: SignInModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign in</h2>

        <Form
          errors={errors}
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setErrors({});
            setLoading(true);

            const formData = new FormData(event.currentTarget);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            try {
              await login({ email, password });
              onSuccess();
            } catch (err) {
              setErrors({
                password:
                  err instanceof Error ? err.message : "Login failed",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <Field.Root name="email" className="flex flex-col gap-1.5">
            <Field.Label className="text-sm font-medium text-gray-600">
              Email
            </Field.Label>
            <Field.Control
              type="email"
              required
              placeholder="you@example.com"
              disabled={loading}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a1f36]"
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
              type="password"
              required
              placeholder="Password"
              disabled={loading}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a1f36]"
            />
            <Field.Error className="text-sm text-red-600" />
          </Field.Root>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              className={clsx(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold",
                "bg-gray-100 text-gray-800 hover:bg-gray-200",
                "cursor-pointer",
              )}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={clsx(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold",
                "bg-[#1a1f36] text-white hover:bg-[#2a3050]",
                "cursor-pointer",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
