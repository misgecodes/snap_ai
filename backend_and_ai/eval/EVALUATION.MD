# SnapAI — Receipt Extraction & Categorization Evaluation

## Overview

This document reports a systematic evaluation of SnapAI's AI extraction pipeline
(LangGraph: image extraction → RAG-based categorization) against manually
verified ground truth, rather than relying on informal spot-checks.

## Test Setup

- **9 real receipt images**, covering two distinct document types:
  - 3 merchant subscription bills (Netflix, Google Workspace, OpenAI)
  - 6 mobile money / bank transfer receipts (MTN Mobile Money, Commercial Bank
    of Ethiopia, Dukascopy Bank), spanning 3 currencies (USD, ETB, RWF, EUR)
- Ground truth (merchant, amount, currency, date, category) was manually
  verified by inspecting each image directly.
- Each receipt was run through the live pipeline (`run_receipt_graph`), and
  predictions were scored against ground truth per field.
- Scoring script: `eval/run_evaluation.py`. Full results: `eval/results.json`.

## Results

| Field      | Accuracy |
|------------|----------|
| Amount     | 100%     |
| Currency   | 100%     |
| Date       | 89%      |
| Category   | 78%      |
| Merchant   | 22%      |

## Findings

### Amount & currency extraction is fully reliable on this test set
Both fields scored 100% across all 9 receipts, including 3 different
currencies (USD, ETB, RWF) and one EUR receipt. No formatting
inconsistencies were observed after an earlier fix normalized currency
symbols/words (e.g. `"$"`, `"Euro"`) to ISO codes at write time.

### Date extraction is accurate; initial scoring undercounted it
The first evaluation run measured 0% date accuracy. Investigation showed
the model was returning **correct dates in inconsistent formats**
(`"Aug 05, 2026 12:11 PM"`, `"August 1, 2026 at 4:54 PM"`) rather than the
ISO format (`YYYY-MM-DD`) the scorer expected via exact string match. Adding
a date-normalization step before comparison corrected this: **true date
accuracy is 89% (8/9)**.

This distinguishes an actual extraction failure from a scoring artifact —
an important thing to catch, since the two require completely different
fixes (constrain the LLM's output format vs. fix the AI itself).

**One genuine failure remains:** a receipt with no visible date returned a
hallucinated date (`2026-08-11`) instead of `null`. This is flagged as a
real risk — the model fabricating a plausible-looking value rather than
correctly reporting missing information — and is prioritized for a prompt
fix (explicit instruction: return `null`, never invent a date).

### Category accuracy (78%) reveals partial RAG generalization
Two of the two failures were on receipts outside the pipeline's original
category design (a transfer and an OpenAI subscription):
- A Dukascopy Bank transfer was categorized as **"Mobile Money/Bank
  Fees"** instead of the newly-added **"Transfers"** category — a related
  but imprecise match, suggesting the RAG retrieval is generalizing
  sensibly even when slightly off.
- An OpenAI subscription was categorized as **"Groceries"** — a clear
  miss with no discernible semantic relationship, worth targeted
  investigation (likely a retrieval or category-rule ambiguity issue).
- A Google Workspace bill was categorized as **"Business/Work"** instead
  of **"Subscriptions"** — arguably a defensible alternate categorization
  rather than a true error, since the receipt is both a subscription and a
  work expense.

### Merchant extraction (22%) reflects a consistent design ambiguity, not random failure
Every merchant "failure" follows the same pattern: on **transfer
receipts**, the pipeline consistently extracts the **financial
institution's name** (e.g. "Commercial Bank of Ethiopia," "MTN Mobile
Money," "Dukascopy Bank Sa") rather than the **transfer recipient's
name** (e.g. "Alemu Berihun Samuel").

This is not noise — it is a systematic, repeatable choice the model makes
on every transfer-type receipt in the test set. It reflects an
unresolved product/schema question: for a peer-to-peer transfer, should
"merchant" represent the receiving institution or the recipient? The
current extraction behavior is internally consistent; the ground truth in
this evaluation assumed the opposite convention. Resolving this requires
a product decision (likely: a separate `recipient_name` field distinct
from `merchant` for transfer-type receipts), not a model fix.

One true extraction error unrelated to this ambiguity: `"Google Workspace
Beblscar"` vs. predicted `"Google Workspace Bebliscar"` — a minor OCR-level
character transposition on an ambiguous business name.

## Limitations of this evaluation

- Small sample size (9 receipts) — sufficient to surface real patterns but
  not statistically robust; confidence intervals would be wide.
- Skewed toward mobile-money/transfer receipts (6/9) versus traditional
  merchant purchases (3/9) — merchant-purchase accuracy specifically
  should be evaluated on a larger, more balanced set before drawing broad
  conclusions about non-transfer receipts.
- Single evaluator (manual ground truth verification) — no inter-rater
  reliability check.
- Does not yet evaluate the `confidence` field (currently unpopulated) or
  the "ask your expenses" tool-calling/context-based Q&A feature.

## Next steps

1. Constrain date output to strict ISO format in the extraction schema.
2. Add an explicit "return null, never fabricate" instruction for missing
   fields in the extraction prompt — directly targets the one hallucination
   case found.
3. Resolve the merchant vs. recipient-name schema question for transfer
   receipts.
4. Investigate the OpenAI → "Groceries" category miss specifically.
5. Expand the test set with more merchant-purchase receipts to validate
   category accuracy outside the transfer-heavy sample used here.