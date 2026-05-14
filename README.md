# DecoverAI - Contract Review Dashboard

> **Live demo → [decover-ai-assignment.vercel.app/dashboard](https://decover-ai-assignment.vercel.app/dashboard)**

An AI-powered contract analysis platform that lets you upload legal contracts, automatically extract and classify key clauses, and query your entire contract library using natural language.

---

## What it does

### Upload & Process

- Drag-and-drop or select **PDF** and **DOCX** contract files from an upload modal
- Files are staged before upload - review them before committing
- Duplicate filename detection on both the client and server
- Each file is stored in the database, chunked for retrieval, and then processed by AI to extract clauses
- Per-file status tracking: **Uploaded → Processing → Completed**
- Manually trigger processing for any uploaded-but-unprocessed contract

### Clause Extraction

Nine clause types are automatically identified and extracted from every contract:

| Clause                          | Clause                      |
| ------------------------------- | --------------------------- |
| Confidentiality                 | Payment Terms               |
| Intellectual Property Ownership | Non-Solicitation            |
| Limitation of Liability         | Termination for Convenience |
| Indemnification                 | Data Processing Terms       |
| Warranty Disclaimer             |                             |

### AI Query

- Ask anything about your contracts in plain English - _"Which contracts have uncapped liability?"_, _"Do any contracts restrict IP ownership?"_
- Select specific contracts to search, or pick **All Contracts**
- Attach new files directly to a query - they are uploaded, processed, and queried in a single action
- Results are shown in a filtered table with only the **relevant contracts and clause columns** visible
- A **Relevance to Query** column explains in detail why each contract was surfaced, with expand/collapse for long explanations
- Stop a running query at any time with the **Stop** button

### Contracts Table - The Core View

The contracts table is the primary interface for reviewing and comparing extracted clause data across all your uploaded contracts.

**Structure**

Each row is a contract. Each column is a clause type. Cells are filled by the AI after processing.

**Clause cells**

Each non-empty cell shows:

- A **classification badge** indicating the nature of the clause
- A short **AI-generated summary** of what the clause says
- Clicking a cell opens a **detail modal** with the full extracted clause text and summary

**Classification badges**

| Badge           | Meaning                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 **Risk**     | Non-standard, unfavorable, or high-risk terms - e.g. uncapped liability, one-sided indemnification, aggressive IP assignment     |
| 🔵 **Standard** | Market-standard clause with no unusual concerns                                                                                  |
| 🟡 **Key Term** | Materially important clause worth attention - e.g. key payment milestones, significant IP ownership, data processing obligations |
| 🟢 **Found**    | Clause is present (legacy contracts processed before classification was introduced)                                              |
| -               | Clause not found in this contract                                                                                                |

**Query results view**

When an AI query is active, the table switches into a focused results mode:

- Only **contracts relevant to the query** are shown
- Only **clause columns relevant to the query** are shown - columns where every visible contract shows "Not found" are automatically hidden
- A **Relevance to Query** column is added, with a detailed AI explanation (per contract) of which specific clauses matched, what they say, any risks identified, and how they answer the query - long explanations are collapsible
- The Status column and delete actions are hidden to keep the view clean

**Table management**

- Sticky header - column names stay visible as you scroll down through many contracts
- Expandable/collapsible **All Contracts** section when no query is active
- **Rename** any contract (file extension is locked, only base name is editable)
- **Delete** individual contracts with a confirmation dialog, or **Delete All** to wipe the library
- **Complete processing** inline button for contracts that were uploaded but not yet AI-analysed

---

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| Language       | TypeScript                                                                 |
| Styling        | Tailwind CSS v4                                                            |
| UI Components  | shadcn/ui (Radix UI primitives)                                            |
| Database       | MongoDB Atlas via [Mongoose](https://mongoosejs.com/)                      |
| AI Model       | Google Gemini 2.0 Flash (`@google/generative-ai`)                          |
| File Parsing   | `unpdf` (PDF), `mammoth` (DOCX)                                            |
| File Upload UI | `react-dropzone`                                                           |
| Deployment     | [Vercel](https://vercel.com)                                               |

---
