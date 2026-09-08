import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  TrendingUp,
  Plus,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Zap,
  Star,
  CircleDollarSign,
  Send,
  Receipt,
  BadgeCheck,
  Smartphone,
} from "lucide-react";
import LogoImg from "../images/logo.png";

/* ============================================================
   ANIMATION
============================================================ */

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/* ============================================================
   LOGO
============================================================ */

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center">
      <img
        src={LogoImg}
        alt="Trustybank"
        width={120}
        className="-ms-5"
      />
    </Link>
  );
}

/* ============================================================
   ANIMATED BALANCE
============================================================ */

const BALANCES = [
  "$1,284,500.00",
  "$1,312,800.00",
  "$978,250.00",
  "$2,045,000.00",
  "$1,560,400.00",
  "$832,900.00",
  "$1,728,650.00",
];

function AnimatedBalance() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndex((i) => (i + 1) % BALANCES.length);
        setVisible(true);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      <p className="text-xl font-bold tracking-tight text-gray-900">
        {BALANCES[index]}
      </p>
    </div>
  );
}

/* ============================================================
   PULSING SHIELD
============================================================ */

function PulsingShield() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute rounded-full bg-indigo-400/15"
        animate={{
          scale: [1, 1.7, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: 52,
          height: 52,
        }}
      />

      <motion.div
        className="absolute rounded-full bg-indigo-500/20"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.6, 0.1, 0.6],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
        style={{
          width: 40,
          height: 40,
        }}
      />

      <motion.div
        className="relative flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50"
        animate={{
          boxShadow: [
            "0 0 0px 0px rgba(99,102,241,0)",
            "0 0 10px 4px rgba(99,102,241,0.3)",
            "0 0 0px 0px rgba(99,102,241,0)",
          ],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
      </motion.div>
    </div>
  );
}

/* ============================================================
   CHART
============================================================ */

const CHART_DATASETS = [
  [35, 45, 40, 58, 50, 68, 62, 78, 70, 85, 76, 92],
  [60, 42, 55, 70, 48, 80, 65, 55, 88, 72, 90, 78],
  [20, 50, 38, 65, 45, 72, 58, 80, 68, 88, 75, 95],
  [45, 30, 60, 52, 75, 55, 82, 60, 78, 65, 88, 70],
];

const CHART_LABELS = ["May", "Jun", "Jul", "Aug", "Sep"];
const RANGE_LABELS = ["1W", "1M", "3M", "6M", "1Y"];

function AnimatedChart() {
  const [dataIdx, setDataIdx] = useState(0);
  const [rangeIdx, setRangeIdx] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const heights = CHART_DATASETS[dataIdx];

  const menuActions = [
    "Export CSV",
    "Share report",
    "Set alert",
    "View full history",
  ];

  useEffect(() => {
    function handleClick(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {RANGE_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => {
                setRangeIdx(i);
                setDataIdx(i % CHART_DATASETS.length);
              }}
              className={`rounded-lg px-2 py-1 text-[9px] font-bold transition-all ${
                rangeIdx === i
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
                y: -4,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10"
            >
              {menuActions.map((action) => (
                <button
                  key={action}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={() => setMenuOpen(false)}
                >
                  {action}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex h-28 items-end gap-1.5">
        {heights.map((height, i) => (
          <motion.div
            key={`${dataIdx}-${i}`}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{
              duration: 0.5,
              delay: i * 0.04,
              ease,
            }}
            className="flex-1 cursor-pointer rounded-t-md bg-indigo-100 transition-colors hover:bg-indigo-400"
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[9px] font-medium text-gray-400">
        {CHART_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   TRANSACTIONS
============================================================ */

const transactions = [
  {
    title: "Salary",
    subtitle: "Today · 09:42 AM",
    amount: "+ $850,000.00",
    positive: true,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Electricity",
    subtitle: "Yesterday · 04:18 PM",
    amount: "- $42,500.00",
    positive: false,
    iconClass: "bg-orange-50 text-orange-600",
  },
  {
    title: "Transfer",
    subtitle: "Aug 31 · 01:26 PM",
    amount: "- $75,000.00",
    positive: false,
    iconClass: "bg-blue-50 text-blue-600",
  },
];

/* ============================================================
   BANK CARD
============================================================ */

function BankCard() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.94,
        rotate: 1,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0,
      }}
      transition={{
        duration: 0.9,
        delay: 0.15,
        ease,
      }}
      className="relative mx-auto w-full max-w-[440px]"
    >
      <div className="absolute -inset-10 rounded-[4rem] bg-indigo-200/40 blur-3xl" />

      <div className="relative aspect-[1.58/1] overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 p-6 text-white shadow-2xl shadow-indigo-700/25 sm:p-8">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/15" />

        <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border border-white/10" />

        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(105deg, transparent, transparent 10px, rgba(255,255,255,0.5) 11px, transparent 12px)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                  <Sparkles className="h-4 w-4" />
                </div>

                <span className="text-sm font-bold tracking-wide">
                  TRUSTYBANK
                </span>
              </div>

              <p className="mt-0.5 text-[10px] tracking-[0.2em] text-indigo-100">
                Everyday Debit
              </p>
            </div>

            <div className="flex items-center">
              <div
                className="h-8 w-8 rounded-full bg-[#eb001b] opacity-90"
                style={{
                  boxShadow:
                    "0 0 10px rgba(235,0,27,0.4)",
                }}
              />

              <div
                className="-ml-3.5 h-8 w-8 rounded-full bg-[#f79e1b] opacity-90"
                style={{
                  boxShadow:
                    "0 0 10px rgba(247,158,27,0.4)",
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="relative h-9 w-12 overflow-hidden rounded-[5px] bg-gradient-to-br from-[#f5d77b] via-[#e8b94f] to-[#c8860a] shadow-sm">
                <div className="absolute inset-[3px] rounded-[3px]">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px]">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[1px] border border-[#a8720a]/40 bg-[#e8b94f]/30"
                      />
                    ))}
                  </div>

                  <div className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-[#a8720a]/50" />

                  <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-[#a8720a]/50" />
                </div>
              </div>
            </div>

            <p className="font-mono text-lg tracking-[0.18em] text-white/95 sm:text-xl">
              5399&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;2841
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 text-[8px] tracking-[0.2em] text-indigo-100/70">
                Cardholder
              </p>

              <p className="text-xs font-semibold tracking-widest">
                YOUR NAME
              </p>
            </div>

            <div>
              <p className="mb-1 text-[8px] tracking-[0.2em] text-indigo-100/70">
                Expires
              </p>

              <p className="text-xs font-semibold">
                09/29
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.65,
          delay: 0.75,
          ease,
        }}
        className="absolute -bottom-7 -left-4 w-[200px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-900/10 sm:-left-10"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-500">
            Available balance
          </span>

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        </div>

        <AnimatedBalance />

        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          Account in good standing
        </div>
      </motion.div>

      <motion.div
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.65,
          delay: 0.95,
          ease,
        }}
        className="absolute -right-3 top-10 flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-2 shadow-lg shadow-indigo-900/10 sm:-right-8"
      >
        <PulsingShield />

        <div>
          <p className="text-[10px] font-bold text-gray-900">
            Secure banking
          </p>

          <p className="text-[9px] text-gray-400">
            Protected access
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   PHONE MOCKUP
   ONLY ONE PHONE — USED IN MOBILE APP SECTION
============================================================ */

function PhoneMockup() {
  return (
    <motion.div
      initial={{
        y: 30,
        rotate: 4,
        opacity: 0,
      }}
      whileInView={{
        y: 0,
        rotate: 4,
        opacity: 1,
      }}
      viewport={{
        once: true,
        amount: 0.25,
      }}
      transition={{
        duration: 0.9,
        ease,
      }}
      className="relative z-30 w-[190px] sm:w-[215px] lg:w-[230px]"
    >
      <div className="relative rounded-[38px] bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 p-[2.5px] shadow-[0_40px_90px_rgba(36,32,96,0.22),0_0_0_1px_rgba(255,255,255,0.6)_inset]">
        <div className="absolute -left-[2px] top-[90px] h-7 w-[3px] rounded-l-full bg-slate-300" />

        <div className="absolute -left-[2px] top-[125px] h-12 w-[3px] rounded-l-full bg-slate-300" />

        <div className="absolute -right-[2px] top-[110px] h-16 w-[3px] rounded-r-full bg-slate-300" />

        <div className="relative overflow-hidden rounded-[35.5px] bg-white">
          <div className="pointer-events-none absolute inset-0 z-10 rounded-[35.5px] bg-gradient-to-br from-white/40 via-transparent to-transparent" />

          <div className="m-[5px] overflow-hidden rounded-[30px] bg-white shadow-inner">
            <div className="flex justify-center pt-2.5">
              <div className="flex h-[18px] w-[78px] items-center justify-center gap-1.5 rounded-full bg-black">
                <div className="h-[6px] w-[6px] rounded-full bg-slate-800/80" />

                <div className="h-[6px] w-[6px] rounded-full bg-slate-800/60 ring-1 ring-slate-600/30" />
              </div>
            </div>

            <div className="flex items-center justify-between px-4 pb-1 pt-1.5 text-[9px] font-semibold text-slate-900">
              <span className="tracking-tight">
                9:41
              </span>

              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="10"
                  viewBox="0 0 12 10"
                  fill="currentColor"
                  className="text-slate-900"
                >
                  <rect x="0" y="6" width="2" height="4" rx="0.5" />
                  <rect x="3.2" y="4" width="2" height="6" rx="0.5" />
                  <rect x="6.4" y="2" width="2" height="8" rx="0.5" />
                  <rect x="9.6" y="0" width="2" height="10" rx="0.5" />
                </svg>

                <div className="relative h-[9px] w-[18px] rounded-[2.5px] border border-slate-900/80 p-[1px]">
                  <div className="h-full w-[70%] rounded-[1px] bg-slate-900" />
                </div>
              </div>
            </div>

            <div className="px-3.5 pb-4 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-black text-white shadow-md shadow-indigo-200">
                    P
                  </div>

                  <div>
                    <p className="text-[8px] font-medium text-slate-400">
                      Good morning
                    </p>

                    <p className="text-[12px] font-bold tracking-tight text-slate-900">
                      Lyon
                    </p>
                  </div>
                </div>

                <div className="relative grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                  <Bell size={13} />

                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white" />
                </div>
              </div>

              <div className="relative mt-3.5 overflow-hidden rounded-[18px] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-3.5 text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)]">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-[7px] font-medium tracking-wider text-indigo-100/80">
                      Total balance
                    </p>

                    <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[6px] font-bold backdrop-blur">
                      VISA
                    </span>
                  </div>

                  <p className="mt-1.5 text-[22px] font-black tracking-[-0.04em]">
                    ₦1,284,500
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-mono text-[8px] tracking-widest text-indigo-100/70">
                      •••• 8294
                    </span>

                    <span className="flex items-center gap-1 text-[7px] font-semibold text-emerald-300">
                      <TrendingUp size={9} />
                      +12.8%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                {[
                  [
                    "Send",
                    ArrowUpRight,
                    "bg-indigo-50 text-indigo-600",
                  ],
                  [
                    "Pay",
                    CreditCard,
                    "bg-violet-50 text-violet-600",
                  ],
                  [
                    "Add",
                    Plus,
                    "bg-emerald-50 text-emerald-600",
                  ],
                  [
                    "More",
                    MoreHorizontal,
                    "bg-slate-50 text-slate-600",
                  ],
                ].map(([label, Icon, colors]) => (
                  <div key={label} className="text-center">
                    <div
                      className={`mx-auto grid h-9 w-9 place-items-center rounded-2xl ${colors} shadow-sm`}
                    >
                      <Icon size={13} strokeWidth={2.2} />
                    </div>

                    <span className="mt-1 block text-[7px] font-semibold text-slate-500">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-900">
                    Recent
                  </p>

                  <span className="text-[7px] font-semibold text-indigo-600">
                    See all
                  </span>
                </div>

                <div className="space-y-0.5">
                  {[
                    [
                      "Netflix",
                      "Entertainment",
                      "-₦4,500",
                      "bg-rose-50 text-rose-500",
                    ],
                    [
                      "Salary",
                      "Income",
                      "+₦480,000",
                      "bg-emerald-50 text-emerald-600",
                    ],
                    [
                      "Bolt",
                      "Transport",
                      "-₦8,200",
                      "bg-amber-50 text-amber-600",
                    ],
                  ].map(
                    ([name, cat, amount, badge]) => (
                      <div
                        key={name}
                        className="flex items-center gap-2.5 rounded-xl px-1 py-1.5"
                      >
                        <div
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[9px] font-bold ${badge}`}
                        >
                          {name[0]}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[9px] font-semibold text-slate-800">
                            {name}
                          </p>

                          <p className="text-[7px] text-slate-400">
                            {cat}
                          </p>
                        </div>

                        <span
                          className={`text-[9px] font-bold ${
                            amount.startsWith("+")
                              ? "text-emerald-500"
                              : "text-slate-700"
                          }`}
                        >
                          {amount}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   BREATHING ACTIVITY CARD
============================================================ */

const floatingActivities = [
  {
    id: "credit",
    icon: CircleDollarSign,
    title: "$300 credited",
    subtitle: "Money received",
    position:
      "left-0 top-[10%] sm:-left-8 sm:top-[12%] lg:-left-20 lg:top-[16%]",
    iconClass: "bg-emerald-50 text-emerald-600",
    amount: "+$300",
    amountClass: "text-emerald-600",
    delay: 0,
    duration: 4.2,
  },
  {
    id: "debit",
    icon: CreditCard,
    title: "$5,000 debit",
    subtitle: "Salary",
    position:
      "right-0 top-[5%] sm:-right-8 sm:top-[8%] lg:-right-24 lg:top-[10%]",
    iconClass: "bg-rose-50 text-rose-600",
    amount: "-$5,000",
    amountClass: "text-rose-600",
    delay: 0.6,
    duration: 4.7,
  },
  {
    id: "load",
    icon: BadgeCheck,
    title: "Loan approved",
    subtitle: "Car funding",
    position:
      "left-0 top-[43%] sm:-left-12 sm:top-[40%] lg:-left-32 lg:top-[43%]",
    iconClass: "bg-indigo-50 text-indigo-600",
    amount: "Approved",
    amountClass: "text-indigo-600",
    delay: 1.1,
    duration: 4.4,
  },
  {
    id: "transfer",
    icon: Send,
    title: "Transfer received",
    subtitle: "Just now",
    position:
      "right-0 top-[40%] sm:-right-12 sm:top-[43%] lg:-right-32 lg:top-[45%]",
    iconClass: "bg-blue-50 text-blue-600",
    amount: "+$850",
    amountClass: "text-blue-600",
    delay: 1.7,
    duration: 5,
  },
  {
    id: "payment",
    icon: Receipt,
    title: "Payment successful",
    subtitle: "Netflix · Today",
    position:
      "left-[8%] bottom-[4%] sm:-left-2 sm:bottom-[7%] lg:-left-12 lg:bottom-[5%]",
    iconClass: "bg-violet-50 text-violet-600",
    amount: "Paid",
    amountClass: "text-violet-600",
    delay: 2.1,
    duration: 4.6,
  },
  {
    id: "card",
    icon: Smartphone,
    title: "Card activated",
    subtitle: "Ready to use",
    position:
      "right-[8%] bottom-[2%] sm:-right-2 sm:bottom-[6%] lg:-right-14 lg:bottom-[5%]",
    iconClass: "bg-amber-50 text-amber-600",
    amount: "Active",
    amountClass: "text-amber-600",
    delay: 2.7,
    duration: 4.3,
  },
];

function BreathingActivityCard({
  activity,
}) {
  const Icon = activity.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
        y: 12,
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.65,
        delay: activity.delay,
        ease,
      }}
      animate={{
        y: [0, -7, 0, 6, 0],
      }}
      style={{
        animationDuration: `${activity.duration}s`,
      }}
      className={`absolute z-40 ${activity.position}`}
    >
      <motion.div
        animate={{
          boxShadow: [
            "0 12px 30px rgba(79,70,229,0.07)",
            "0 20px 42px rgba(79,70,229,0.15)",
            "0 12px 30px rgba(79,70,229,0.07)",
          ],
        }}
        transition={{
          duration: activity.duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: activity.delay,
        }}
        className="flex min-w-[145px] items-center gap-2.5 rounded-2xl border border-white/90 bg-white/95 px-3 py-2.5 backdrop-blur-xl sm:min-w-[165px] sm:gap-3 sm:px-3.5 sm:py-3"
      >
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: activity.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${activity.iconClass}`}
        >
          <Icon className="h-4 w-4 sm:h-[17px] sm:w-[17px]" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold tracking-tight text-gray-900 sm:text-[11px]">
            {activity.title}
          </p>

          <p className="mt-0.5 truncate text-[8px] font-medium text-gray-400 sm:text-[9px]">
            {activity.subtitle}
          </p>
        </div>

        <span
          className={`shrink-0 text-[9px] font-extrabold sm:text-[10px] ${activity.amountClass}`}
        >
          {activity.amount}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   PHONE + BREATHING CARDS HERO
============================================================ */

function PhoneActivityVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-100/70 blur-3xl sm:h-[380px] sm:w-[380px]" />

      {/* Soft secondary glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/60 blur-3xl sm:h-[300px] sm:w-[300px]"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.45, 0.7, 0.45],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Visual stage */}
      <div className="relative mx-auto h-[530px] w-full sm:h-[570px]">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-100/70 sm:h-[350px] sm:w-[350px]" />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-100/40 sm:h-[410px] sm:w-[410px]"
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Breathing cards */}
        {floatingActivities.map((activity) => (
          <BreathingActivityCard
            key={activity.id}
            activity={activity}
          />
        ))}

        {/* Phone */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <PhoneMockup />
        </div>

        {/* Bottom glow */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 h-16 w-44 -translate-x-1/2 rounded-full bg-indigo-300/25 blur-2xl" />
      </div>
    </div>
  );
}

/* ============================================================
   MONEY DASHBOARD
============================================================ */

function MoneyDashboard() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-indigo-200/30 blur-2xl" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-white shadow-2xl shadow-indigo-900/[0.08]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold text-gray-400">
              Personal account
            </p>

            <p className="mt-1 text-sm font-extrabold text-gray-900">
              Main Account
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
            <WalletCards className="h-4 w-4 text-indigo-600" />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-gray-400">
            Available balance
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="text-3xl font-extrabold tracking-tight text-gray-900">
              $1,284,500.00
            </p>

            <span className="mb-1 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              8.4%
            </span>
          </div>

          <AnimatedChart />

          <div className="mt-7 border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-900">
                Recent transactions
              </p>

              <span className="text-[10px] font-bold text-indigo-600">
                View all
              </span>
            </div>

            <div className="space-y-3">
              {transactions.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.iconClass}`}
                    >
                      <Banknote className="h-3.5 w-3.5" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-gray-900">
                        {t.title}
                      </p>

                      <p className="text-[9px] text-gray-400">
                        {t.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold ${
                      t.positive
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STAT STRIP
============================================================ */

function StatStrip() {
  const stats = [
    {
      value: "250k+",
      label: "Customers worldwide",
    },
    {
      value: "99.98%",
      label: "Uptime this year",
    },
    {
      value: "$2.1B+",
      label: "Processed monthly",
    },
    {
      value: "< 2s",
      label: "Average transfer time",
    },
  ];

  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 md:grid-cols-4 md:divide-y-0">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center px-4 py-8 text-center"
            >
              <span className="text-2xl font-extrabold tracking-tight text-indigo-600 sm:text-3xl">
                {value}
              </span>

              <span className="mt-1.5 text-xs font-medium text-gray-500">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCTS
============================================================ */

const products = [
  {
    icon: WalletCards,
    title: "Everyday Banking",
    description:
      "A simple, dependable account for everyday spending, saving and payments.",
    link: "Explore accounts",
    iconClass: "bg-indigo-50 text-indigo-600",
    hoverClass: "group-hover:bg-indigo-100",
  },
  {
    icon: CreditCard,
    title: "Debit Cards",
    description:
      "A secure card experience designed for the way you spend today.",
    link: "Discover cards",
    iconClass: "bg-blue-50 text-blue-600",
    hoverClass: "group-hover:bg-blue-100",
  },
  {
    icon: BarChart3,
    title: "Smart Money Management",
    description:
      "Keep an eye on balances, transactions and your financial activity from one place.",
    link: "Learn more",
    iconClass: "bg-emerald-50 text-emerald-600",
    hoverClass: "group-hover:bg-emerald-100",
  },
];

/* ============================================================
   SECURITY
============================================================ */

function SecurityBand() {
  const features = [
    [
      LockKeyhole,
      "Protected access",
      "Keep your account protected with secure authentication.",
    ],
    [
      ShieldCheck,
      "Transaction controls",
      "Stay informed and in control of your account activity.",
    ],
    [
      CheckCircle2,
      "Clear status",
      "Know what is happening with your transactions in real time.",
    ],
    [
      Zap,
      "Responsive support",
      "Get help when you need assistance with your account.",
    ],
  ];

  return (
    <section
      id="security"
      className="relative scroll-mt-28 overflow-hidden bg-indigo-700 py-24 text-white sm:py-28"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />

      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/10" />

      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1fr]">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.65,
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>

            <h2 className="mt-6 max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built with security at the center.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-indigo-100 sm:text-base">
              Banking should give you confidence. Trustybank is designed around
              secure access, transaction controls and clear account activity.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.15,
            }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2"
          >
            {features.map(([Icon, title, text]) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="rounded-2xl border border-white/10 bg-white/10 p-6 transition-colors hover:bg-white/[0.14]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-indigo-100" />
                </div>

                <h3 className="mt-5 text-sm font-extrabold">
                  {title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-indigo-100/70">
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */

function Footer({ scrollToSection }) {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <img
              src={LogoImg}
              alt="Trustybank"
              width={150}
              height={100}
            />

            <p className="max-w-sm text-xs leading-5 text-gray-400">
              Modern banking designed to make managing your money feel simpler.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500">
            {[
              ["products", "Banking"],
              ["security", "Security"],
              ["support", "Support"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="transition-colors hover:text-indigo-600"
              >
                {label}
              </button>
            ))}

            <Link
              to="/login"
              className="transition-colors hover:text-indigo-600"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-gray-100 pt-6 text-[10px] font-medium text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Trustybank. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-indigo-100 bg-white/95 px-4 shadow-lg shadow-indigo-900/5 backdrop-blur-xl sm:px-5">
            <Logo />

            <div className="hidden items-center gap-8 md:flex">
              {[
                ["products", "Banking"],
                ["security", "Security"],
                ["support", "Support"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-indigo-600"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
              >
                Open an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((v) => !v)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {mobileMenuOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-indigo-100 bg-white p-3 shadow-xl sm:hidden">
                {[
                  ["products", "Banking"],
                  ["security", "Security"],
                  ["support", "Support"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      scrollToSection(id)
                    }
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    {label}
                  </button>
                ))}

                <div className="my-2 h-px bg-gray-100" />

                <Link
                  to="/login"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-indigo-50"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Open an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-gray-50 to-blue-50 pt-36 sm:pt-40"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

            <div className="absolute right-0 top-10 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl" />

            <svg
              className="absolute right-0 top-0 h-full w-1/2 opacity-[0.025]"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="hero-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-indigo-900"
                  />
                </pattern>
              </defs>

              <rect
                width="100%"
                height="100%"
                fill="url(#hero-grid)"
              />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">

            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                ease,
              }}
              className="mb-10 flex flex-wrap items-center gap-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-2 shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50">
                  <Zap className="h-3 w-3 text-indigo-600" />
                </span>

                <span className="text-xs font-bold text-indigo-700">
                  Banking designed around you
                </span>
              </span>

              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}

                <span className="ml-1">
                  4.9 · 250k+ customers
                </span>
              </span>
            </motion.div>

            <div className="grid items-center gap-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20">

              {/* COPY */}

              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="max-w-2xl"
              >
                <motion.h1
                  variants={fadeUp}
                  className="max-w-2xl text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-gray-900 sm:text-6xl lg:text-[5.5rem]"
                >
                  All you need.
                  <span className="block text-indigo-600">
                    One simple bank.
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-7 max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8"
                >
                  A modern banking experience that gives you a clearer view of
                  your money, easier everyday transactions, and the confidence
                  to manage your finances your way.
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="mt-9 flex flex-col gap-3 sm:flex-row"
                >
                  <Link
                    to="/register"
                    className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl"
                  >
                    Open an account

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      scrollToSection("products")
                    }
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    Explore banking
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-gray-500"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Secure access
                  </span>

                  <span className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-indigo-600" />
                    Protected transactions
                  </span>
                </motion.div>
              </motion.div>

              {/* BANK CARD ONLY
                  PHONE HAS BEEN REMOVED FROM HERO */}

              <div className="relative py-6 lg:py-10">
                <BankCard />

                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 1.05,
                    ease,
                  }}
                  className="absolute -bottom-24 right-0 hidden w-60 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-indigo-900/10 sm:block lg:-right-8"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Recent activity
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Your latest transactions
                      </p>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
                      <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div
                        key={t.title + t.amount}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.iconClass}`}
                          >
                            <Banknote className="h-3 w-3" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-gray-900">
                              {t.title}
                            </p>

                            <p className="text-[9px] text-gray-400">
                              {t.subtitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 text-[10px] font-bold ${
                            t.positive
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {t.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            STATS
        ==================================================== */}

        <StatStrip />

        {/* ====================================================
            PRODUCTS
        ==================================================== */}

        <section
          id="products"
          className="scroll-mt-28 bg-gray-50 py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              variants={fadeUp}
              className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Banking, simplified.
                </h2>

                <p className="mt-4 text-base leading-7 text-gray-500">
                  One beautifully connected place for everyday spending, cards
                  and smarter money management.
                </p>
              </div>

              <Link
                to="/register"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
              >
                Open an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.12,
              }}
              variants={stagger}
              className="mt-12 grid gap-5 md:grid-cols-3"
            >
              {products.map((product) => {
                const Icon = product.icon;

                return (
                  <motion.div
                    key={product.title}
                    variants={fadeUp}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/[0.06]"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${product.iconClass} ${product.hoverClass} transition-colors`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-7 text-lg font-extrabold tracking-tight text-gray-900">
                      {product.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        scrollToSection("support")
                      }
                      className="mt-7 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      {product.link}

                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-indigo-50 transition-transform duration-500 group-hover:scale-150" />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            MOBILE APP
            ONE PHONE + SIX BREATHING ACTIVITY CARDS
        ==================================================== */}

        <section className="overflow-hidden bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

              {/* COPY */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.7,
                }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-indigo-600" />

                  <span className="text-[10px] font-bold text-indigo-700">
                    Everything in one place
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl">
                  Your bank, always in your pocket.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-gray-500">
                  A beautifully designed mobile experience that keeps your
                  money, cards, transfers and notifications close at hand.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Real-time balance & activity",
                    "Instant notifications",
                    "Secure biometric login",
                    "Quick transfers & payments",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      </div>

                      <span className="text-sm font-bold text-gray-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/register"
                  className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Get started

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              {/* PHONE VISUAL */}

              <div className="relative min-w-0">
                <PhoneActivityVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            MONEY MANAGEMENT
        ==================================================== */}

        <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <motion.div
                initial={{
                  opacity: 0,
                  x: -30,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.7,
                }}
              >
                <MoneyDashboard />
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                variants={stagger}
              >
                <motion.div variants={fadeUp}>
                  <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl">
                    Know where your money stands.
                  </h2>

                  <p className="mt-5 max-w-xl text-base leading-7 text-gray-500">
                    Your banking dashboard brings balances, account activity and
                    transactions together — so you spend less time searching and
                    more time deciding.
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 space-y-4"
                >
                  {[
                    "Simple account management",
                    "Secure transaction controls",
                    "Real-time account visibility",
                    "Dedicated customer support",
                  ].map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      </div>

                      <span className="text-sm font-bold text-gray-700">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-9"
                >
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2 text-sm font-extrabold text-indigo-600 hover:text-indigo-700"
                  >
                    Start banking with us

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECURITY
        ==================================================== */}

        <SecurityBand />

        {/* ====================================================
            RECEIPTS
        ==================================================== */}

        <section className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.7,
              }}
              className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 sm:p-12"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-200/20 blur-3xl" />

              <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Expecting a payment?
                  </h2>

                  <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
                    Instantly view, download and share receipts for every
                    transaction. Stay organised and never lose track of your money.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/receipt"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                    >
                      View receipts

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50"
                    >
                      Open an account
                    </Link>
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-sm">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-indigo-900/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          Latest receipt
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                          Salary · Aug 2025
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Amount
                        </span>

                        <span className="font-bold text-emerald-600">
                          + $850,000.00
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Date
                        </span>

                        <span className="font-semibold text-gray-900">
                          08 Sep 2025
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Status
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Cleared
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/receipt"
                      className="mt-6 flex w-full items-center justify-center rounded-xl bg-indigo-50 py-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      View receipt
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ====================================================
            CTA
        ==================================================== */}

        <section
          id="support"
          className="scroll-mt-28 bg-gray-50 py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.7,
              }}
            >
              <div className="relative overflow-hidden rounded-[2rem] bg-indigo-700 px-8 py-16 text-white shadow-2xl shadow-indigo-700/20 sm:px-14 sm:py-20">
                <div className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full border border-white/10" />

                <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                  }}
                />

                <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                      Banking that feels like it should.
                    </h2>

                    <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100">
                      Open your account today and experience a cleaner, calmer
                      way to manage your money — no noise, no friction.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <Link
                      to="/register"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50 lg:w-auto"
                    >
                      Open an account
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white/15 lg:w-auto"
                    >
                      Sign in
                      <MoveUpRight className="h-4 w-4" />
                    </Link>

                    <p className="mt-2 text-center text-xs text-indigo-200 lg:text-right">
                      Trusted by 250,000+ customers
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  );
}