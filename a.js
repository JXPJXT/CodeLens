const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────────────────────
const BLUE_DARK  = "1F3864";
const BLUE_MID   = "2E75B6";
const BLUE_LIGHT = "D6E4F7";
const ACCENT     = "4472C4";
const GRAY_BG    = "F2F2F2";
const GRAY_LINE  = "BFBFBF";
const WHITE      = "FFFFFF";

const border1 = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border1, bottom: border1, left: border1, right: border1 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 36, color: BLUE_DARK, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MID, space: 1 } },
    children: [new TextRun({ text, bold: true, size: 28, color: BLUE_MID, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: ACCENT, font: "Arial" })]
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: BLUE_DARK, font: "Arial" })]
  });
}

function para(runs) {
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, size: 22, font: "Arial" })]
    : runs;
  return new Paragraph({ spacing: { before: 80, after: 100 }, children });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Arial" });
}

function normal(text) {
  return new TextRun({ text, size: 22, font: "Arial" });
}

function italic(text) {
  return new TextRun({ text, italics: true, size: 22, font: "Arial" });
}

function code(text) {
  return new TextRun({ text, font: "Courier New", size: 20, color: "C0392B" });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      spacing: { before: 0, after: 0 },
      shading: { fill: "1E1E1E", type: ShadingType.CLEAR },
      indent: { left: 360 },
      children: [new TextRun({ text: line || " ", font: "Courier New", size: 18, color: "D4D4D4" })]
    })
  );
}

function bullet(runs, level = 0) {
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, size: 22, font: "Arial" })]
    : runs;
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children
  });
}

function numbered(runs, level = 0) {
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, size: 22, font: "Arial" })]
    : runs;
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children
  });
}

function spacer(before = 100) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}

function blueBox(title, bodyParas) {
  const titleCell = new TableCell({
    width: { size: 9360, type: WidthType.DXA },
    shading: { fill: BLUE_MID, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 60, left: 180, right: 180 },
    borders,
    children: [new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 22, color: WHITE, font: "Arial" })]
    })]
  });
  const bodyCell = new TableCell({
    width: { size: 9360, type: WidthType.DXA },
    shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    borders,
    children: bodyParas
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [titleCell] }),
      new TableRow({ children: [bodyCell] })
    ]
  });
}

function grayBox(bodyParas) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        borders,
        children: bodyParas
      })]
    })]
  });
}

function metricsTable(rows, headers) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: Math.floor(9360 / headers.length), type: WidthType.DXA },
      shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      borders,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })]
      })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: Math.floor(9360 / headers.length), type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : GRAY_BG, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      borders,
      children: [new Paragraph({
        alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [new TextRun({ text: cell, size: 20, font: "Arial" })]
      })]
    }))
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: Array(headers.length).fill(Math.floor(9360 / headers.length)),
    rows: [headerRow, ...dataRows]
  });
}

// ── document content ──────────────────────────────────────────────────────────
const children = [

  // ── COVER ─────────────────────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1440, after: 200 },
    children: [new TextRun({ text: "CodeLens AI", bold: true, size: 72, color: BLUE_DARK, font: "Arial" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: "AI-Powered Code Review Assistant", size: 40, color: BLUE_MID, font: "Arial" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: "Project Technical Documentation", italics: true, size: 28, color: "666666", font: "Arial" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 600 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE_MID, space: 4 } },
    children: [new TextRun({ text: "Deep Learning + NLP + LLM Integration | LPU CSE AI/ML 2025–26", size: 22, color: "444444", font: "Arial" })]
  }),
  spacer(600),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 60 },
    children: [new TextRun({ text: "Technologies Used", bold: true, size: 24, color: BLUE_DARK, font: "Arial" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 800 },
    children: [new TextRun({ text: "PyTorch  •  TextCNN  •  CodeBERT  •  Llama 3.1 8B (Groq)  •  FastAPI  •  VS Code Extension  •  TypeScript", size: 22, color: "444444", font: "Arial" })]
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────────────
  h1("1. Project Overview"),
  para([bold("CodeLens AI"), normal(" is an AI-powered code review assistant that works like a debugger for code quality — not for runtime errors, but for bugs, security vulnerabilities, and bad coding patterns. A developer writes code in VS Code, the tool instantly highlights risky lines using a deep learning model, and on demand explains the issue and suggests a fix using a large language model.")]),
  spacer(100),
  para("The core idea is a two-layer system: a fast, locally-running neural network that detects suspicious patterns in milliseconds, paired with a powerful cloud-based language model that explains what the problem is and how to fix it in plain English."),
  spacer(100),

  blueBox("Problem Statement", [
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [normal("Developers spend enormous time on code review — finding bugs, security flaws, and bad practices. Existing tools are either too rigid (static analyzers that flag everything and explain nothing) or too slow (asking an AI chatbot means switching context). There is no tool that works inside the editor, in real time, that both detects a bug and explains it.")] }),
  ]),
  spacer(160),

  blueBox("Our Solution", [
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [bold("CodeLens behaves exactly like a debugger — but for code quality instead of runtime state:")] }),
    new Paragraph({ spacing: { before: 40, after: 20 }, numbering: { reference: "numbers", level: 0 }, children: [normal("Developer saves a file in VS Code")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "numbers", level: 0 }, children: [normal("Extension sends code to the backend API")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "numbers", level: 0 }, children: [normal("CNN model runs in under 100ms and returns a risk score + which lines are suspicious")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "numbers", level: 0 }, children: [normal("Risky lines are highlighted red/yellow in the editor")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "numbers", level: 0 }, children: [normal("Developer clicks 'Explain' → Llama 3.1 8B generates a plain-English explanation and fix suggestion")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, numbering: { reference: "numbers", level: 0 }, children: [normal("Feedback (correct / wrong) is stored for future improvement")] }),
  ]),
  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 2: ARCHITECTURE ───────────────────────────────────────────────
  h1("2. System Architecture"),
  para("The project is divided into three independent layers. Each layer has a clearly defined job and can be scaled or replaced independently."),
  spacer(120),
  h2("2.1 The Three Layers"),

  metricsTable([
    ["Client Layer",  "VS Code Extension (TypeScript)", "What the developer interacts with directly"],
    ["Gateway Layer", "FastAPI Backend (Python)",        "Receives requests, routes to the right service"],
    ["Service Layer", "CNN + Analyzer + LLM",           "The actual AI intelligence"],
  ], ["Layer", "Technology", "Responsibility"]),

  spacer(160),
  h2("2.2 Request Flow"),
  para("When a developer saves a file, the following sequence happens:"),
  spacer(80),
  ...codeBlock([
    "Developer saves file",
    "       ↓",
    "VS Code Extension (TypeScript)",
    "       ↓  HTTP POST /analyze",
    "FastAPI Gateway",
    "       ↓",
    "Language Router  ─── C/C++ code? ──→  TextCNN Service  →  risk_score + risky_lines",
    "                 └── Other lang?  ──→  Heuristic Analyzer →  pattern-based warnings",
    "       ↓",
    "Response: { risk_score: 0.82, is_buggy: true, risky_lines: [{line: 12, score: 0.91}] }",
    "       ↓",
    "Extension highlights line 12 in red",
    "       ↓  (user clicks Explain)",
    "POST /review  →  Llama 3.1 8B via Groq API",
    "       ↓",
    "LLM generates: 'strcpy() has no bounds check. Use strncpy() instead.'",
    "       ↓",
    "Shown in VS Code side panel",
  ]),
  spacer(160),

  h2("2.3 Language Routing — How Multi-Language Support Works"),
  para("The CNN was trained specifically on C code (the Devign dataset). For other languages, the system falls back to a rule-based analyzer. This is called graceful degradation — the system never breaks, it just uses the best tool available for each language."),
  spacer(80),

  metricsTable([
    ["C / C++",     "TextCNN Model",       "Full deep learning analysis + LLM explanation"],
    ["Python",      "Heuristic Analyzer",  "Checks for eval(), exec(), unsafe patterns + LLM"],
    ["JavaScript",  "Heuristic Analyzer",  "Checks innerHTML, dangerouslySetInnerHTML + LLM"],
    ["Java",        "Heuristic Analyzer",  "Checks Runtime.exec(), ObjectInputStream + LLM"],
    ["Unknown",     "LLM only",            "Pure language model review, no detection layer"],
  ], ["Language", "Detection Method", "Capability"]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 3: DEEP LEARNING ──────────────────────────────────────────────
  h1("3. Deep Learning Component — TextCNN Bug Classifier"),
  para("This is the core intelligence of CodeLens for C code. It is a neural network trained to look at a C function and answer one question: is this code buggy or clean?"),
  spacer(100),

  h2("3.1 What is Deep Learning? (For Beginners)"),
  para("Think of deep learning as teaching a computer to recognise patterns by showing it thousands of examples. Just like a child learns to recognise a cat by seeing hundreds of pictures of cats, our neural network learns to recognise buggy code by seeing thousands of examples of buggy and clean functions."),
  spacer(80),
  para("A neural network is made up of layers. Each layer transforms the data slightly, extracting more and more abstract features. By the end, the network has learned which patterns indicate a bug."),
  spacer(80),

  blueBox("Analogy: How the CNN thinks about code", [
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [normal("Imagine you are reading a document and you are looking for signs of fraud. You might scan for specific phrases: 'wire transfer', 'urgent', 'confidential account'. You do not read every word — you look for suspicious local patterns.")] }),
    new Paragraph({ spacing: { before: 40, after: 40 }, children: [normal("Our CNN does exactly this, but for code. It scans for suspicious code patterns like:")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "bullets", level: 0 }, children: [code("strcpy(dest, src)"), normal(" — no bounds check, classic buffer overflow")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "bullets", level: 0 }, children: [code("ptr->field"), normal(" — accessing a pointer field without checking if ptr is NULL")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [code("malloc(size)"), normal(" — allocating memory without checking if it returned NULL")] }),
  ]),

  spacer(160),
  h2("3.2 The Dataset — Devign"),
  para([bold("Dataset: DetectVul/devign"), normal(" from the CodeXGLUE benchmark on HuggingFace.")]),
  spacer(80),
  metricsTable([
    ["Total functions",    "~27,000 C functions from real open-source projects"],
    ["Buggy (label = 1)", "~45% of the dataset — functions with confirmed CVE vulnerabilities"],
    ["Clean (label = 0)", "~55% of the dataset — functions without known bugs"],
    ["Source",            "FFmpeg, QEMU, LibPNG, LibTIFF — real production C code"],
    ["Split used",        "70% train / 15% validation / 15% test"],
  ], ["Property", "Detail"]),

  spacer(120),
  para("Each entry in the dataset is a complete C function (sometimes dozens of lines long) paired with a binary label: 1 for buggy, 0 for clean. The bugs are real — they were discovered and patched in actual software, so the labels are trustworthy."),
  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  h2("3.3 Converting Code to Numbers — Tokenization and Embeddings"),
  para("Neural networks cannot understand text. They only work with numbers. The pipeline to convert code into numbers has two steps."),
  spacer(100),

  h3("Step 1: Tokenization"),
  para([bold("Tokenization"), normal(" is the process of breaking text into small units called tokens. We use BPE (Byte Pair Encoding), the same technique used by GPT models.")]),
  spacer(80),
  para("BPE is smart about code. It recognises that a long identifier like getUserData is better split into [get, User, Data] than treated as one unknown word. This matters because many bug-related function names share sub-parts."),
  spacer(80),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [bold("Example tokenization of a C snippet:")] }),
    new Paragraph({ spacing: { before: 40, after: 20 }, children: [code('Input:  char *ptr = malloc(size); if(ptr) { strcpy(ptr, input); }')] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [code('Output: ["char", " *", "ptr", " =", " malloc", "(", "size", ")", ";", " if", "(", "ptr", ")", " {", " str", "cpy", ...]')] }),
  ]),

  spacer(120),
  h3("Step 2: Embeddings"),
  para([bold("Embeddings"), normal(" convert each token ID into a vector of floating-point numbers. Think of it as a coordinate in a high-dimensional space where similar tokens are placed near each other.")]),
  spacer(80),
  para([normal("For example, in a well-trained embedding space: "), code("strcpy"), normal(" and "), code("strncpy"), normal(" would be close to each other, and both would be near "), code("memcpy"), normal(" — because they are all memory copy operations. The model learns these relationships automatically during training.")]),
  spacer(80),
  para("Each code function becomes a 2D matrix: rows are tokens, columns are embedding values. This matrix is what the CNN actually processes."),
  spacer(80),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("Embedding matrix shape:")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [code("Function → 256 tokens × 128 embedding dimensions = matrix of shape (256, 128)")] }),
  ]),

  spacer(160),
  h2("3.4 The TextCNN Architecture — What It Is and Why We Used It"),
  para("CNN stands for Convolutional Neural Network. It was originally invented for image recognition (detecting patterns in pixels), but researchers discovered it works extremely well for text too — because both images and text have local patterns that matter."),
  spacer(80),

  blueBox("Why CNN for code and not an RNN or Transformer?", [
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [bold("The key insight: most bugs are local.")] }),
    new Paragraph({ spacing: { before: 40, after: 40 }, children: [normal("A buffer overflow happens in 2–3 lines. A null pointer dereference is visible in a single expression. These patterns do not require understanding the entire function — they require detecting suspicious short sequences.")] }),
    new Paragraph({ spacing: { before: 40, after: 20 }, children: [bold("CNN advantages:")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "bullets", level: 0 }, children: [bold("Fast: "), normal("Convolutions run in parallel — inference takes under 50ms, making real-time analysis possible")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, numbering: { reference: "bullets", level: 0 }, children: [bold("Explainable: "), normal("Filter activations map back to specific tokens, showing which code triggered detection")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, numbering: { reference: "bullets", level: 0 }, children: [bold("Stable: "), normal("No vanishing gradient problems that plague RNNs on long sequences")] }),
  ]),

  spacer(160),
  h3("The TextCNN Architecture in Detail"),
  para("Our TextCNN has four stages:"),
  spacer(80),

  h4("Stage 1: Embedding Layer"),
  para([normal("Input: token IDs of shape (batch_size, 256). Output: embedding matrix of shape (batch_size, 256, 128). The embedding layer is a lookup table — each token ID maps to a 128-dimensional vector.")]),
  spacer(80),

  h4("Stage 2: Three Parallel Convolutional Branches"),
  para("This is the heart of the model. Three Conv1D layers run simultaneously, each with a different filter size:"),
  spacer(60),
  metricsTable([
    ["Filter size 3", "Looks at 3 tokens at a time", "Catches: null pointer, array bounds", "Most sensitive to micro-patterns"],
    ["Filter size 4", "Looks at 4 tokens at a time", "Catches: unsafe function calls",       "Balanced coverage"],
    ["Filter size 5", "Looks at 5 tokens at a time", "Catches: multi-step unsafe patterns",  "Best for longer idioms"],
  ], ["Branch", "Window", "Detects", "Strength"]),

  spacer(100),
  para("Each branch produces 128 feature maps. Think of each feature map as a detector for one specific pattern. After convolution, max-over-time pooling extracts the strongest signal from each detector across the whole function — regardless of where in the code it appears."),
  spacer(80),

  h4("Stage 3: Regularization"),
  para([bold("BatchNorm1D"), normal(" normalizes the 384-dimensional combined output (3 branches × 128 filters) so values are on a consistent scale. This speeds up training significantly.")]),
  spacer(60),
  para([bold("Dropout (p=0.5)"), normal(" randomly sets half the neurons to zero during training. This forces the model to learn redundant representations and prevents overfitting — the most common failure mode in deep learning where a model memorizes training data instead of learning generalizable patterns.")]),
  spacer(80),

  h4("Stage 4: Classification Head"),
  para([normal("A single "), bold("Linear(384, 1)"), normal(" layer produces one number. When passed through "), bold("Sigmoid"), normal(" during inference, this becomes a probability between 0 and 1. Above the threshold → buggy. Below → clean.")]),

  spacer(160),
  h3("Complete Architecture Summary"),
  spacer(60),
  ...codeBlock([
    "Input: token IDs  (batch=64, seq_len=256)",
    "  ↓",
    "nn.Embedding(vocab=50257, dim=128)",
    "  ↓  shape: (64, 256, 128)",
    "permute → (64, 128, 256)   [channels first for Conv1D]",
    "  ↓",
    "┌─────────────────────────────────────────────────────────┐",
    "│  Branch A         Branch B         Branch C             │",
    "│  Conv1d(128,128,  Conv1d(128,128,  Conv1d(128,128,      │",
    "│    kernel=3)        kernel=4)        kernel=5)           │",
    "│  + ReLU           + ReLU           + ReLU               │",
    "│  MaxPool → (64,   MaxPool → (64,   MaxPool → (64,       │",
    "│    128)             128)             128)                │",
    "└─────────────────────────────────────────────────────────┘",
    "  ↓  concatenate",
    "shape: (64, 384)",
    "  ↓",
    "BatchNorm1d(384)",
    "  ↓",
    "Dropout(p=0.5)",
    "  ↓",
    "Linear(384, 1)",
    "  ↓",
    "Sigmoid  →  probability [0, 1]",
    "  ↓",
    "≥ threshold  →  BUGGY",
    "< threshold  →  CLEAN",
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 4: TRAINING ───────────────────────────────────────────────────
  h1("4. Training — How the Model Learned"),
  h2("4.1 The Training Setup"),
  para("Training is the process of showing the model thousands of examples and adjusting its internal parameters (weights) until it gets good at predicting the right label."),
  spacer(80),

  metricsTable([
    ["Loss Function",  "BCEWithLogitsLoss",        "Measures how wrong each prediction is"],
    ["Optimizer",      "Adam (lr=1e-3)",            "Adjusts weights to reduce loss"],
    ["Batch Size",     "64",                        "How many functions processed at once"],
    ["Epochs",         "Up to 20",                 "Full passes through training data"],
    ["Early Stopping", "Patience = 3–5 epochs",    "Stops when validation stops improving"],
    ["Scheduler",      "ReduceLROnPlateau",         "Halves learning rate when stuck"],
  ], ["Component", "Value / Setting", "Purpose"]),

  spacer(120),
  h3("Understanding BCEWithLogitsLoss"),
  para("BCE stands for Binary Cross-Entropy. For each prediction, it measures: how surprised was the model by the correct answer? If the model predicted 0.9 buggy and the label is 1 (buggy), the loss is very low. If the model predicted 0.1 buggy but the label is 1, the loss is very high. The optimizer then adjusts the weights to reduce this surprise."),
  spacer(80),

  h3("Understanding Early Stopping"),
  para("We monitor validation loss after each epoch. If it stops improving for 3–5 consecutive epochs, we stop training and restore the best model. This is crucial because training loss always keeps dropping (the model memorizes training data), but validation loss eventually rises — indicating overfitting."),
  spacer(80),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("Overfitting example from our training:")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [code("Epoch 5:  Train Loss: 0.51 | Val Loss: 0.58 | Val Acc: 0.68  ← best")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [code("Epoch 6:  Train Loss: 0.49 | Val Loss: 0.62 | Val Acc: 0.66  ← overfitting starts")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [code("Epoch 7:  Train Loss: 0.46 | Val Loss: 0.65 | Val Acc: 0.65  ← definitely overfitting")] }),
  ]),

  spacer(160),
  h2("4.2 Class Imbalance and Weighted Loss"),
  para("Devign has roughly 55% clean and 45% buggy functions. This imbalance causes the model to take the lazy shortcut of predicting 'clean' whenever it is uncertain — which is wrong behaviour for a bug detector."),
  spacer(80),
  para("We addressed this by computing a class weight and passing it to the loss function. The sqrt dampens the weight so it nudges without overcorrecting:"),
  spacer(60),
  ...codeBlock([
    "num_buggy  = count of buggy functions in training set",
    "num_clean  = count of clean functions in training set",
    "pos_weight = sqrt(num_clean / num_buggy)",
    "",
    "# This tells the loss function: treat each buggy sample",
    "# as if it appeared pos_weight times in the dataset",
    "criterion = BCEWithLogitsLoss(pos_weight=pos_weight)",
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 5: ALL APPROACHES ─────────────────────────────────────────────
  h1("5. All Training Approaches — What We Tried and What Happened"),
  para("We ran six distinct experiments. Each is documented here with the exact change made, the results, and the analysis of why it performed the way it did."),
  spacer(120),

  h2("Run 1 — Baseline TextCNN with Hash Tokenizer"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Simple TextCNN with hash-based tokenization (hash(token) % 50000), no class weighting, 10 epochs, Adam lr=1e-3")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [bold("Key flaw: "), normal("hash(token) % 50000 is lossy. Different tokens can hash to the same ID (collision). The model received corrupted input but still learned something.")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.722 | F1: 0.586 | Bug recall: 53.9% | Clean recall: 74.6%")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("This became our best AUC result across all TextCNN experiments — a sobering indicator that the architecture ceiling, not the tokenizer, was the main constraint. The model was strongly biased toward predicting 'clean', missing 46% of actual bugs.")]),
  spacer(160),

  h2("Run 2 — Weighted Loss (Full Ratio)"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Switched to BCEWithLogitsLoss with pos_weight = num_clean / num_buggy (full ratio, approximately 1.22)")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.707 | F1: 0.617 | Bug recall: 65.2% | Clean recall: 60.8%")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("The weighting overcorrected. Bug recall jumped from 53.9% to 65.2% — the model started catching more real bugs. But it also started flagging too many clean functions as buggy (579 false positives vs 375 before). AUC dropped because the model's overall discriminative ability did not improve — it just moved its decision boundary. F1 improved because we care about bugs more than clean predictions.")]),
  spacer(160),

  h2("Run 3 — Weighted Loss (Square Root Dampening)"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Changed pos_weight = sqrt(num_clean / num_buggy) to soften the correction")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.702 | F1: 0.587 | Bug recall: 56.1% | Clean recall: 70.1%")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("The model swung back toward clean predictions but did not fully recover. AUC continued to slide. This suggested that tuning the loss function alone was moving the threshold, not improving the model's actual ability to distinguish buggy from clean code.")]),
  spacer(160),

  h2("Run 4 — Frozen CodeBERT Embeddings + Projection Layer"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Replaced random 128-dim embeddings with pretrained CodeBERT embeddings (768-dim, frozen). Added a learnable projection layer: Linear(768, 128) + ReLU to compress before the CNN.")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.708 | F1: 0.608 | Most balanced confusion matrix of all runs")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("The confusion matrix became the most symmetric: 992 correct clean, 485 wrong; 495 wrong, 760 correct buggy. The model was no longer strongly biased in either direction. However, AUC did not improve. The frozen CodeBERT embeddings, even with the projection layer, could not give the CNN richer information — because the CNN filters could not fine-tune the representation to the bug detection task. The embeddings remained generic.")]),
  spacer(160),

  h2("Run 5 — Unfrozen CodeBERT Embeddings (Regression)"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Set freeze=False to allow the embeddings to update during training. Used differential learning rates: 2e-5 for embeddings, 3e-4 for CNN layers. Increased to 20 epochs with patience=5.")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.692 | F1: 0.602  ← worst result")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("Unfreezing caused catastrophic interference. The randomly initialized projection layer produced large gradients that propagated back through the embedding layer and destroyed the pretrained structure before it could be useful. The 2e-5 learning rate was too large for stable fine-tuning of BERT-scale embeddings in this setup. This run confirmed the TextCNN architecture is incompatible with full embedding fine-tuning at this scale without a careful warmup strategy.")]),
  spacer(160),

  h2("Run 6 — Clean Reset (Confirmed Baseline)"),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("What we did: "), normal("Reverted to the simple TextCNN with no CodeBERT dependencies, plain Adam, no weighting, but added proper early stopping (patience=3) and optimal threshold tuning via ROC curve.")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [bold("Results: "), code("AUC: 0.700–0.714 | Optimal threshold: 0.346 | Bug recall: 74.6%")] }),
  ]),
  spacer(80),
  para([bold("Analysis: "), normal("The optimal threshold of 0.346 (found by maximising tpr-fpr on the ROC curve) produced bug recall of 74.6% — the highest of all runs. This is appropriate for a code review tool: it is better to flag too many things and let the developer decide than to silently miss real bugs. This became our locked-in TextCNN result.")]),

  spacer(160),
  h2("Summary of All Runs"),
  metricsTable([
    ["Run 1", "Hash tokenizer baseline",   "0.722", "0.586", "53.9%", "74.6%", "Best AUC, worst bug recall"],
    ["Run 2", "Weighted loss (full)",       "0.707", "0.617", "65.2%", "60.8%", "Overcorrected to buggy"],
    ["Run 3", "Weighted loss (sqrt)",       "0.702", "0.587", "56.1%", "70.1%", "Partially recovered"],
    ["Run 4", "Frozen CodeBERT + proj",     "0.708", "0.608", "60.5%", "67.2%", "Best balance, no AUC gain"],
    ["Run 5", "Unfrozen CodeBERT",          "0.692", "0.602", "—",     "—",     "Worst — gradient corruption"],
    ["Run 6", "Clean reset + threshold",    "0.714", "0.652", "74.6%", "54.2%", "Highest bug recall"],
  ], ["Run", "Key Change", "AUC", "F1", "Bug Recall", "Clean Recall", "Finding"]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 6: CODEBERT FINETUNING ───────────────────────────────────────
  h1("6. CodeBERT Fine-Tuning — The Deep Analysis Model"),
  para("After exhausting TextCNN's ceiling (~0.72 AUC), we introduced a second, more powerful model: fine-tuned CodeBERT. This is not a replacement for the TextCNN — it is a complement. TextCNN handles fast real-time scanning; CodeBERT handles deep on-demand analysis."),
  spacer(100),

  h2("6.1 What is CodeBERT?"),
  para("CodeBERT is a large pretrained transformer model developed by Microsoft, trained on 8.35 million code-comment pairs across 6 programming languages. It uses the BERT architecture — a 12-layer deep transformer with 125 million parameters."),
  spacer(80),
  para("The key advantage of CodeBERT for our task is that it was pretrained to understand the relationship between code and natural language — which is exactly what a code review tool needs."),
  spacer(80),

  blueBox("What does 'fine-tuning' mean?", [
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [normal("CodeBERT has already learned, from 8 million examples, what code looks like and how it relates to natural language. Fine-tuning means we take this pretrained model and continue training it on our specific task (Devign bug detection) for just a few more epochs.")] }),
    new Paragraph({ spacing: { before: 40, after: 60 }, children: [normal("The analogy: CodeBERT is a software engineer with 5 years of general coding experience. Fine-tuning is giving that engineer 2 weeks of intensive training specifically on security vulnerability detection. They do not forget everything they knew — they become specialized.")] }),
  ]),

  spacer(120),
  h2("6.2 CodeBERT Classifier Architecture"),
  spacer(60),
  ...codeBlock([
    "Input: C function code string",
    "  ↓",
    "CodeBERT Tokenizer  (max_length=128, BPE subword tokenization)",
    "  ↓",
    "input_ids + attention_mask",
    "  ↓",
    "CodeBERT Encoder  (12 transformer layers, 768-dim hidden states)",
    "  ↓  last_hidden_state: (batch, 128, 768)",
    "[:, 0, :]  →  take [CLS] token only  →  shape: (batch, 768)",
    "  ↓",
    "Dropout(0.3)",
    "  ↓",
    "Linear(768, 1)",
    "  ↓",
    "Sigmoid  →  bug probability",
  ]),

  spacer(100),
  para([bold("The [CLS] token: "), normal("BERT-style models prepend a special [CLS] (classification) token to every input. After processing through all 12 transformer layers, this token's 768-dimensional output vector contains a summary of the entire input — because transformer attention allows every token to attend to every other token. The [CLS] vector is the ideal input for a classification head.")]),
  spacer(120),

  h2("6.3 Training Details for RTX 3050 6GB"),
  metricsTable([
    ["Batch Size",        "8",          "Safe for 6GB VRAM with 128-token sequences"],
    ["Max Token Length",  "128",        "Most Devign functions fit; saves 4x memory vs 512"],
    ["Learning Rate",     "2e-5",       "Standard BERT fine-tuning rate — very conservative"],
    ["Optimizer",         "AdamW",      "Adam with weight decay 0.01 — prevents BERT overfitting"],
    ["Scheduler",         "LinearLR",  "Warmup: 10% → 100% LR over first 3 epochs"],
    ["Gradient Clipping", "max_norm=1.0", "Prevents exploding gradients — essential for BERT"],
    ["Epochs",            "5",          "BERT overfits fast; 3–5 epochs is standard"],
    ["Early Stopping",    "Patience=2", "Tight patience because BERT converges quickly"],
  ], ["Parameter", "Value", "Reason"]),

  spacer(120),
  para([bold("Expected outcome: "), normal("AUC 0.78–0.82, F1 0.70–0.75. Published results for fine-tuned CodeBERT on Devign report 0.80–0.84 AUC. Our setup with max_len=128 instead of 512 may reduce this slightly, but the gain over TextCNN is substantial.")]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 7: INTERPRETABILITY ───────────────────────────────────────────
  h1("7. Interpretability — Why a Line is Flagged"),
  para("One of the most important features of CodeLens is that it does not just say 'this code is buggy' — it shows which specific lines triggered the detection. This is called interpretability, and it is what separates a useful tool from a black box."),
  spacer(100),

  h2("7.1 CNN Activation Mapping"),
  para("The interpretability pipeline works by tracing back from the model's decision to the specific tokens that caused it:"),
  spacer(80),
  numbered("Run the forward pass through the CNN and capture the raw feature maps before max-pooling (shape: batch × filters × positions)"),
  numbered("For each filter, record which position in the sequence had the maximum activation — this is what max-pooling selected"),
  numbered("Map that position back to a token in the original tokenized sequence"),
  numbered("Map that token back to a line number in the original source code"),
  numbered("Score each line by the average activation strength of filters that pointed to it"),
  spacer(80),
  grayBox([
    new Paragraph({ spacing: { before: 60, after: 20 }, children: [bold("Example output:")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [code("Line 12: risk_score=0.91  → strcpy(dest, input) — filter for 'unsafe_string_copy' activated")] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [code("Line 7:  risk_score=0.63  → ptr = malloc(len) — filter for 'unchecked_alloc' activated")] }),
    new Paragraph({ spacing: { before: 20, after: 60 }, children: [code("Line 3:  risk_score=0.21  → int x = 0 — low activation, safe")] }),
  ]),

  spacer(160),
  h2("7.2 Heatmap Visualization"),
  para([normal("The interpretability module includes a terminal heatmap using "), bold("colorama"), normal(" that prints each line with a colour-coded risk score — red for high risk, yellow for medium, green for low. This directly satisfies the DL objective requirement for filter activation visualization.")]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 8: NLP COMPONENT ──────────────────────────────────────────────
  h1("8. NLP Component — Tokenization Analysis"),
  para("Separate from the deep learning model, we conducted a rigorous NLP analysis comparing two tokenization strategies on code. This satisfies the NLP Units I and II objectives."),
  spacer(100),

  h2("8.1 BPE vs Word Tokenization"),
  para("We compared two approaches on 50 C functions from Devign and 50 Python code snippets:"),
  spacer(80),
  metricsTable([
    ["BPE (GPT-2 / CodeBERT)", "Splits words into subword units based on frequency statistics", "getUserData → [get, User, Data]"],
    ["Word Tokenization",       "Splits on whitespace only — treats each word as one token",     "getUserData → [getUserData]"],
  ], ["Method", "How It Works", "Example"]),

  spacer(100),
  h3("Token Fertility"),
  para([bold("Token fertility"), normal(" = number of BPE tokens produced / number of whitespace words in the original. A fertility of 1.0 means perfect 1:1 mapping. Higher fertility means BPE is splitting more aggressively.")]),
  spacer(80),
  para("For code, BPE fertility is typically 1.4–1.8 for C and 1.6–2.1 for Python. This is because Python uses longer, more expressive identifiers and more complex string patterns."),
  spacer(80),
  h3("Why BPE Wins for Code"),
  bullet([bold("Handles unknown identifiers: "), normal("Word tokenization marks every unique function name as <UNK> (unknown). BPE breaks it into recognizable pieces")]),
  bullet([bold("Preserves semantics: "), normal("maxRetryCount splits into [max, Retry, Count] — the model understands each component")]),
  bullet([bold("Smaller vocabulary: "), normal("50,000 BPE tokens can cover billions of unique identifier combinations")]),
  bullet([bold("Works across languages: "), normal("BPE trained on code handles Python, C, and JS without language-specific rules")]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 9: LLM COMPONENT ──────────────────────────────────────────────
  h1("9. LLM Component — Code Review Generation"),
  para("The second half of the system is a large language model that generates human-readable code review comments. We use Llama 3.1 8B Instruct, served via the Groq API for fast inference (Groq's custom LPU hardware typically returns responses in under 2 seconds)."),
  spacer(100),

  h2("9.1 Why Llama 3.1 8B via Groq?"),
  metricsTable([
    ["Model",          "Llama 3.1 8B Instruct",  "State-of-the-art open model, strong at code tasks"],
    ["Provider",       "Groq API",                "LPU-accelerated inference, ~2s response time"],
    ["Cost",           "Free tier available",      "Sufficient for development and demonstration"],
    ["Alternatives",   "HuggingFace CodeT5",       "Slower, lower quality on explanation tasks"],
  ], ["Aspect", "Choice", "Reason"]),

  spacer(120),
  h2("9.2 Prompt Engineering — Three Templates"),
  para("We designed and evaluated three prompt templates. The quality of LLM output depends heavily on how the prompt is structured — this is called prompt engineering."),
  spacer(80),

  h3("Template 1: Zero-Shot"),
  para("No examples provided. The model must rely entirely on its pretrained knowledge."),
  spacer(60),
  ...codeBlock([
    "You are a senior software engineer.",
    "Review the following {language} code and identify any bugs,",
    "security risks, or bad practices. Suggest specific fixes.",
    "",
    "Code:",
    "{code}",
    "",
    "Review:",
  ]),
  spacer(100),

  h3("Template 2: One-Shot"),
  para("One example of a code review is provided before the actual request. This anchors the model on the expected format and depth."),
  spacer(60),
  ...codeBlock([
    "You are a senior software engineer.",
    "Here is an example of a code review:",
    "",
    "Example code: {example_code}",
    "Example review: {example_review}",
    "",
    "Now review this {language} code:",
    "{code}",
    "",
    "Review:",
  ]),
  spacer(100),

  h3("Template 3: Few-Shot (3 Examples)"),
  para("Three diverse examples covering different bug categories. This is the most effective template — it gives the model a pattern to follow and shows the expected level of technical depth."),
  spacer(80),
  para([bold("Why few-shot works best: "), normal("The model is shown what good looks like before being asked to produce it. Three examples covering different bug types (memory, null pointer, overflow) condition the model to consider all these categories for every new input.")]),
  spacer(100),

  h2("9.3 Evaluation — BLEU-4 and Manual Scoring"),
  metricsTable([
    ["BLEU-4",       "Automatic",  "Compares generated text to reference reviews using 4-gram overlap"],
    ["Relevance",    "Manual 1–3", "Does the review address the actual bug in the code?"],
    ["Clarity",      "Manual 1–3", "Is the explanation understandable to a developer?"],
    ["Correctness",  "Manual 1–3", "Is the suggested fix actually correct?"],
  ], ["Metric", "Type", "Description"]),

  spacer(80),
  para("BLEU-4 measures surface similarity to reference text. For code review generation, manual scoring of relevance and correctness matters more — a review can have low BLEU but still be correct and useful."),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 10: FILE STRUCTURE ────────────────────────────────────────────
  h1("10. Project Files — What Each File Does"),
  h2("10.1 Training Module"),
  spacer(80),

  h3("training/dataset_loader.py"),
  para("Loads the Devign dataset from local parquet files (saved from HuggingFace DetectVul/devign). Returns three pandas DataFrames: train, validation, test. Loading locally avoids SSL certificate issues on institutional networks."),
  spacer(80),

  h3("training/preprocess.py"),
  para([normal("Implements the tokenization pipeline using "), code("GPT2Tokenizer"), normal(" from HuggingFace. The "), code("tokenize_code(code, max_len=256)"), normal(" function takes a raw C function string and returns a padded list of integer token IDs. Also saves the vocabulary mapping to "), code("outputs/tokenizer_vocab.json"), normal(" for use by the backend.")]),
  spacer(80),

  h3("training/model.py"),
  para([normal("Defines the "), code("TextCNN"), normal(" class in PyTorch. Contains the full architecture (embedding → conv branches → maxpool → concat → batchnorm → dropout → fc). Also implements "), code("get_activations(x)"), normal(" which returns the raw pre-pooled feature maps for interpretability.")]),
  spacer(80),

  h3("training/train.py"),
  para([normal("The training loop. Loads data, instantiates model, runs epochs, tracks validation loss, saves the best model to "), code("outputs/textcnn.pt"), normal(". Implements early stopping with configurable patience. Uses "), code("BCEWithLogitsLoss"), normal(" with sqrt pos_weight for class imbalance handling.")]),
  spacer(80),

  h3("training/evaluate.py"),
  para([normal("Loads the saved model and runs evaluation on the test split. Computes accuracy, F1, AUC-ROC using sklearn. Implements optimal threshold selection via ROC curve (maximising tpr-fpr). Saves full results to "), code("outputs/metrics_report.json"), normal(". Fixes the FutureWarning with "), code("weights_only=True"), normal(".")]),
  spacer(80),

  h3("training/interpretability.py"),
  para([normal("The activation mapping pipeline. Takes raw C code, tokenizes it, runs "), code("get_activations()"), normal(", finds max activation positions per filter, maps positions → tokens → line numbers, returns "), code("List[(line_number, risk_score)]"), normal(". Also provides "), code("visualize_heatmap()"), normal(" using colorama for terminal output.")]),
  spacer(80),

  h3("training/generate_embeddings.py"),
  para([normal("One-time script that loads "), code("microsoft/codebert-base"), normal(", extracts the 768×50265 embedding weight matrix, and saves it to "), code("outputs/codebert_embeddings.pt"), normal(". Also saves the CodeBERT tokenizer locally so it can be used without internet access.")]),
  spacer(80),

  h3("training/finetune_codebert.py"),
  para([normal("The CodeBERT fine-tuning pipeline. Defines "), code("CodeBERTClassifier"), normal(" (BERT encoder + dropout + linear head). Implements training with AdamW, gradient clipping, LinearLR warmup, and early stopping with patience=2. Evaluates on test set with optimal threshold. Saves model to "), code("outputs/codebert_finetuned.pt"), normal(".")]),
  spacer(80),

  h3("training/nlp_analysis.py"),
  para([normal("Satisfies NLP objective. Compares BPE tokenization vs whitespace word tokenization on 50 C functions and 50 Python snippets. Computes token fertility and vocabulary coverage for each. Produces comparison table and saves to "), code("outputs/nlp_analysis.json"), normal(".")]),
  spacer(80),

  h3("training/prompt_eval.py"),
  para([normal("Satisfies NLP/LLM objective. Implements three prompt templates (zero/one/few-shot), calls Groq API with Llama 3.1 8B on a test set of 10 Devign samples, evaluates with BLEU-4 using NLTK, and produces a comparison table saved to "), code("outputs/prompt_eval.json"), normal(".")]),
  spacer(160),

  h2("10.2 Backend Module"),
  spacer(80),

  h3("backend/app.py"),
  para([normal("FastAPI entry point. Registers three route groups ("), code("/analyze"), normal(", "), code("/review"), normal(", "), code("/feedback"), normal(") and adds CORS middleware so the VS Code extension can call it. The "), code("/health"), normal(" endpoint lets the extension verify the backend is running.")]),
  spacer(80),

  h3("backend/config.py"),
  para([normal("Uses "), code("pydantic-settings BaseSettings"), normal(" to load all configuration from "), code(".env"), normal(". Every configurable value — Groq API key, model path, risk threshold, database URL — is accessed through "), code("config.settings"), normal(". No "), code("os.environ"), normal(" calls anywhere else in the codebase. Changing any setting requires only editing "), code(".env"), normal(".")]),
  spacer(80),

  h3("backend/services/router.py"),
  para([normal("The language routing layer. Detects the language from the request, routes C/C++ to "), code("cnn_service"), normal(", all others to "), code("analyzer"), normal(". This is the extensibility point — adding Java support means adding one entry to this file and a corresponding handler.")]),
  spacer(80),

  h3("backend/services/cnn_service.py"),
  para([normal("Loads "), code("textcnn.pt"), normal(" once at module import time (not per request). Provides "), code("analyze_with_cnn(code)"), normal(" which tokenizes, runs inference, calls "), code("interpretability.py"), normal(" for line-level mapping, and returns the structured response. Includes a safe fallback if the model file is missing — never crashes the server.")]),
  spacer(80),

  h3("backend/services/llm_service.py"),
  para([normal("Wraps the Groq API. Reads "), code("GROQ_API_KEY"), normal(" and "), code("LLM_MODEL_ID"), normal(" from config. Uses the few-shot prompt template by default. Implements caching via "), code("cache.py"), normal(" — repeated calls with the same code return instantly without hitting the API. Handles network failures gracefully with a fallback string.")]),
  spacer(80),

  h3("backend/services/analyzer.py"),
  para("The language-agnostic heuristic layer. Maintains a dictionary of unsafe patterns per language (eval(), exec(), innerHTML, Runtime.exec(), etc.). Scans each line for pattern matches and adds risk scores. Also flags overly long lines and deeply nested blocks. Returns the same response structure as the CNN service for interface consistency."),
  spacer(80),

  h3("backend/services/cache.py"),
  para([normal("Simple in-memory dictionary cache keyed by "), code("md5(code + language)"), normal(". Avoids redundant Groq API calls for the same code. In a production system this would be Redis, but an in-memory dict is sufficient for development and demonstration.")]),
  spacer(80),

  h3("backend/db/db.py + schema.sql"),
  para([normal("SQLite persistence layer. Two tables: "), code("feedback"), normal(" (stores developer thumbs up/down with the code and prediction), and "), code("logs"), normal(" (stores request latency, risk scores, and endpoint usage). This data becomes the foundation for future model retraining.")]),
  spacer(160),

  h2("10.3 VS Code Extension Module"),
  spacer(80),

  h3("extension/src/extension.ts"),
  para([normal("Entry point. On "), code("activate()"), normal(": registers all commands, sets up the "), code("onDidSaveTextDocument"), normal(" listener that triggers automatic analysis on every file save, and creates the output channel for logging.")]),
  spacer(80),

  h3("extension/src/api.ts"),
  para([normal("All HTTP calls to the backend live here. Implements "), code("analyzeCode()"), normal(", "), code("getReview()"), normal(", and "), code("sendFeedback()"), normal(". Reads the backend URL from VS Code workspace configuration ("), code("codelens.backendUrl"), normal(") so it can be pointed at any server. Network errors are logged to the output channel, never shown as modal dialogs.")]),
  spacer(80),

  h3("extension/src/highlighter.ts"),
  para("Manages VS Code text decorations. Maintains three decoration types (red for high risk ≥ 0.7, yellow for medium 0.4–0.7, green for low). On analysis results, applies decorations to the corresponding line numbers. Gutter icons (small coloured circles) appear in the margin like debug breakpoints."),
  spacer(80),

  h3("extension/src/commands.ts"),
  para([normal("Registers three user-facing commands: "), code("codelens.explainLine"), normal(" (sends cursor line to /review, shows result in panel), "), code("codelens.scanFile"), normal(" (sends whole document to /analyze, highlights results), and "), code("codelens.clearAll"), normal(" (removes all highlights).")]),
  spacer(80),

  h3("extension/src/panel.ts"),
  para("Creates a VS Code WebviewPanel showing the full review output: overall risk score as a percentage bar, list of risky lines with scores, LLM-generated comment, and two buttons (Correct / Wrong) that call sendFeedback."),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 11: SYSTEM DESIGN ─────────────────────────────────────────────
  h1("11. System Design Concepts"),
  h2("11.1 Separation of Concerns"),
  para("Each service has exactly one job. CNN service does inference. LLM service calls Groq. Cache service stores responses. Router service decides which path to take. This means any component can be replaced or upgraded without touching the others."),
  spacer(100),

  h2("11.2 Graceful Degradation"),
  para("The system never breaks. If the CNN model file is missing, cnn_service returns a safe fallback. If Groq is rate-limited, llm_service returns an informative fallback string. If the backend is unreachable, the extension logs to the output channel and continues working."),
  spacer(100),

  h2("11.3 Caching"),
  para("LLM API calls are expensive and slow. The cache layer stores responses keyed by an MD5 hash of the code and language. Repeated analysis of the same function returns instantly from cache. This makes the system behave well during live demonstrations."),
  spacer(100),

  h2("11.4 Environment-Based Configuration"),
  para([normal("Every secret (Groq API key) and every tunable value (risk threshold, model path) lives in "), code(".env"), normal(" and is loaded through "), code("pydantic-settings"), normal(". No hardcoded secrets anywhere in source code. Deploying to a different environment or swapping to a different LLM requires only editing one file.")]),
  spacer(100),

  h2("11.5 Feedback Loop"),
  para("Every developer thumbs-up or thumbs-down is stored in SQLite with the code and prediction. This is the data foundation for future model improvement — you can retrain the CNN on cases where it was wrong, making the system improve over time from real usage."),
  spacer(100),

  h2("11.6 Two-Speed Architecture"),
  metricsTable([
    ["Fast path",  "TextCNN",             "< 50ms",   "Always runs on save",     "Real-time highlighting"],
    ["Deep path",  "CodeBERT + Llama 3.1","1–3s",     "On user request",         "Full explanation + fix"],
  ], ["Mode", "Model", "Latency", "When It Runs", "Output"]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 12: METRICS SUMMARY ───────────────────────────────────────────
  h1("12. Final Metrics and Results"),
  h2("12.1 TextCNN — Best Results"),
  metricsTable([
    ["AUC-ROC",           "0.714",   "Model ranks buggy above clean 71.4% of the time"],
    ["F1 Score",          "0.652",   "Harmonic mean of precision and recall"],
    ["Bug Recall",        "74.6%",   "Of real bugs, 74.6% are correctly flagged"],
    ["Optimal Threshold", "0.346",   "Set low to prioritize catching bugs over precision"],
    ["Inference Speed",   "< 50ms",  "Fast enough for real-time editor integration"],
  ], ["Metric", "Value", "Interpretation"]),

  spacer(120),
  h2("12.2 How These Numbers Compare"),
  para("Published TextCNN results on Devign consistently report 0.70–0.73 AUC. Our best result of 0.714 is within the expected range for this architecture. State-of-the-art graph neural network models achieve 0.84 AUC — the gap exists because those models understand the control flow graph structure of code, which a sequence model cannot capture."),
  spacer(80),
  para("For the purpose of this project, 0.714 AUC is entirely appropriate and defensible. The goal was never to beat state-of-the-art — it was to build a usable tool with a principled architecture that demonstrates deep learning, NLP, and system design skills."),
  spacer(120),

  h2("12.3 Resume-Ready Summary Line"),
  spacer(60),
  blueBox("How to present this project", [
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [italic('"Built a VS Code-integrated AI code review assistant combining a TextCNN bug detector (AUC: 0.714 on Devign benchmark) with Llama 3.1 8B review generation via Groq, implemented with language-aware routing, filter activation interpretability, and feedback-driven learning across a FastAPI microservice architecture."')] })
  ]),

  spacer(200),
  new Paragraph({ children: [new PageBreak()] }),

  // ── SECTION 13: GLOSSARY ──────────────────────────────────────────────────
  h1("13. Glossary — Key Terms Explained"),
  spacer(60),
  metricsTable([
    ["AUC-ROC",          "Area Under the ROC Curve. Measures model's ability to rank buggy above clean. 0.5 = random, 1.0 = perfect"],
    ["Batch Size",       "How many training samples are processed simultaneously before updating model weights"],
    ["BCELoss",          "Binary Cross-Entropy Loss. Measures prediction error for binary (yes/no) classification problems"],
    ["BPE",              "Byte Pair Encoding. A subword tokenization method that splits rare words into known pieces"],
    ["BLEU-4",           "Bilingual Evaluation Understudy. Measures text similarity using 4-word sequence overlap"],
    ["CNN",              "Convolutional Neural Network. Detects local patterns using sliding windows (filters)"],
    ["CodeBERT",         "Microsoft's pretrained transformer model trained on 8M code-comment pairs"],
    ["Dropout",          "Randomly deactivates neurons during training to prevent memorization (overfitting)"],
    ["Early Stopping",   "Halts training when validation performance stops improving to prevent overfitting"],
    ["Embedding",        "Dense vector representation of a token in high-dimensional space"],
    ["F1 Score",         "Harmonic mean of precision and recall. Balances both measures"],
    ["Fine-tuning",      "Continuing training of a pretrained model on a new specific task"],
    ["Groq",             "AI inference provider using custom LPU hardware for fast LLM responses"],
    ["Llama 3.1 8B",     "Meta's open-source large language model with 8 billion parameters"],
    ["Max Pooling",       "Selects the strongest signal from each filter across all positions"],
    ["Overfitting",      "Model memorizes training data but fails to generalize to new examples"],
    ["Pos Weight",       "Class weight in loss function to correct for imbalanced datasets"],
    ["Prompt Engineering","Crafting input text to elicit better responses from language models"],
    ["TextCNN",          "CNN variant adapted for text classification using 1D convolutions on token sequences"],
    ["Token Fertility",  "Ratio of BPE tokens to whitespace words — measures tokenization granularity"],
    ["Tokenization",     "Breaking raw text into smaller units (tokens) for processing by neural networks"],
    ["Transformer",      "Neural network architecture using self-attention to model relationships between tokens"],
  ], ["Term", "Definition"]),

];

// ── BUILD DOCUMENT ─────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/CodeLens_Project_Documentation.docx", buffer);
  console.log("Done: CodeLens_Project_Documentation.docx");
});