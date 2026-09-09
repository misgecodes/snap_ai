"use client";

import {
  ArrowUpRight,
  Check,
  CircleHelp,
  FileImage,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  Sparkles,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getExpenseSummary, getExpenses, processExpense } from "@/services/ai";
import { uploadReceipt } from "@/services/cloudinary";
import { getCurrentUser, logout, type UserProfile } from "@/services/auth";
import type {
  CategorySummary,
  Expense,
  ExpensePeriodSummary,
  ProcessExpenseResponse,
} from "@/types/expense";

type FlowState = "idle" | "uploading" | "processing" | "success" | "error";

const categoryStyles: Record<string, string> = {
  "Food & Dining": "bg-[#fff0e8] text-[#e45b35]",
  Transport: "bg-[#e9f1f8] text-[#3d6588]",
  Shopping: "bg-[#f0ebfa] text-[#7454a5]",
  Groceries: "bg-[#e8f4ed] text-[#377957]",
  Subscriptions: "bg-[#f1f0ed] text-[#65645d]",
};

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "—";
  const currencyCode = currency === "$" ? "USD" : currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toFixed(2)}`;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatPeriod(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function categoryClass(category: string | null) {
  return categoryStyles[category || ""] || "bg-[#f1f0ed] text-[#65645d]";
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [result, setResult] = useState<ProcessExpenseResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const [periodSummary, setPeriodSummary] =
    useState<ExpensePeriodSummary | null>(null);
  const [errorStage, setErrorStage] = useState<FlowState>("error");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const resetFlow = () => {
    setFlowState("idle");
    setResult(null);
    setErrorMessage("");
    setIsSheetOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    getCurrentUser()
      .then((profile) => {
        startTransition(() => {
          setCurrentUser(profile);
          setIsAuthChecked(true);
        });
      })
      .catch(() => {
        // getCurrentUser handles invalid sessions by redirecting to /login.
      });
  }, [router]);

  useEffect(() => {
    Promise.all([getExpenses(), getExpenseSummary()])
      .then(([expenseList, loadedPeriodSummary]) => {
        setExpenses(expenseList.expenses);
        setSummary(loadedPeriodSummary.by_category);
        setPeriodSummary(loadedPeriodSummary);
        setIsDataLoaded(true);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load expenses.",
        );
        setIsDataLoaded(true);
      });
  }, []);

  const handleFile = async (file?: File) => {
    if (!file || flowState === "uploading" || flowState === "processing")
      return;
    setIsSheetOpen(false);
    setFlowState("uploading");
    let currentStage: FlowState = "uploading";
    try {
      const imageUrl = await uploadReceipt(file);
      currentStage = "processing";
      setFlowState("processing");
      const expense = await processExpense(imageUrl);
      const [persisted, loadedPeriodSummary] = await Promise.all([
        getExpenses(),
        getExpenseSummary(),
      ]);
      setResult(expense);
      setExpenses(persisted.expenses);
      setSummary(loadedPeriodSummary.by_category);
      setPeriodSummary(loadedPeriodSummary);
      setFlowState("success");
    } catch (error) {
      setErrorStage(currentStage);
      setErrorMessage(
        error instanceof Error ? error.message : "Please try again.",
      );
      setFlowState("error");
    }
  };

  const isBusy = flowState === "uploading" || flowState === "processing";

  if (!isAuthChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f5f2]">
        <div className="flex items-center gap-3 text-[13px] text-[#777b7e]">
          <LoaderCircle size={18} className="animate-spin text-[#f2532f]" />{" "}
          Preparing your workspace...
        </div>
      </main>
    );
  }

  if (false && isDataLoaded && expenses.length === 0) {
    return (
      <main className="min-h-screen bg-[#f6f5f2]">
        <header className="border-b border-[#deded9] bg-[#f6f5f2]/90">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#18212b] text-white">
                <Sparkles size={17} />
              </div>
              <span className="text-[18px] font-bold tracking-[-0.04em]">
                snap<span className="text-[#f2532f]">ai</span>
              </span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-3">
                <span className="hidden text-[12px] font-semibold text-[#777b7e] sm:block">
                  {currentUser?.full_name}
                </span>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="rounded-full p-2 text-[#777b7e] hover:bg-white"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="mx-auto flex max-w-[920px] flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-24">
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#18212b] text-white shadow-[0_16px_30px_rgba(24,33,43,0.14)]">
            <ReceiptText size={38} />
            <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2532f] text-white">
              <Sparkles size={15} />
            </span>
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f2532f]">
            A clear view starts here
          </p>
          <h1 className="font-serif text-[clamp(2.7rem,7vw,5rem)] leading-[0.92] tracking-[-0.07em] text-[#18212b]">
            Make your first
            <br />
            expense count.
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#777b7e]">
            Upload a receipt and SnapAI will turn the small details into a
            simple picture of your spending. Your overview, categories, and
            activity will fill in as you go.
          </p>
          <label className="mt-9 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f2532f] px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(242,83,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#dc4526]">
            <Upload size={17} /> Upload your first receipt
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          <div className="mt-12 grid w-full max-w-[660px] gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-[#deded9] bg-white p-4">
              <ReceiptText size={18} className="mb-5 text-[#f2532f]" />
              <p className="text-[13px] font-bold">Capture once</p>
              <p className="mt-1 text-[11px] leading-5 text-[#929594]">
                Upload a receipt from your camera roll.
              </p>
            </div>
            <div className="rounded-2xl border border-[#deded9] bg-white p-4">
              <Sparkles size={18} className="mb-5 text-[#f2532f]" />
              <p className="text-[13px] font-bold">Let AI sort it</p>
              <p className="mt-1 text-[11px] leading-5 text-[#929594]">
                Merchant, amount, date, and category are extracted for you.
              </p>
            </div>
            <div className="rounded-2xl border border-[#deded9] bg-white p-4">
              <WalletCards size={18} className="mb-5 text-[#f2532f]" />
              <p className="text-[13px] font-bold">See the pattern</p>
              <p className="mt-1 text-[11px] leading-5 text-[#929594]">
                Your dashboard grows into a clearer spending picture.
              </p>
            </div>
          </div>
          {(isBusy || flowState === "error") && (
            <div className="mt-8 rounded-2xl border border-[#deded9] bg-white px-5 py-4 text-[13px] text-[#777b7e]">
              {isBusy ? "Reading your receipt..." : errorMessage}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2]">
      <header className="border-b border-[#deded9] bg-[#f6f5f2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#18212b] text-white">
              <Sparkles size={17} />
            </div>
            <span className="text-[18px] font-bold tracking-[-0.04em]">
              snap<span className="text-[#f2532f]">ai</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Help"
              className="hidden rounded-full p-2 text-[#7b7e80] hover:bg-white md:block"
            >
              <CircleHelp size={18} />
            </button>
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  aria-label="Open profile menu"
                  aria-expanded={isProfileMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-[#dcdcd7] bg-white px-3 py-1.5 text-[12px] font-semibold"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd9cc] text-[10px] text-[#bc4b2d]">
                    {currentUser.full_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="hidden sm:block">
                    {currentUser.full_name}
                  </span>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-[#deded9] bg-white p-3 shadow-[0_14px_35px_rgba(24,33,43,0.12)]">
                    <p className="truncate px-2 py-1 text-[13px] font-bold">
                      {currentUser.full_name}
                    </p>
                    <p className="truncate px-2 pb-2 text-[11px] text-[#929594]">
                      {currentUser.email}
                    </p>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[12px] font-semibold text-[#777b7e] hover:bg-[#fff0e8] hover:text-[#f2532f]"
                    >
                      <LogOut size={15} /> Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14 lg:px-12 lg:py-12">
        <aside className="hidden lg:block">
          <p className="mb-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a9a96]">
            Workspace
          </p>
          <div className="space-y-1">
            <a
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-[13px] font-semibold shadow-[0_2px_10px_rgba(24,33,43,0.04)]"
              href="#overview"
            >
              <LayoutDashboard size={17} className="text-[#f2532f]" /> Overview
            </a>
            <a
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#777b7e] hover:bg-white"
              href="#activity"
            >
              <ReceiptText size={17} /> Transactions
            </a>
            <a
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#777b7e] hover:bg-white"
              href="#insights"
            >
              <Sparkles size={17} /> Insights
            </a>
          </div>
          <div className="mt-12 border-t border-[#deded9] pt-5">
            <a
              className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#777b7e]"
              href="#settings"
            >
              <Settings size={17} /> Settings
            </a>
          </div>
        </aside>

        <section id="overview" className="min-w-0">
          <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[13px] text-[#797d80]">
                {periodSummary
                  ? formatPeriod(
                      periodSummary.start_date,
                      periodSummary.end_date,
                    )
                  : "Loading expense period..."}
              </p>
              <h1 className="font-serif text-[clamp(2.2rem,5vw,3.7rem)] leading-none tracking-[-0.055em] text-[#18212b]">
                Hi, {currentUser ? getFirstName(currentUser.full_name) : "there"} <span className="text-[0.8em]">✦</span>
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-6 text-[#777b7e]">
                Your spending, made simple. Snap a receipt and let AI keep
                things clear.
              </p>
            </div>
            <button
              onClick={() => setIsSheetOpen(true)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#f2532f] px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(242,83,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#dc4526] sm:w-auto"
            >
              <Plus size={17} /> Add expense{" "}
              <ArrowUpRight size={15} className="ml-1 opacity-60" />
            </button>
          </div>
          <div
            className={`grid gap-4 ${periodSummary && Object.keys(periodSummary.total_by_currency).length === 1 ? "md:grid-cols-1" : "md:grid-cols-[1.15fr_0.85fr]"}`}
          >
            <div
              className={`grid gap-4 ${periodSummary && Object.keys(periodSummary.total_by_currency).length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}
            >
              {periodSummary && expenses.length > 0 ? (
                Object.entries(periodSummary.total_by_currency).map(
                  ([currency, total]) => (
                    <div
                      key={currency}
                      className="relative overflow-hidden rounded-2xl bg-[#18212b] p-6 text-white sm:p-8"
                    >
                      <div className="relative z-10">
                        <div className="mb-10 flex items-center justify-between">
                          <p className="text-[12px] text-[#b8c0c5]">
                            Spent this month
                          </p>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#d4dcdf]">
                            {formatPeriod(
                              periodSummary.start_date,
                              periodSummary.end_date,
                            )}
                          </span>
                        </div>
                        <p className="font-serif text-[clamp(2rem,5vw,3.8rem)] leading-none tracking-[-0.06em]">
                          {formatAmount(total, currency)}
                        </p>
                        <div className="mt-7 flex items-center gap-2 text-[12px] text-[#aeb8bd]">
                          <span className="font-semibold text-[#d4dcdf]">
                            {periodSummary.total_count} transactions
                          </span>
                          <span>in this period</span>
                        </div>
                      </div>
                      <div className="absolute -right-9 -top-16 h-56 w-56 rounded-full border-[26px] border-[#24323d]" />
                    </div>
                  ),
                )
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-[#18212b] p-6 text-white sm:p-8">
                  <div className="relative z-10">
                    <p className="text-[12px] text-[#b8c0c5]">
                      Spent this month
                    </p>
                    <p className="mt-10 font-serif text-[clamp(2rem,5vw,3.8rem)] leading-none tracking-[-0.06em]">
                      —
                    </p>
                  </div>
                </div>
              )}{" "}
            </div>
            <div className="rounded-2xl border border-[#deded9] bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-[#797d80]">Monthly budget</p>
                  <p className="mt-3 font-serif text-4xl tracking-[-0.06em]">
                    $1,200
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0e8] text-[#f2532f]">
                  <WalletCards size={17} />
                </div>
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#f0efeb]">
                <div className="h-full w-[40%] rounded-full bg-[#f2532f]" />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-[#888b8c]">
                <span>{periodSummary?.total_count ?? "—"} transactions</span>
                <span>
                  {periodSummary
                    ? formatPeriod(
                        periodSummary.start_date,
                        periodSummary.end_date,
                      )
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>
          <div id="activity" className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[25px] tracking-[-0.04em]">
                  Recent activity
                </h2>
                <p className="mt-1 text-[12px] text-[#929594]">
                  Your latest captured expenses
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-semibold text-[#f2532f]">
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#deded9] bg-white">
              <div className="hidden grid-cols-[1fr_150px_100px] border-b border-[#eeeDE9] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0a19d] sm:grid">
                <span>Merchant</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
              </div>
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e8] text-[#f2532f]"><ReceiptText size={22} /></div>
                  <p className="mt-4 text-[14px] font-bold">No expenses yet</p>
                  <p className="mt-1 max-w-sm text-[12px] leading-5 text-[#929594]">Upload your first receipt and SnapAI will organize the details here for you.</p>
                  <button onClick={() => setIsSheetOpen(true)} className="mt-5 flex items-center gap-2 rounded-xl bg-[#f2532f] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#dc4526]"><Upload size={15} /> Upload receipt</button>
                </div>
              ) : expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#eeeDE9] px-4 py-4 last:border-0 sm:grid-cols-[1fr_150px_100px] sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${categoryClass(expense.category)}`}
                    >
                      <ReceiptText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">
                        {expense.merchant || "Unknown merchant"}
                      </p>
                      <p className="truncate text-[11px] text-[#969997]">
                        {expense.reason ||
                          expense.expense_date ||
                          "Captured expense"}{" "}
                        ·{" "}
                        {expense.expense_date ||
                          expense.created_at.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`hidden w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold sm:block ${categoryClass(expense.category)}`}
                  >
                    {expense.category || "Uncategorized"}
                  </span>
                  <p className="text-right text-[13px] font-bold">
                    {formatAmount(expense.amount, expense.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div id="insights" className="mt-10">
            <div className="mb-4">
              <h2 className="font-serif text-[25px] tracking-[-0.04em]">
                Category summary
              </h2>
              <p className="mt-1 text-[12px] text-[#929594]">
                Totals and counts from your saved expenses
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.map((item) => (
                <div
                  key={item.category}
                  className="rounded-2xl border border-[#deded9] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${categoryClass(item.category)}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[12px] font-semibold text-[#797d80]">
                      {item.count} {item.count === 1 ? "expense" : "expenses"}
                    </span>
                  </div>
                  <div className="mt-5 space-y-2">
                    {Object.entries(item.totals_by_currency).map(
                      ([currency, total]) => (
                        <div
                          key={currency}
                          className="flex items-center justify-between text-[13px]"
                        >
                          <span className="text-[#797d80]">{currency}</span>
                          <span className="font-bold">
                            {formatAmount(total, currency)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            {summary.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#deded9] bg-white p-6 text-center text-[13px] text-[#929594]">
                Category totals will appear after your first expense. Upload a receipt to see your spending grouped automatically.
              </div>
            )}
          </div>
        </section>
      </div>

      {isSheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#18212b]/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            className="w-full max-w-[480px] rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[26px] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f2532f]">
                  Capture
                </p>
                <h2
                  id="add-expense-title"
                  className="font-serif text-3xl tracking-[-0.05em]"
                >
                  Add an expense
                </h2>
              </div>
              <button
                aria-label="Close"
                onClick={() => setIsSheetOpen(false)}
                className="rounded-full bg-[#f4f3f0] p-2 text-[#777b7e]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex min-h-[148px] flex-col items-start justify-between rounded-2xl bg-[#fff0e8] p-4 text-left transition hover:bg-[#ffe5da]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#f2532f]">
                  <Upload size={18} />
                </div>
                <span className="text-[14px] font-bold text-[#793622]">
                  Upload receipt
                  <span className="mt-1 block text-[11px] font-normal text-[#aa6b58]">
                    JPG, PNG or HEIC
                  </span>
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex min-h-[148px] flex-col items-start justify-between rounded-2xl bg-[#f3f5f5] p-4 text-left transition hover:bg-[#ebeeee]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#4e6770]">
                  <FileImage size={18} />
                </div>
                <span className="text-[14px] font-bold">
                  Choose from files
                  <span className="mt-1 block text-[11px] font-normal text-[#8b9293]">
                    Your camera roll
                  </span>
                </span>
              </button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[11px] leading-5 text-[#969997]">
              <Sparkles size={13} className="shrink-0 text-[#f2532f]" /> SnapAI
              reads the details and sorts everything for you.
            </p>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {(isBusy || flowState === "success" || flowState === "error") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18212b]/35 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-[26px] bg-white p-7 text-center shadow-2xl sm:p-9">
            {isBusy && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0e8] text-[#f2532f]">
                  <LoaderCircle size={29} className="animate-spin" />
                </div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f2532f]">
                  {flowState === "uploading" ? "Step 1 of 2" : "Step 2 of 2"}
                </p>
                <h2 className="font-serif text-3xl tracking-[-0.05em]">
                  {flowState === "uploading"
                    ? "Uploading receipt"
                    : "Reading your receipt"}
                </h2>
                <p className="mx-auto mt-3 max-w-xs text-[13px] leading-5 text-[#858a8b]">
                  {flowState === "uploading"
                    ? "Sending your image securely to Cloudinary."
                    : "SnapAI is finding the details and category."}
                </p>
                <div className="mx-auto mt-7 flex max-w-[230px] gap-1.5">
                  <span className="h-1.5 flex-1 rounded-full bg-[#f2532f]" />
                  <span
                    className={`h-1.5 flex-1 rounded-full ${flowState === "processing" ? "bg-[#f2532f]" : "bg-[#eeeDE9]"}`}
                  />
                </div>
              </>
            )}
            {flowState === "success" && result && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4ed] text-[#3e8b61]">
                  <Check size={30} />
                </div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#3e8b61]">
                  Expense detected
                </p>
                <p className="font-serif text-5xl tracking-[-0.07em]">
                  {formatAmount(result.amount, result.currency)}
                </p>
                <h2 className="mt-2 text-lg font-bold">
                  {result.merchant || "Unknown merchant"}
                </h2>
                <div className="mt-4 flex justify-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${categoryClass(result.category)}`}
                  >
                    {result.category || "Uncategorized"}
                  </span>
                  <span className="rounded-full bg-[#f1f0ed] px-3 py-1.5 text-[11px] text-[#737776]">
                    {result.date || "Date not provided"}
                  </span>
                </div>
                <p className="mt-4 text-[12px] text-[#939896]">
                  {result.reason || "Receipt captured successfully."}
                </p>
                <button
                  onClick={resetFlow}
                  className="mt-8 w-full rounded-xl bg-[#18212b] py-3 text-[13px] font-bold text-white hover:bg-[#263541]"
                >
                  Done
                </button>
              </>
            )}
            {flowState === "error" && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0e8] text-[#f2532f]">
                  <X size={28} />
                </div>
                <h2 className="font-serif text-3xl tracking-[-0.05em]">
                  {errorStage === "uploading"
                    ? "Upload needs setup"
                    : "Analysis failed"}
                </h2>
                <p className="mx-auto mt-3 max-w-xs text-[13px] leading-5 text-[#858a8b]">
                  {errorMessage ||
                    (errorStage === "uploading"
                      ? "We couldn’t upload your receipt. Please try again."
                      : "We uploaded your receipt, but couldn’t analyze it. Please try again.")}
                </p>
                <button
                  onClick={resetFlow}
                  className="mt-8 w-full rounded-xl bg-[#f2532f] py-3 text-[13px] font-bold text-white hover:bg-[#dc4526]"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
