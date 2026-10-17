import { z } from "zod";

export const emailField = z.email("Enter a valid email address.");

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const phoneField = z.string().regex(/^\d{10}$/, "Enter a 10 digit mobile number.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export const patientRegisterSchema = z.object({
  full_name: z.string().min(2, "Enter the full name."),
  email: emailField,
  password: passwordField,
  date_of_birth: z
    .string()
    .min(1, "Enter the date of birth.")
    .refine((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date < new Date();
    }, "Enter a valid date in the past."),
  phone: phoneField,
  blood_group: z.string().min(1, "Select a blood group."),
  allergies: z.string().max(500, "Keep allergies under 500 characters."),
  emergency_contact_name: z.string().min(2, "Enter the emergency contact name."),
  emergency_contact_phone: phoneField,
});

export const doctorRegisterSchema = z.object({
  full_name: z.string().min(2, "Enter the full name."),
  email: emailField,
  password: passwordField,
  license_number: z.string().min(3, "Enter the medical license number."),
  specialty: z.string().min(1, "Select a specialty."),
  hospital_name: z.string().min(2, "Enter the hospital or clinic name."),
});

export const patientProfileSchema = z.object({
  full_name: z.string().min(2, "Enter the full name."),
  date_of_birth: z.string().min(1, "Enter the date of birth."),
  phone: phoneField,
  blood_group: z.string().min(1, "Select a blood group."),
  allergies: z.string().max(500, "Keep allergies under 500 characters."),
  emergency_contact_name: z.string().min(2, "Enter the emergency contact name."),
  emergency_contact_phone: phoneField,
});

export const visitMedicationSchema = z.object({
  name: z.string().min(1, "Enter the medication name."),
  dose: z.string().min(1, "Enter the dose."),
  frequency: z.string().min(1, "Enter the frequency."),
  duration: z.string(),
  status: z.enum(["current", "past"]),
});

export const visitSchema = z.object({
  visit_date: z.string().min(1, "Enter the visit date."),
  hospital_name: z.string().min(2, "Enter the hospital or clinic."),
  diagnosis: z.string().min(2, "Enter the diagnosis."),
  medications: z.array(visitMedicationSchema),
  remarks: z.string().max(2000, "Keep remarks under 2000 characters."),
  follow_up_date: z.string(),
});

export const reviewMedicationSchema = z.object({
  name: z.string(),
  dose: z.string(),
  frequency: z.string(),
});

export const reviewKeyValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string(),
});

export const reviewRecordSchema = z.object({
  title: z.string().min(2, "Enter a title."),
  type: z.string().min(1, "Select a record type."),
  hospital_name: z.string().min(1, "Enter the hospital or clinic."),
  record_date: z.string().min(1, "Enter the record date."),
  doctor_name: z.string().min(1, "Enter the doctor name."),
  diagnosis: z.string(),
  remarks: z.string(),
  medications: z.array(reviewMedicationSchema),
  key_values: z.array(reviewKeyValueSchema),
});
