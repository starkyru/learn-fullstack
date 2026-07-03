import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";

/**
 * Collapse a zod error into a `{ field -> first message }` map — the shape a
 * controlled form needs to render one message under each input.
 */
export function zodFieldErrors(
  schema: z.ZodTypeAny,
  values: unknown,
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

// --- WORKED EXAMPLE: a controlled login form validated by a zod schema. ---

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ onSubmit }: { onSubmit: (values: LoginValues) => void }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = zodFieldErrors(loginSchema, values);
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(loginSchema.parse(values));
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Log in">
      <label htmlFor="login-email">Email</label>
      <input id="login-email" name="email" value={values.email} onChange={set("email")} />
      {errors.email && <p role="alert">{errors.email}</p>}

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        name="password"
        type="password"
        value={values.password}
        onChange={set("password")}
      />
      {errors.password && <p role="alert">{errors.password}</p>}

      <button type="submit">Log in</button>
    </form>
  );
}

// --- ANALOG (learner builds this in src/): a signup form with confirm-password. ---

export const signupSchema = loginSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
export type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm({ onSubmit }: { onSubmit: (values: SignupValues) => void }) {
  const [values, setValues] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = zodFieldErrors(signupSchema, values);
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(signupSchema.parse(values));
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Sign up">
      <label htmlFor="signup-email">Email</label>
      <input
        id="signup-email"
        name="email"
        value={values.email}
        onChange={set("email")}
      />
      {errors.email && <p role="alert">{errors.email}</p>}

      <label htmlFor="signup-password">Password</label>
      <input
        id="signup-password"
        name="password"
        type="password"
        value={values.password}
        onChange={set("password")}
      />
      {errors.password && <p role="alert">{errors.password}</p>}

      <label htmlFor="signup-confirm">Confirm password</label>
      <input
        id="signup-confirm"
        name="confirmPassword"
        type="password"
        value={values.confirmPassword}
        onChange={set("confirmPassword")}
      />
      {errors.confirmPassword && <p role="alert">{errors.confirmPassword}</p>}

      <button type="submit">Sign up</button>
    </form>
  );
}
