/**
 * Form validation tests
 */

import { describe, it, expect } from "vitest";
import { useForm, v } from "./forms.js";

describe("Form Validation", () => {
  it("validates required fields", async () => {
    const form = useForm({
      schema: {
        email: v.string().required(),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().email).toContain("email is required");
  });

  it("validates email format", async () => {
    const form = useForm({
      schema: {
        email: v.email(),
      },
      initialValues: { email: "not-an-email" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().email).toContain("Invalid email address");
  });

  it("validates number min/max", async () => {
    const form = useForm({
      schema: {
        age: v.number().min(18, "Must be 18+").max(100, "Must be under 100"),
      },
      initialValues: { age: 15 },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().age).toContain("Must be 18+");
  });

  it("validates string min/max length", async () => {
    const form = useForm({
      schema: {
        username: v.string().min(3, "Too short").max(20, "Too long"),
      },
      initialValues: { username: "ab" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().username).toContain("Too short");
  });

  it("validates URL format", async () => {
    const form = useForm({
      schema: {
        website: v.url("Invalid URL"),
      },
      initialValues: { website: "not a url" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().website).toContain("Invalid URL");
  });

  it("validates with custom rules", async () => {
    const form = useForm({
      schema: {
        password: v.string().custom({
          validate: (val) => /[A-Z]/.test(val),
          message: "Must contain uppercase letter",
        }),
      },
      initialValues: { password: "lowercase" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().password).toContain("Must contain uppercase letter");
  });

  it("passes validation with correct values", async () => {
    const form = useForm({
      schema: {
        email: v.email().required("Required"),
        age: v.number().min(18),
      },
      initialValues: {
        email: "test@example.com",
        age: 25,
      },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(true);
    expect(Object.keys(form.errors())).toHaveLength(0);
  });

  it("transforms values correctly", async () => {
    const form = useForm({
      schema: {
        age: v.number(),
        accepted: v.boolean(),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    // Simulate number input
    form.setValue("age", "25" as any);
    expect(form.values().age).toBe(25);

    // Simulate checkbox
    form.setValue("accepted", "on" as any);
    expect(form.values().accepted).toBe(true);
  });

  it("tracks touched state", () => {
    const form = useForm({
      schema: {
        email: v.string(),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    expect(form.touched().email).toBeFalsy();

    form.setTouched("email", true);
    expect(form.touched().email).toBe(true);
  });

  it("tracks dirty state", () => {
    const form = useForm({
      schema: {
        name: v.string(),
      },
      initialValues: { name: "" },
      onSubmit: async () => {},
    });

    expect(form.dirty().name).toBeFalsy();

    form.setValue("name", "John");
    expect(form.dirty().name).toBe(true);
  });

  it("validates on change when enabled", async () => {
    const form = useForm({
      schema: {
        email: v.email("Invalid email"),
      },
      initialValues: { email: "" },
      validateOnChange: true,
      onSubmit: async () => {},
    });

    form.setValue("email", "not-email");

    // Small delay for async validation
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(form.errors().email).toBeDefined();
  });

  it("resets form state", () => {
    const form = useForm({
      schema: {
        email: v.string(),
      },
      initialValues: { email: "test@example.com" },
      onSubmit: async () => {},
    });

    form.setValue("email", "changed@example.com");
    form.setTouched("email", true);

    form.reset();

    expect(form.values().email).toBe("test@example.com");
    expect(form.touched().email).toBeFalsy();
    expect(form.dirty().email).toBeFalsy();
  });

  it("handles form submission", async () => {
    let submitted = false;
    const form = useForm({
      schema: {
        email: v.email().required(),
      },
      initialValues: { email: "test@example.com" },
      onSubmit: async (values) => {
        submitted = true;
        expect(values.email).toBe("test@example.com");
      },
    });

    await form.handleSubmit();
    expect(submitted).toBe(true);
  });

  it("prevents submission when invalid", async () => {
    let submitted = false;
    const form = useForm({
      schema: {
        email: v.email().required(),
      },
      initialValues: { email: "invalid" },
      onSubmit: async () => {
        submitted = true;
      },
    });

    await form.handleSubmit();
    expect(submitted).toBe(false);
    expect(form.errors().email).toBeDefined();
  });

  it("uses default values from schema", () => {
    const form = useForm({
      schema: {
        country: v.string().default("US"),
        notifications: v.boolean().default(true),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    expect(form.values().country).toBe("US");
    expect(form.values().notifications).toBe(true);
  });

  it("supports async validation", async () => {
    const form = useForm({
      schema: {
        username: v.string().custom({
          validate: async (val) => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 10));
            return val !== "taken";
          },
          message: "Username already taken",
        }),
      },
      initialValues: { username: "taken" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().username).toContain("Username already taken");
  });

  it("clears specific field error", async () => {
    const form = useForm({
      schema: {
        email: v.email().required(),
      },
      initialValues: { email: "" },
      onSubmit: async () => {},
    });

    await form.validate();
    expect(form.errors().email).toBeDefined();

    form.clearError("email");
    expect(form.errors().email).toBeUndefined();
  });

  it("sets custom error message", () => {
    const form = useForm({
      schema: {
        password: v.string(),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    form.setError("password", "Password compromised");
    expect(form.errors().password).toContain("Password compromised");
    expect(form.isValid()).toBe(false);
  });

  it("handles pattern validation", async () => {
    const form = useForm({
      schema: {
        zipCode: v.string().pattern(/^\d{5}$/, "Must be 5 digits"),
      },
      initialValues: { zipCode: "123" },
      onSubmit: async () => {},
    });

    const isValid = await form.validate();
    expect(isValid).toBe(false);
    expect(form.errors().zipCode).toContain("Must be 5 digits");
  });

  it("validates date transformation", () => {
    const form = useForm({
      schema: {
        birthDate: v.date(),
      },
      initialValues: {},
      onSubmit: async () => {},
    });

    form.setValue("birthDate", "2000-01-01" as any);
    expect(form.values().birthDate).toBeInstanceOf(Date);
  });
});
