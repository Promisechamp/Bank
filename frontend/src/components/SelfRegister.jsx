import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI, supabase } from '../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  Home,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  WalletCards,
  PiggyBank,
  Zap,
  ArrowRight,
  ArrowLeft,
  Globe2,
  Shield,
  Camera,
  X,
  Trash2,
} from 'lucide-react';
import LogoImg from '../images/logo.png';

/* ============================================================
   ANIMATION
============================================================ */

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 36 : -36,
    opacity: 0,
  }),

  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    },
  },

  exit: (dir) => ({
    x: dir > 0 ? -36 : 36,
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/* ============================================================
   FIELD
============================================================ */

function Field({ label, hint, error, required = false, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold tracking-[-0.01em] text-gray-800">
          {label}
          {required && <span className="ml-1 text-indigo-500">*</span>}
        </label>

        {hint && !error && (
          <span className="text-[11px] font-medium text-gray-400">
            {hint}
          </span>
        )}
      </div>

      {children}

      {error && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   TEXT INPUT
============================================================ */

function TextInput({ icon: Icon, rightSlot, ...props }) {
  return (
    <div className="group relative">
      {Icon && (
        <Icon
          className="
            absolute left-3.5 top-1/2 z-10 h-[17px] w-[17px]
            -translate-y-1/2 text-gray-400 transition-colors
            group-focus-within:text-indigo-500
          "
        />
      )}

      <input
        {...props}
        className={`
          w-full rounded-[13px] border border-gray-200
          bg-gray-50/60 py-[12px] text-[13px] font-medium
          text-gray-900 outline-none transition-all duration-200
          placeholder:text-gray-400
          hover:border-gray-300 hover:bg-white
          focus:border-indigo-500 focus:bg-white
          focus:ring-4 focus:ring-indigo-500/[0.08]
          disabled:cursor-not-allowed disabled:bg-gray-100
          ${Icon ? 'pl-10' : 'pl-4'}
          ${rightSlot ? 'pr-11' : 'pr-4'}
        `}
      />

      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PASSWORD INPUT
============================================================ */

function PasswordInputWithError({
  label,
  name,
  value,
  onChange,
  error,
}) {
  const [show, setShow] = useState(false);

  return (
    <Field label={label} error={error} required>
      <div className="group relative">
        <Lock
          className="
            absolute left-3.5 top-1/2 z-10 h-[17px] w-[17px]
            -translate-y-1/2 text-gray-400 transition-colors
            group-focus-within:text-indigo-500
          "
        />

        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className={`
            w-full rounded-[13px] border bg-gray-50/60
            py-[12px] pl-10 pr-11 text-[13px] font-medium
            text-gray-900 outline-none transition-all duration-200
            placeholder:text-gray-400
            hover:border-gray-300 hover:bg-white
            focus:bg-white focus:ring-4
            ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-500/[0.08]'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/[0.08]'
            }
          `}
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="
            absolute right-3.5 top-1/2 -translate-y-1/2
            text-gray-400 transition-colors
            hover:text-indigo-600 focus:outline-none
          "
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOff className="h-[17px] w-[17px]" />
          ) : (
            <Eye className="h-[17px] w-[17px]" />
          )}
        </button>
      </div>
    </Field>
  );
}

/* ============================================================
   ACCOUNT TYPE
============================================================ */

function AccountTypeCard({
  value,
  selected,
  onSelect,
  icon: Icon,
  label,
  description,
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(value)}
      className={`
        relative w-full rounded-[16px] border p-4 text-left
        transition-all duration-200
        ${
          selected
            ? 'border-indigo-500 bg-indigo-50/[0.65] shadow-[0_8px_24px_rgba(79,70,229,0.10)]'
            : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50/70'
        }
      `}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-[13px] transition-all duration-200
            ${
              selected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-100 text-gray-500'
            }
          `}
        >
          <Icon className="h-[19px] w-[19px]" />
        </div>

        <div className="min-w-0 pr-6">
          <p
            className={`
              text-[13px] font-extrabold
              ${selected ? 'text-indigo-700' : 'text-gray-800'}
            `}
          >
            {label}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute right-3.5 top-3.5"
        >
          <CheckCircle2 className="h-[17px] w-[17px] text-indigo-600" />
        </motion.div>
      )}
    </motion.button>
  );
}

/* ============================================================
   STEP INDICATOR
============================================================ */

function StepIndicator({ current, total, labels }) {
  return (
    <div className="flex items-center">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <React.Fragment key={label}>
            <div className="flex shrink-0 flex-col items-center">
              <motion.div
                animate={{
                  scale: active ? 1 : 0.96,
                }}
                className={`
                  flex h-8 w-8 items-center justify-center
                  rounded-full text-[10px] font-extrabold
                  transition-all duration-300
                  ${
                    done
                      ? 'bg-indigo-600 text-white'
                      : active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'border border-gray-200 bg-white text-gray-400'
                  }
                `}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </motion.div>

              <span
                className={`
                  mt-1.5 hidden text-[9px] font-bold sm:block
                  ${
                    active
                      ? 'text-indigo-600'
                      : done
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }
                `}
              >
                {label}
              </span>
            </div>

            {i < total - 1 && (
              <div
                className={`
                  mx-2 mb-4 h-px flex-1 transition-all
                  duration-500 sm:mx-3
                  ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ============================================================
   BRAND PANEL
============================================================ */

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    text: 'Protected with bank-grade security',
  },
  {
    icon: Zap,
    text: 'Fast transfers between your accounts',
  },
  {
    icon: CreditCard,
    text: 'Modern virtual and physical cards',
  },
];

function BrandPanel() {
  return (
    <div
      className="
        relative hidden w-[42%] overflow-hidden rounded-[28px]
        bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800
        px-10 py-11 text-white lg:flex lg:flex-col
        lg:justify-between xl:px-12 xl:py-14
      "
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-black/[0.10] blur-3xl" />

      <div className="pointer-events-none absolute right-[-50px] top-[25%] h-64 w-64 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute right-[-5px] top-[30%] h-44 w-44 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute right-[45px] top-[35%] h-24 w-24 rounded-full border border-white/[0.08]" />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <div >
          <img src={LogoImg} alt="logo" width={150} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative max-w-[390px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">
            Secure registration
          </span>
        </div>

        <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] xl:text-[36px]">
          Your financial life,
          <br />
          <span className="text-indigo-200">simplified.</span>
        </h1>

        <p className="mt-4 max-w-[350px] text-[13px] leading-6 text-white/65">
          Open your account in minutes and get everything you need to
          spend, save and manage your money.
        </p>

        <div className="mt-8 space-y-3">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="
                flex items-center gap-3 rounded-xl
                border border-white/[0.06] bg-white/[0.05]
                px-3 py-2.5
              "
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="h-3.5 w-3.5 text-indigo-100" />
              </div>

              <span className="text-[11px] font-medium text-white/75">
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Premium card */}
        <div className="relative mt-8 h-[145px] overflow-hidden rounded-[20px] border border-white/[0.12] bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-5 shadow-2xl backdrop-blur-md">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.08] blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-indigo-200">
                Trustycdu Bank
              </p>
              <p className="mt-5 font-mono text-[12px] font-semibold tracking-[0.22em] text-white/85">
                •••• •••• •••• ••••
              </p>
            </div>

            <CreditCard className="h-5 w-5 text-white/60" />
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
            <div className="h-6 w-9 rounded-[4px] bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" />

            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-red-400/75" />
              <div className="-ml-2 h-6 w-6 rounded-full bg-orange-300/75" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between text-[9px] font-medium text-white/35">
        <span>© {new Date().getFullYear()} Trusty credit union</span>

        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Secure & private
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

const SecureRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('securetoken');
  const navigate = useNavigate();

  /* Token validation */
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false);
        setValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('register_token')
          .select('*')
          .eq('token', token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        setIsValid(!error && !!data);
      } catch {
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  /* Form state */
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    account_type: 'checking',
    password: '',
    confirmPassword: '',
    profile_image: '', // ✅ NEW: avatar URL
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);

  // ✅ Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  const STEPS = [
    'Your details',
    'Account type',
    'Set password',
  ];

  /* Form change */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /* ============================================================
     AVATAR UPLOAD
  ============================================================ */

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WEBP, or GIF image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setAvatarFile(file);
    toast.success('Avatar selected – will be uploaded during registration');
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, profile_image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ============================================================
     VALIDATION
  ============================================================ */

  function validateStep(s) {
    const errs = {};

    if (s === 0) {
      if (!formData.full_name.trim()) {
        errs.full_name = 'Full name is required';
      }

      if (!formData.email.trim()) {
        errs.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = 'Enter a valid email';
      }
    }

    if (s === 2) {
      if (!formData.password) {
        errs.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errs.password = 'At least 6 characters';
      }

      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Please confirm your password';
      } else if (
        formData.password !== formData.confirmPassword
      ) {
        errs.confirmPassword = "Passwords don't match";
      }
    }

    return errs;
  }

  /* Navigation */
  function goNext() {
    const errs = validateStep(step);

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setDir(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDir(-1);
    setStep((s) => s - 1);
  }

  /* ============================================================
     SUBMIT – uploads avatar to Supabase during registration
  ============================================================ */

  const handleSubmit = async (e) => {
  e.preventDefault();

  const errs = validateStep(2);

  if (Object.keys(errs).length) {
    setErrors(errs);
    return;
  }

  setGlobalError('');
  setLoading(true);

  try {
    let profileImageUrl = '';

    // =========================================================
    // AVATAR UPLOAD
    // =========================================================

    if (avatarFile) {
      try {
        const tempId =
          typeof crypto !== 'undefined' &&
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Date.now().toString(36);

        const filePath = `avatars/${tempId}/profile.jpg`;

        const {
          error: uploadError
        } = await supabase.storage
          .from('avatars')
          .upload(
            filePath,
            avatarFile,
            {
              upsert: true
            }
          );

        if (uploadError) {
          console.warn(
            'Avatar upload failed:',
            uploadError
          );

          toast.warning(
            'Avatar upload failed, but registration will continue.'
          );
        } else {
          const {
            data: publicUrlData
          } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          profileImageUrl =
            publicUrlData?.publicUrl || '';
        }

      } catch (uploadError) {
        console.warn(
          'Avatar upload error:',
          uploadError
        );

        toast.warning(
          'Avatar upload failed, but registration will continue.'
        );
      }
    }

    // =========================================================
    // REGISTER
    // =========================================================

    const response =
      await authAPI.selfRegister({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone:
          formData.phone?.trim() || undefined,
        address:
          formData.address?.trim() || undefined,
        country:
          formData.country?.trim() || undefined,
        account_type:
          formData.account_type,
        register_token:
          token,
        profile_image:
          profileImageUrl
      });

    if (!response?.success) {
      throw new Error(
        response?.error ||
        response?.message ||
        'Registration failed. Please try again.'
      );
    }

    // =========================================================
    // REGISTRATION SUCCEEDED
    // =========================================================

    setSuccess(true);

    toast.success(
      avatarFile
        ? 'Account created with avatar! Redirecting to sign in…'
        : 'Account created! Redirecting to sign in…'
    );

    setTimeout(() => {
      navigate('/login');
    }, 2500);

  } catch (err) {
    console.error(
      'Self registration error:',
      err
    );

    setGlobalError(
      err?.error ||
      err?.message ||
      'Something went wrong. Please try again.'
    );

  } finally {
    setLoading(false);
  }
};

		
		
		
		
		
  /* ============================================================
     LOADING
  ============================================================ */

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/20">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>

          <p className="mt-4 text-[12px] font-semibold text-gray-500">
            Validating your secured link…
          </p>
        </motion.div>
      </div>
    );
  }

  /* ============================================================
     INVALID TOKEN
  ============================================================ */

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            w-full max-w-md rounded-[28px] border border-gray-200
            bg-white p-9 text-center
            shadow-sm
          "
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="mt-6 text-[23px] font-extrabold tracking-tight text-gray-900">
            Link expired or invalid
          </h2>

          <p className="mt-2 text-[13px] leading-6 text-gray-500">
            This registration link has already been used or has
            expired. Please contact your bank to request a new one.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/')}
              className="
                flex w-full items-center justify-center gap-2
                rounded-[13px] bg-indigo-600 px-5 py-3
                text-[13px] font-bold text-white
                shadow-lg shadow-indigo-600/20
                transition hover:-translate-y-0.5 hover:bg-indigo-700
              "
            >
              Back to home
            </button>

            <Link
              to="/login"
              className="block text-[12px] font-bold text-indigo-600 hover:text-indigo-700"
            >
              Already have an account? Sign in →
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ============================================================
     SUCCESS
  ============================================================ */

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            w-full max-w-md rounded-[28px] border border-gray-200
            bg-white p-10 text-center
            shadow-sm
          "
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: 'spring',
              stiffness: 220,
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-gray-900">
            Account created!
          </h2>

          <p className="mt-2 text-[13px] leading-6 text-gray-500">
            Welcome to Trusty Credit Union bank. You'll be redirected to sign
            in shortly.
          </p>

          <Link
            to="/login"
            className="
              mt-7 inline-flex items-center gap-2 rounded-[13px]
              bg-indigo-600 px-6 py-3 text-[13px] font-bold
              text-white shadow-lg shadow-indigo-600/20
              transition hover:-translate-y-0.5 hover:bg-indigo-700
            "
          >
            Sign in now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ============================================================
     MAIN FORM
  ============================================================ */

  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="flex min-h-[calc(100vh-24px)] overflow-hidden rounded-[30px] sm:min-h-[calc(100vh-40px)]">
        {/* Brand */}
        <BrandPanel />

        {/* Form */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-9 sm:px-8 lg:px-12 xl:px-16">
          {/* Mobile logo */}
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <div >
              <img src={LogoImg} alt="logo" width={150} />
            </div>
          </div>

          <div className="w-full max-w-[480px]">
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />

                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">
                  Invited registration
                </p>
              </div>

              <h2 className="mt-2 text-[25px] font-extrabold tracking-[-0.025em] text-gray-900">
                Create your account
              </h2>

              <p className="mt-1.5 text-[12px] leading-5 text-gray-500">
                You've been invited to join Trusty credit union bank. Complete
                the steps below to get started.
              </p>
            </div>

            {/* Steps */}
            <div className="mb-7">
              <StepIndicator
                current={step}
                total={STEPS.length}
                labels={STEPS}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="
                    mb-5 flex items-start gap-2.5 overflow-hidden
                    rounded-xl border border-red-100 bg-red-50
                    px-4 py-3
                  "
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                  <p className="text-[11px] font-medium leading-5 text-red-700">
                    {globalError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form card */}
            <div
              className="
                overflow-hidden rounded-[22px] border border-gray-100
                bg-white
                shadow-sm
              "
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">
                    Step {step + 1} of {STEPS.length}
                  </p>

                  <p className="mt-0.5 text-[13px] font-extrabold text-gray-900">
                    {STEPS[step]}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />

                  <span className="text-[9px] font-extrabold text-emerald-700">
                    SECURED
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="relative overflow-hidden px-5 py-6 sm:px-6 sm:py-7">
                <AnimatePresence custom={dir} mode="wait">
                  {/* STEP 0 */}
                  {step === 0 && (
                    <motion.div
                      key="step-0"
                      custom={dir}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4.5"
                    >
                      {/* ✅ Avatar Upload */}
                      <div className="mb-4">
                        <label className="block text-[13px] font-bold tracking-[-0.01em] text-gray-800 mb-2">
                          Profile Photo
                          <span className="ml-1 text-gray-400 text-[11px] font-normal">(optional)</span>
                        </label>

                        <div className="flex items-center gap-4">
                          {/* Avatar preview */}
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden">
                            {avatarPreview ? (
                              <img
                                src={avatarPreview}
                                alt="Avatar preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                              <label className="cursor-pointer rounded-[11px] bg-indigo-50 px-3.5 py-2 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-700">
                                <Camera className="inline h-3.5 w-3.5 mr-1.5" />
                                Choose Photo
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarUpload}
                                  className="hidden"
                                  disabled={uploadingAvatar}
                                />
                              </label>

                              {avatarPreview && (
                                <button
                                  type="button"
                                  onClick={removeAvatar}
                                  className="rounded-[11px] border border-gray-200 px-3.5 py-2 text-[11px] font-bold text-gray-500 transition hover:bg-gray-50 hover:text-red-500"
                                >
                                  <Trash2 className="inline h-3.5 w-3.5 mr-1" />
                                  Remove
                                </button>
                              )}
                            </div>

                            {uploadingAvatar && (
                              <p className="mt-1.5 text-[10px] text-indigo-600 flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Uploading...
                              </p>
                            )}

                            <p className="mt-1.5 text-[9px] text-gray-400">
                              JPEG, PNG, WEBP, GIF • Max 2MB
                            </p>
                          </div>
                        </div>
                      </div>

                      <Field
                        label="Full name"
                        error={errors.full_name}
                        required
                      >
                        <TextInput
                          icon={User}
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          autoComplete="name"
                        />
                      </Field>

                      <Field
                        label="Email address"
                        error={errors.email}
                        required
                      >
                        <TextInput
                          icon={Mail}
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john.doe@email.com"
                          autoComplete="email"
                        />
                      </Field>

                      <Field
                        label="Phone number"
                        hint="Optional"
                      >
                        <TextInput
                          icon={Phone}
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 555 0101"
                          autoComplete="tel"
                        />
                      </Field>

                      <Field
                        label="Mailing address"
                        hint="Optional"
                      >
                        <TextInput
                          icon={Home}
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="123 Main Street, City"
                          autoComplete="street-address"
                        />
                      </Field>

                      <Field
                        label="Country"
                        hint="Optional"
                      >
                        <TextInput
                          icon={Globe2}
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="USA"
                          autoComplete="country-name"
                        />
                      </Field>

                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />

                        <p className="text-[10px] leading-4 text-gray-500">
                          Your information is encrypted and securely
                          handled.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 1 */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      custom={dir}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="mb-5">
                        <p className="text-[12px] leading-5 text-gray-500">
                          Choose the account that best fits how you
                          plan to use your money. You can add more
                          accounts later.
                        </p>
                      </div>

                      <AccountTypeCard
                        value="checking"
                        selected={
                          formData.account_type === 'checking'
                        }
                        onSelect={(v) =>
                          setFormData((p) => ({
                            ...p,
                            account_type: v,
                          }))
                        }
                        icon={WalletCards}
                        label="Checking account"
                        description="For everyday spending, bills and transfers. Comes with a debit card."
                      />

                      <AccountTypeCard
                        value="savings"
                        selected={
                          formData.account_type === 'savings'
                        }
                        onSelect={(v) =>
                          setFormData((p) => ({
                            ...p,
                            account_type: v,
                          }))
                        }
                        icon={PiggyBank}
                        label="Savings account"
                        description="Keep money aside for your goals while building your savings."
                      />

                      <motion.div
                        layout
                        className="mt-5 rounded-[14px] border border-indigo-100 bg-indigo-50/60 p-3.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                            {formData.account_type === 'checking' ? (
                              <WalletCards className="h-3.5 w-3.5 text-indigo-600" />
                            ) : (
                              <PiggyBank className="h-3.5 w-3.5 text-indigo-600" />
                            )}
                          </div>

                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-500">
                              Selected account
                            </p>

                            <p className="mt-0.5 text-[11px] font-bold text-indigo-800">
                              {formData.account_type === 'checking'
                                ? 'Checking account'
                                : 'Savings account'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      custom={dir}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-5"
                    >
                      <p className="text-[12px] leading-5 text-gray-500">
                        Create a strong password to protect your
                        account. We recommend using a combination of
                        letters and numbers.
                      </p>

                      <PasswordInputWithError
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                      />

                      <PasswordInputWithError
                        label="Confirm password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                      />

                      {/* Password requirements */}
                      <div className="rounded-[14px] border border-gray-100 bg-gray-50/70 p-3.5">
                        <p className="mb-2.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                          Password requirements
                        </p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {[
                            [
                              formData.password.length >= 6,
                              '6+ characters',
                            ],
                            [
                              /[A-Z]/.test(formData.password),
                              'Uppercase',
                            ],
                            [
                              /[0-9]/.test(formData.password),
                              'One number',
                            ],
                          ].map(([met, label]) => (
                            <div
                              key={label}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`
                                  flex h-4 w-4 items-center justify-center
                                  rounded-full transition-all
                                  ${
                                    met
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-200'
                                  }
                                `}
                              >
                                {met && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </div>

                              <span
                                className={`
                                  text-[10px] font-semibold
                                  ${
                                    met
                                      ? 'text-emerald-600'
                                      : 'text-gray-400'
                                  }
                                `}
                              >
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review */}
                      <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                            Review
                          </p>

                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>

                        <div className="space-y-2.5">
                          {[
                            [
                              'Name',
                              formData.full_name || '—',
                            ],
                            [
                              'Email',
                              formData.email || '—',
                            ],
                            [
                              'Country',
                              formData.country || '—',
                            ],
                            [
                              'Account',
                              formData.account_type
                                .charAt(0)
                                .toUpperCase() +
                                formData.account_type.slice(1),
                            ],
                            avatarPreview ? ['Avatar', '✅ Uploaded'] : ['Avatar', 'Not uploaded'],
                          ].map(([key, val]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="shrink-0 text-[10px] font-medium text-gray-400">
                                {key}
                              </span>

                              <span className="max-w-[65%] truncate text-right text-[10px] font-bold text-gray-800">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/30 px-5 py-4 sm:px-6">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="
                      flex items-center gap-1.5 rounded-[12px]
                      border border-gray-200 bg-white px-4 py-2.5
                      text-[11px] font-bold text-gray-600
                      transition hover:border-gray-300 hover:bg-gray-50
                    "
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="
                      group ml-auto flex items-center gap-2
                      rounded-[12px] bg-indigo-600 px-5 py-2.5
                      text-[11px] font-extrabold text-white
                      shadow-lg shadow-indigo-600/20
                      transition-all duration-200
                      hover:-translate-y-0.5 hover:bg-indigo-700
                      active:translate-y-0
                    "
                  >
                    Continue

                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="
                      group ml-auto flex items-center gap-2
                      rounded-[12px] bg-indigo-600 px-5 py-2.5
                      text-[11px] font-extrabold text-white
                      shadow-lg shadow-indigo-600/20
                      transition-all duration-200
                      hover:-translate-y-0.5 hover:bg-indigo-700
                      disabled:cursor-not-allowed disabled:opacity-60
                    "
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sign in */}
            <p className="mt-5 text-center text-[11px] text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-extrabold text-indigo-600 transition hover:text-indigo-700"
              >
                Sign in
              </Link>
            </p>

            {/* Security footer */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[9px] font-medium text-gray-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Your connection is secure and encrypted
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SecureRegisterPage;