import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { registerParticipant, ApiError } from "../lib/api";
import { saveParticipantSession } from "../lib/storage";

interface FormState {
  name: string;
  institution: string;
  phone: string;
  email: string;
  consent: boolean;
  marketingConsent: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARSET_REGEX = /^[+()0-9\s-]{8,20}$/;
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'-]*$/;
const INSTITUTION_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,'&()-]*$/;

const NAME_MAX_LENGTH = 100;
const INSTITUTION_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 150;

function countDigits(value: string): number {
  return (value.match(/\d/g) || []).length;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    institution: "",
    phone: "",
    email: "",
    consent: false,
    marketingConsent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    const name = form.name.trim();
    if (name.length < 3) {
      next.name = "Informe seu nome completo.";
    } else if (name.length > NAME_MAX_LENGTH) {
      next.name = `Nome muito longo (máximo ${NAME_MAX_LENGTH} caracteres).`;
    } else if (!NAME_REGEX.test(name)) {
      next.name = "O nome deve conter apenas letras.";
    }

    const institution = form.institution.trim();
    if (institution.length < 2) {
      next.institution = "Informe sua instituição.";
    } else if (institution.length > INSTITUTION_MAX_LENGTH) {
      next.institution = `Instituição muito longa (máximo ${INSTITUTION_MAX_LENGTH} caracteres).`;
    } else if (!INSTITUTION_REGEX.test(institution)) {
      next.institution = "Informe uma instituição válida.";
    }

    const phone = form.phone.trim();
    const phoneDigits = countDigits(phone);
    if (!PHONE_CHARSET_REGEX.test(phone) || phoneDigits < PHONE_MIN_DIGITS || phoneDigits > PHONE_MAX_DIGITS) {
      next.phone = "Informe um telefone válido, com DDD.";
    }

    const email = form.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      next.email = "Informe um e-mail válido.";
    } else if (email.length > EMAIL_MAX_LENGTH) {
      next.email = `E-mail muito longo (máximo ${EMAIL_MAX_LENGTH} caracteres).`;
    }

    if (!form.consent) next.consent = "É necessário concordar para continuar.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { token, participant } = await registerParticipant({
        name: form.name.trim(),
        institution: form.institution.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        consent: form.consent,
        marketingConsent: form.marketingConsent,
      });
      saveParticipantSession(token, participant);
      navigate("/categorias");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Não foi possível concluir o cadastro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="glass-card w-full max-w-lg animate-pop-in rounded-3xl p-6 sm:p-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Vamos começar!</h1>
        <p className="mt-2 text-sm text-ink/60">
          Preencha seus dados para participar da Trivia da ITMS Group.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">Nome completo *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
            />
            {errors.name && <p className="mt-1 text-xs text-accent-dark">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">Instituição *</label>
            <input
              className="input-field"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              placeholder="Empresa, universidade ou biblioteca"
              autoComplete="organization"
              maxLength={INSTITUTION_MAX_LENGTH}
            />
            {errors.institution && <p className="mt-1 text-xs text-accent-dark">{errors.institution}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">Telefone *</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 91234-5678"
              autoComplete="tel"
              inputMode="tel"
              maxLength={PHONE_MAX_LENGTH}
            />
            {errors.phone && <p className="mt-1 text-xs text-accent-dark">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">E-mail *</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@empresa.com"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
            />
            {errors.email && <p className="mt-1 text-xs text-accent-dark">{errors.email}</p>}
          </div>

          <label className="flex items-start gap-3 pt-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 accent-accent"
            />
            <span>
              Concordo em fornecer meus dados (nome, instituição, telefone e e-mail) para
              participar da Trivia da ITMS Group. *
            </span>
          </label>
          {errors.consent && <p className="text-xs text-accent-dark">{errors.consent}</p>}

          <label className="flex items-start gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 accent-accent"
            />
            <span>
              (Opcional) Aceito receber, por e-mail ou telefone, informações sobre produtos e
              serviços da ITMS Group.
            </span>
          </label>

          {submitError && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
              {submitError}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
            {loading ? "Enviando..." : "CONTINUAR"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
