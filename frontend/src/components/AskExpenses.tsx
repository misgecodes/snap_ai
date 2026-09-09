"use client";

import { LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { askExpenses } from "@/services/ai";

const exampleQuestions = [
  "How much did I spend on food this month?",
  "What's my biggest expense?",
  "When did I start tracking expenses?",
  "What did I buy at Netflix?",
  "How much did I spend on transportation?",
  "Where did I spend the most this month?",
  "How much did I spend last week?",
];

interface AskExpensesButtonProps {
  expenseCount: number;
  isDataLoaded: boolean;
}

export function AskExpensesButton({
  expenseCount,
  isDataLoaded,
}: AskExpensesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [typedExample, setTypedExample] = useState("");
  const [isErasingExample, setIsErasingExample] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const currentExample = exampleQuestions[exampleIndex];
    const timer = window.setTimeout(
      () => {
        if (isErasingExample) {
          if (typedExample) {
            setTypedExample((value) => value.slice(0, -1));
          } else {
            setExampleIndex((index) => (index + 1) % exampleQuestions.length);
            setIsErasingExample(false);
          }
        } else if (typedExample.length < currentExample.length) {
          setTypedExample(currentExample.slice(0, typedExample.length + 1));
        } else {
          setIsErasingExample(true);
        }
      },
      isErasingExample
        ? 35
        : typedExample.length === currentExample.length
          ? 1800
          : 55,
    );

    return () => window.clearTimeout(timer);
  }, [exampleIndex, isErasingExample, isOpen, typedExample]);

  const openModal = () => {
    setIsOpen(true);
    setError("");
  };

  const closeModal = () => {
    setIsOpen(false);
    if (!isAsking) {
      setQuestion("");
      setSubmittedQuestion("");
      setAnswer("");
      setError("");
    }
  };

  const handleAsk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAsking || !isDataLoaded || expenseCount === 0) {
      return;
    }

    setIsAsking(true);
    setSubmittedQuestion(trimmedQuestion);
    setAnswer("");
    setError("");
    try {
      const response = await askExpenses(trimmedQuestion);
      setAnswer(response.answer);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "SnapAI could not answer that question. Please try again.",
      );
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#f2532f] bg-[#fff0e8] px-5 py-3.5 text-[13px] font-bold text-[#d94c2d] transition hover:-translate-y-0.5 hover:bg-[#ffe5da] sm:w-auto"
      >
        <Sparkles size={17} /> Ask your expenses
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#18212b]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-expenses-title"
            className="w-full max-w-[560px] rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[26px] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-7 flex items-start justify-between gap-5">
              <div>
                <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f2532f]">
                  <Sparkles size={13} /> Expense AI
                </p>
                <h2
                  id="ask-expenses-title"
                  className="font-serif text-3xl tracking-[-0.05em]"
                >
                  Ask your expenses
                </h2>
                <p className="mt-2 text-[13px] leading-5 text-[#777b7e]">
                  Ask questions about your spending and get quick answers.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Ask your expenses"
                onClick={closeModal}
                className="rounded-full bg-[#f4f3f0] p-2 text-[#777b7e] transition hover:bg-[#eeeDE9]"
              >
                <X size={18} />
              </button>
            </div>

            {!isDataLoaded ? (
              <div className="flex items-center gap-3 rounded-xl bg-[#f6f5f2] p-4 text-[12px] text-[#929594]">
                <LoaderCircle size={17} className="animate-spin text-[#f2532f]" />
                Loading your expense history...
              </div>
            ) : expenseCount === 0 ? (
              <div className="flex items-start gap-3 rounded-xl bg-[#f6f5f2] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0e8] text-[#f2532f]">
                  <Sparkles size={17} />
                </div>
                <div>
                  <p className="text-[13px] font-bold">Start tracking to ask questions</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#929594]">
                    Upload your first receipt and SnapAI will be ready to answer questions about your spending.
                  </p>
                </div>
              </div>
            ) : null}

            {(isDataLoaded && expenseCount > 0) && (
              <div className="mt-6 flex max-h-[48vh] flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {error && (
                    <div className="mb-4 rounded-xl bg-[#fff0e8] px-4 py-3 text-[12px] leading-5 text-[#b64c32]">
                      {error}
                    </div>
                  )}
                  {isAsking && (
                    <div className="mb-4 flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#f6f5f2] px-4 py-3 text-[12px] text-[#777b7e]">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f2532f]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f2532f] [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f2532f] [animation-delay:240ms]" />
                      </span>
                      Expense AI is thinking...
                    </div>
                  )}
                  {answer && !isAsking && (
                    <div className="space-y-3">
                      <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#18212b] px-4 py-3 text-[12px] leading-5 text-white">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8c0c5]">You</p>
                        {submittedQuestion}
                      </div>
                      <div className="flex max-w-[88%] items-start gap-2 rounded-2xl rounded-bl-md bg-[#f6f5f2] px-4 py-3 text-[12px] leading-5 text-[#4f5558]">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-[#f2532f]" />
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f2532f]">Expense AI</p>
                          <p>{answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAsk} className="mt-4 border-t border-[#eeeDE9] pt-4">
                  <label htmlFor="ask-expenses-question" className="sr-only">
                    Ask anything about your expenses
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="ask-expenses-question"
                      value={question}
                      onChange={(event) => {
                        setQuestion(event.target.value);
                        setError("");
                      }}
                      placeholder="Ask anything about your expenses..."
                      disabled={isAsking}
                      className="min-w-0 flex-1 rounded-xl border border-[#deded9] bg-[#fdfdfc] px-4 py-3 text-[13px] outline-none transition placeholder:text-[#a3a5a2] focus:border-[#f2532f] focus:ring-2 focus:ring-[#f2532f]/10 disabled:cursor-wait disabled:opacity-70"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !question.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#f2532f] px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(242,83,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#dc4526] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isAsking ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                      {isAsking ? "Thinking..." : "Ask"}
                    </button>
                  </div>
                  {!answer && !isAsking && (
                    <button
                      type="button"
                      onClick={() => setQuestion(exampleQuestions[exampleIndex])}
                      className="mt-3 flex max-w-full items-center gap-2 text-left text-[11px] text-[#929594] hover:text-[#f2532f]"
                      aria-label={`Use example question: ${typedExample}`}
                    >
                      <Sparkles size={13} className="shrink-0 text-[#f2532f]" />
                      <span className="truncate">
                        Try: {typedExample}
                        <span className="text-[#f2532f]">|</span>
                      </span>
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
