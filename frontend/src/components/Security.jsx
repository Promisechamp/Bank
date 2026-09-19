import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Loader,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../api";
import { useAuth } from "../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const QUESTION_OPTIONS = [
  "What was the name of your first school?",
  "What is your favorite food?",
  "What was the name of your childhood best friend?",
  "What city were you born in?",
  "What was the name of your first pet?",
  "What is your favorite movie?",
  "What was the name of your first teacher?",
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const emptyQuestions = () => [
  { question: "", answer: "" },
  { question: "", answer: "" },
];

/* -------------------------------------------------------------------------- */
/* Custom Select                                                              */
/* -------------------------------------------------------------------------- */

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Choose a question",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="
          flex w-full items-center justify-between rounded-xl border
          border-gray-200 bg-white px-3.5 py-3 text-left text-sm
          shadow-sm outline-none transition hover:border-gray-300
          focus:border-primary-500 focus:ring-2 focus:ring-primary-100
        "
      >
        <span
          className={
            value ? "pr-3 text-gray-800" : "pr-3 text-gray-400"
          }
        >
          {value || placeholder}
        </span>

        <ChevronDown
          className={`
            h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto
            rounded-xl border border-gray-200 bg-white p-1.5
            shadow-xl shadow-gray-200/40
          "
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="
                  flex w-full items-center justify-between gap-3
                  rounded-lg px-3 py-2.5 text-left text-sm text-gray-700
                  transition hover:bg-gray-50
                "
              >
                <span>{option}</span>

                {selected && (
                  <Check className="h-4 w-4 shrink-0 text-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Transfer PIN View                                                          */
/* -------------------------------------------------------------------------- */

function PinView({ value }) {
  const [revealed, setRevealed] = useState(false);
  const pin = value || "";

  return (
    <div className="flex items-center gap-2">
      <div
        className="
          flex h-11 min-w-[112px] items-center justify-center rounded-xl border
          border-gray-200 bg-gray-50 px-3 font-mono text-base font-semibold
          tracking-[0.24em] text-gray-800 sm:min-w-[128px] sm:px-4 sm:text-lg
          sm:tracking-[0.28em]
        "
      >
        {pin ? (revealed ? pin : "••••") : "••••"}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((current) => !current)}
        title={revealed ? "Hide PIN" : "Reveal PIN"}
        className="
          flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border
          border-gray-200 bg-white text-gray-500 transition
          hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700
        "
      >
        {revealed ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PIN Editor                                                                 */
/* -------------------------------------------------------------------------- */

function PinEditor({ value, onChange }) {
  const [revealed, setRevealed] = useState(false);
  const inputRefs = useRef([]);

  const digits = Array.from(
    { length: 4 },
    (_, index) => value[index] || ""
  );

  const updateDigit = (index, nextValue) => {
    if (!/^\d?$/.test(nextValue)) return;

    const next = [...digits];
    next[index] = nextValue;
    onChange(next.join(""));

    if (nextValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!pasted) return;

    onChange(pasted);

    const focusIndex = Math.min(pasted.length, 3);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type={revealed ? "text" : "password"}
            inputMode="numeric"
            autoComplete="off"
            maxLength={1}
            value={digit}
            onChange={(event) =>
              updateDigit(index, event.target.value)
            }
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={handlePaste}
            className="
              h-11 w-11 rounded-xl border border-gray-200 bg-white
              text-center font-mono text-lg font-semibold text-gray-900
              shadow-sm outline-none transition
              focus:border-primary-500 focus:ring-2 focus:ring-primary-100
            "
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((current) => !current)}
        title={revealed ? "Hide PIN" : "Reveal PIN"}
        className="
          flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
          border border-gray-200 bg-white text-gray-500 transition
          hover:border-gray-300 hover:bg-gray-50
        "
      >
        {revealed ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Entry Protection Modal (Responsive + Close, no autofocus/keyboard)         */
/* -------------------------------------------------------------------------- */

function SecurityUnlockModal({
  open,
  pin,
  setPin,
  onUnlock,
  unlocking,
  error,
}) {
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/profile", { replace: true });
    }
  };

  const digits = Array.from(
    { length: 4 },
    (_, index) => pin[index] || ""
  );

  const updateDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    const nextPin = next.join("");
    setPin(nextPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextPin.length === 4) {
      window.setTimeout(() => {
        onUnlock(nextPin);
      }, 80);
    }
  };

  const handleKeyDown = (event, index) => {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!pasted) return;

    setPin(pasted);

    if (pasted.length === 4) {
      window.setTimeout(() => {
        onUnlock(pasted);
      }, 80);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100] flex items-center justify-center
        bg-gray-950/45 backdrop-blur-[3px]
        px-4 py-6
        sm:px-6
      "
      role="dialog"
      aria-modal="true"
      aria-label="Security check"
    >
      <div
        className="
          relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl
          border border-gray-200 bg-white shadow-2xl shadow-gray-950/20
          max-h-[calc(100vh-3rem)] max-h-[calc(100dvh-3rem)]
        "
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close and go back"
          className="
            absolute right-3 top-3 z-10 flex h-9 w-9 items-center
            justify-center rounded-full text-gray-400 transition
            hover:bg-gray-100 hover:text-gray-700
            focus:outline-none focus:ring-2 focus:ring-primary-100
          "
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="
            overflow-y-auto px-5 pb-6 pt-7 text-center
            sm:px-6 sm:pb-7
          "
        >
          <div
            className="
              mx-auto flex h-12 w-12 items-center justify-center
              rounded-2xl bg-primary-50 text-primary-600
            "
          >
            <LockKeyhole className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-base font-semibold text-gray-900 sm:text-lg">
            Security check
          </h2>

          <p
            className="
              mx-auto mt-2 max-w-[280px] text-xs leading-5 text-gray-500
              sm:text-sm sm:leading-5
            "
          >
            Enter your 4-digit transfer PIN to access your security
            settings.
          </p>

          {/* PIN boxes — no autofocus, keyboard stays hidden until user taps */}
          <div
            className="
              mt-6 flex justify-center
              gap-2
              sm:gap-3
            "
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                value={digit}
                onChange={(event) =>
                  updateDigit(index, event.target.value)
                }
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={handlePaste}
                disabled={unlocking}
                className="
                  h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50
                  text-center font-mono text-lg font-semibold text-gray-900
                  outline-none transition
                  focus:border-primary-500 focus:bg-white focus:ring-2
                  focus:ring-primary-100
                  disabled:opacity-60

                  sm:h-14 sm:w-14 sm:text-xl
                "
              />
            ))}
          </div>

          {unlocking && (
            <div
              className="
                mt-4 flex items-center justify-center gap-2 text-xs
                text-gray-500
              "
            >
              <Loader className="h-3.5 w-3.5 animate-spin" />
              Verifying PIN...
            </div>
          )}

          {error && !unlocking && (
            <p className="mt-4 text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <p
            className="
              mt-6 text-[11px] leading-4 text-gray-400
            "
          >
            This extra step protects your security credentials from
            being viewed by someone using your device.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recovery Phrase                                                            */
/* -------------------------------------------------------------------------- */

function RecoveryPhrase({
  phrase,
  onRegenerate,
  regenerating,
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPhrase = async () => {
    if (!phrase || !revealed) return;

    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      toast.success("Recovery phrase copied");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error("Unable to copy recovery phrase");
    }
  };

  return (
    <div
      className="
        rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
      "
    >
      <div
        className="
          flex flex-col gap-4 sm:flex-row sm:items-start
          sm:justify-between
        "
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="
              mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg bg-gray-50 text-gray-600
            "
          >
            <KeyRound className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              Account recovery phrase
            </h2>

            <p
              className="
                mt-1 max-w-xl text-xs leading-5 text-gray-500
              "
            >
              A backup phrase that can be used when you need to recover
              access to your account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="
            inline-flex shrink-0 items-center justify-center gap-1.5
            rounded-xl border border-gray-200 bg-white px-3.5 py-2
            text-xs font-medium text-gray-700 transition
            hover:border-gray-300 hover:bg-gray-50
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <Loader
            className={`
              h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}
            `}
          />
          Regenerate
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <div
          className="
            flex h-11 min-w-0 flex-1 items-center overflow-hidden
            rounded-xl border border-gray-200 bg-gray-50 px-3.5
            font-mono text-sm tracking-wider text-gray-700
          "
        >
          <span className="truncate">
            {phrase
              ? revealed
                ? phrase
                : "••••••••••••••••••••"
              : "Not generated"}
          </span>
        </div>

        {phrase && (
          <>
            <button
              type="button"
              onClick={() => setRevealed((current) => !current)}
              title={
                revealed
                  ? "Hide recovery phrase"
                  : "Reveal recovery phrase"
              }
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-xl border border-gray-200 bg-white text-gray-500
                transition hover:border-gray-300 hover:bg-gray-50
              "
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={copyPhrase}
              disabled={!revealed}
              title="Copy recovery phrase"
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-xl border border-gray-200 bg-white text-gray-500
                transition hover:border-gray-300 hover:bg-gray-50
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function SecuritySettings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [transferPin, setTransferPin] = useState("");
  const [questions, setQuestions] = useState(emptyQuestions());

  /* Entry protection */
  const [securityUnlocked, setSecurityUnlocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response = await authAPI.getSecuritySettings();
      const data = response?.data?.data || response?.data;

      setSettings(data || null);

      setSecurityUnlocked(!data?.transfer_pin);
      setUnlockPin("");
      setUnlockError("");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to load security settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Unlock Security Page (client-side comparison — no backend verification)  */
  /* ------------------------------------------------------------------------ */

  const verifyTransferPin = async (pin = unlockPin) => {
  if (unlocking) return;

  if (!/^\d{4}$/.test(pin)) {
    setUnlockError("Enter your 4-digit transfer PIN.");
    return;
  }

  try {
    setUnlocking(true);
    setUnlockError("");

    console.log("⏳ Waiting 5s before sending request...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const raw = await authAPI.verifyTransferPin({
      transfer_pin: pin,
    });

    // Accept ANY of the common response shapes
    const ok =
      raw?.data?.success === true ||
      raw?.success === true ||
      raw?.data?.data?.success === true;

    if (!ok) {
      const msg =
        raw?.data?.message ||
        raw?.message ||
        raw?.data?.data?.message ||
        "Incorrect transfer PIN.";
      console.log("Failing with message:", msg);
      throw new Error(msg);
    }

    console.log("✅ SUCCESS — unlocking");
    setSecurityUnlocked(true);
    setUnlockPin("");
    setUnlockError("");
  } catch (error) {
    setUnlockPin("");
    setUnlockError(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Incorrect transfer PIN."
    );
  } finally {
    setUnlocking(false);
  }
};
		
		
		
  /* ------------------------------------------------------------------------ */
  /* Edit                                                                     */
  /* ------------------------------------------------------------------------ */

  const beginEditing = () => {
    const existingQuestions = settings?.security_questions || [];

    setTransferPin(settings?.transfer_pin || "");

    setQuestions([
      {
        question: existingQuestions[0]?.question || "",
        answer: existingQuestions[0]?.answer || "",
      },
      {
        question: existingQuestions[1]?.question || "",
        answer: existingQuestions[1]?.answer || "",
      },
    ]);

    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTransferPin("");
    setQuestions(emptyQuestions());
  };

  /* ------------------------------------------------------------------------ */
  /* Question helpers                                                         */
  /* ------------------------------------------------------------------------ */

  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const getQuestionOptions = (index) => {
    const otherIndex = index === 0 ? 1 : 0;
    const otherQuestion = questions[otherIndex]?.question;

    return QUESTION_OPTIONS.filter(
      (question) =>
        question === questions[index]?.question ||
        question !== otherQuestion
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Save                                                                     */
  /* ------------------------------------------------------------------------ */

  const saveSettings = async () => {
    if (!/^\d{4}$/.test(transferPin)) {
      toast.error("Transfer PIN must contain exactly 4 digits.");
      return;
    }

    const cleanedQuestions = questions.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }));

    if (
      cleanedQuestions.some(
        (item) => !item.question || !item.answer
      )
    ) {
      toast.error("Complete both security questions.");
      return;
    }

    if (
      cleanedQuestions[0].question === cleanedQuestions[1].question
    ) {
      toast.error("Choose two different security questions.");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (settings) {
        response = await authAPI.updateSecuritySettings({
          transfer_pin: transferPin,
          security_questions: cleanedQuestions,
        });
      } else {
        response = await authAPI.createSecuritySettings({
          transfer_pin: transferPin,
          security_questions: cleanedQuestions,
        });
      }

      const data = response?.data?.data || response?.data;

      setSettings(data);
      setEditing(false);
      setSecurityUnlocked(true);

      toast.success("Security settings saved.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to save security settings."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Regenerate Recovery Phrase                                               */
  /* ------------------------------------------------------------------------ */

  const regenerateRecoveryPhrase = async () => {
    try {
      setRegenerating(true);

      const response = await authAPI.updateSecuritySettings({
        regenerate_recovery_phrase: true,
      });

      const data = response?.data?.data || response?.data;

      setSettings((current) => ({
        ...current,
        ...data,
      }));

      toast.success("New recovery phrase generated.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to regenerate recovery phrase."
      );
    } finally {
      setRegenerating(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-44 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded bg-gray-100" />
          <div className="mt-7 h-36 rounded-2xl bg-gray-100" />
          <div className="mt-4 h-52 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const configured = Boolean(settings?.transfer_pin);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <SecurityUnlockModal
        open={configured && !securityUnlocked}
        pin={unlockPin}
        setPin={setUnlockPin}
        onUnlock={verifyTransferPin}
        unlocking={unlocking}
        error={unlockError}
      />

      <div
        className={`
          mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8
          ${
            configured && !securityUnlocked
              ? "pointer-events-none select-none"
              : ""
          }
        `}
        aria-hidden={configured && !securityUnlocked}
      >
        {/* HERO */}
        <div
          className="
            overflow-hidden rounded-2xl border border-gray-200 bg-white
            shadow-sm
          "
        >
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div
              className="
                flex flex-col gap-5 sm:flex-row sm:items-center
                sm:justify-between
              "
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="
                      text-lg font-semibold tracking-tight text-gray-900
                      sm:text-xl
                    "
                  >
                    Security & access
                  </h1>

                  <span
                    className={`
                      inline-flex items-center gap-1.5 rounded-full px-2.5
                      py-1 text-[11px] font-medium
                      ${
                        configured
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    `}
                  >
                    <span
                      className={`
                        h-1.5 w-1.5 rounded-full
                        ${
                          configured
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }
                      `}
                    />
                    {configured ? "Protected" : "Setup required"}
                  </span>
                </div>

                <p
                  className="
                    mt-1.5 max-w-2xl text-xs leading-5 text-gray-500
                    sm:text-sm
                  "
                >
                  Manage the credentials and recovery options used to
                  protect your account.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={beginEditing}
                  className="
                    inline-flex w-full shrink-0 items-center justify-center
                    rounded-xl bg-primary-600 px-4 py-2.5 text-sm
                    font-medium text-white shadow-sm transition
                    hover:bg-primary-700 focus:outline-none
                    focus:ring-2 focus:ring-primary-200
                    sm:w-auto
                  "
                >
                  {configured ? "Edit settings" : "Set up security"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VIEW MODE */}
        {!editing ? (
          <div className="mt-4 space-y-4">
            <section
              className="
                overflow-hidden rounded-2xl border border-gray-200
                bg-white shadow-sm
              "
            >
              <div
                className="
                  flex items-center justify-between gap-4 border-b
                  border-gray-100 px-5 py-4
                "
              >
                <div className="flex items-center gap-2.5">
                  <LockKeyhole className="h-4 w-4 text-gray-500" />

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Transfer PIN
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Used to authorize protected transfers.
                    </p>
                  </div>
                </div>

                <span
                  className="hidden text-xs text-gray-400 sm:block"
                >
                  4 digits
                </span>
              </div>

              <div
                className="
                  flex flex-col gap-3 px-5 py-5
                  sm:flex-row sm:items-center sm:justify-between
                "
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Your current PIN
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Hidden by default for privacy.
                  </p>
                </div>

                <PinView value={settings?.transfer_pin} />
              </div>
            </section>

            <section
              className="
                overflow-hidden rounded-2xl border border-gray-200
                bg-white shadow-sm
              "
            >
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <UserRoundCheck className="h-4 w-4 text-gray-500" />

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Security questions
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Used as an additional account verification
                      method.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(settings?.security_questions || []).map(
                  (item, index) => (
                    <div key={index} className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <span
                          className="
                            text-[11px] font-semibold uppercase
                            tracking-wider text-gray-400
                          "
                        >
                          Question {index + 1}
                        </span>

                        <span className="text-[11px] text-gray-400">
                          Answer protected
                        </span>
                      </div>

                      <p
                        className="
                          mt-1.5 text-sm font-medium text-gray-800
                        "
                      >
                        {item.question}
                      </p>
                    </div>
                  )
                )}

                {!settings?.security_questions?.length && (
                  <div className="px-5 py-6 text-sm text-gray-500">
                    No security questions configured.
                  </div>
                )}
              </div>
            </section>

            <RecoveryPhrase
              phrase={settings?.account_recovery_phrase}
              onRegenerate={regenerateRecoveryPhrase}
              regenerating={regenerating}
            />
          </div>
        ) : (
          /* EDIT MODE */
          <div className="mt-4">
            <div
              className="
                overflow-hidden rounded-2xl border border-gray-200
                bg-white shadow-sm
              "
            >
              <div
                className="border-b border-gray-100 px-5 py-4 sm:px-6"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Update security settings
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Changes to these settings will apply to your account
                  immediately after saving.
                </p>
              </div>

              <section className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-gray-500" />

                  <h2 className="text-sm font-semibold text-gray-900">
                    Transfer PIN
                  </h2>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Enter a new 4-digit PIN.
                </p>

                <div className="mt-4">
                  <PinEditor
                    value={transferPin}
                    onChange={setTransferPin}
                  />
                </div>
              </section>

              <div className="border-t border-gray-100" />

              <section className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-center gap-2">
                  <UserRoundCheck className="h-4 w-4 text-gray-500" />

                  <h2 className="text-sm font-semibold text-gray-900">
                    Security questions
                  </h2>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Choose two different questions and provide an answer
                  for each.
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {questions.map((item, index) => (
                    <div
                      key={index}
                      className="
                        rounded-xl border border-gray-200 bg-gray-50/50
                        p-4
                      "
                    >
                      <span
                        className="
                          text-[11px] font-semibold uppercase
                          tracking-wider text-gray-400
                        "
                      >
                        Question {index + 1}
                      </span>

                      <div className="mt-2.5">
                        <CustomSelect
                          value={item.question}
                          options={getQuestionOptions(index)}
                          onChange={(value) =>
                            updateQuestion(index, "question", value)
                          }
                        />
                      </div>

                      <div className="mt-3">
                        <label
                          className="
                            mb-1.5 block text-xs font-medium text-gray-600
                          "
                        >
                          Answer
                        </label>

                        <input
                          type="text"
                          value={item.answer}
                          onChange={(event) =>
                            updateQuestion(
                              index,
                              "answer",
                              event.target.value
                            )
                          }
                          placeholder="Enter your answer"
                          className="
                            w-full rounded-xl border border-gray-200
                            bg-white px-3.5 py-3 text-sm text-gray-800
                            shadow-sm outline-none transition
                            placeholder:text-gray-400
                            focus:border-primary-500
                            focus:ring-2 focus:ring-primary-100
                          "
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-gray-100" />

              <section className="px-5 py-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-gray-500" />

                  <h2 className="text-sm font-semibold text-gray-900">
                    Account recovery phrase
                  </h2>
                </div>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  A recovery phrase is generated automatically when
                  security settings are created. You do not need to
                  enter one here.
                </p>

                <div
                  className="
                    mt-3 flex items-center gap-2 text-xs text-gray-500
                  "
                >
                  <span
                    className="
                      flex h-5 w-5 items-center justify-center
                      rounded-full bg-green-50
                    "
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </span>

                  {settings?.account_recovery_phrase
                    ? "Recovery phrase already configured"
                    : "A recovery phrase will be generated automatically"}
                </div>
              </section>

              <div
                className="
                  flex flex-col-reverse gap-2 border-t border-gray-100
                  bg-gray-50/50 px-5 py-4
                  sm:flex-row sm:justify-end sm:px-6
                "
              >
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="
                    rounded-xl border border-gray-200 bg-white px-4 py-2.5
                    text-sm font-medium text-gray-700 transition
                    hover:bg-gray-50 disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl bg-primary-600 px-5 py-2.5 text-sm
                    font-medium text-white shadow-sm transition
                    hover:bg-primary-700 disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving && (
                    <Loader className="h-4 w-4 animate-spin" />
                  )}

                  {saving ? "Saving..." : "Save security settings"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className="
            mt-4 flex items-center gap-2 px-1 pb-4 text-xs text-gray-400
          "
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />

          <span>
            Never share your transfer PIN or recovery phrase with
            anyone.
          </span>
        </div>
      </div>
    </>
  );
}