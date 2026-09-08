import { z } from "zod";

// Aceita formatos comuns de telefone BR/internacional: dígitos, espaços, parênteses, hífen e "+".
const PHONE_CHARSET_REGEX = /^[+()0-9\s-]{8,20}$/;
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;

function countDigits(value: string): number {
  return (value.match(/\d/g) || []).length;
}

// Nome: apenas letras (com acentos), espaços, hífen e apóstrofo — sem números ou símbolos.
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'-]*$/;

// Instituição: letras, números e pontuação comum de nomes de empresas/instituições.
const INSTITUTION_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,'&()-]*$/;

export const registerParticipantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo.")
    .max(100, "Nome muito longo (máximo 100 caracteres).")
    .regex(NAME_REGEX, "O nome deve conter apenas letras."),
  institution: z
    .string()
    .trim()
    .min(2, "Informe a instituição.")
    .max(100, "Instituição muito longa (máximo 100 caracteres).")
    .regex(INSTITUTION_REGEX, "Informe uma instituição válida."),
  phone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo (máximo 20 caracteres).")
    .regex(PHONE_CHARSET_REGEX, "Informe um telefone válido.")
    .refine(
      (value) => {
        const digits = countDigits(value);
        return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
      },
      { message: "Informe um telefone válido, com DDD." }
    ),
  email: z.string().trim().email("Informe um e-mail válido.").max(150, "E-mail muito longo (máximo 150 caracteres)."),
  // Consentimento de participação (obrigatório) e de marketing (opcional)
  // são finalidades diferentes — LGPD exige consentimento específico por
  // finalidade, então não podem ser um único checkbox.
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário concordar com o uso dos dados para continuar." }),
  }),
  marketingConsent: z.boolean().optional().default(false),
});

export const startGameSchema = z.object({
  category: z.enum(["catalogacao", "educacao", "ia_plagio"]),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  timeTakenMs: z.number().int().min(0).max(1000 * 60 * 10),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const adminParticipantsQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.enum(["catalogacao", "educacao", "ia_plagio"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(50),
});
