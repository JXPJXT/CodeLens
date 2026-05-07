# CodeLens AI

**Real-time AI-powered code review assistant for VS Code** with automated bug detection, security vulnerability scanning, and intelligent code explanations.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Languages](https://img.shields.io/badge/languages-C%20%7C%20Python%20%7C%20JavaScript-orange)

## 🎯 Overview

CodeLens AI is a comprehensive code analysis system that combines **machine learning models** (TextCNN, CodeBERT embeddings) with **heuristic pattern detection** and **LLM-powered explanations** to provide real-time code review directly in VS Code.

The system detects:
- **Security vulnerabilities** (buffer overflows, null pointer dereferences, unsafe patterns like `eval()`, `exec()`, etc.)
- **Code quality issues** (deeply nested code, overly long lines, problematic patterns)
- **Memory safety bugs** (memory leaks, unsafe memory operations)
- Supports **C, Python, and JavaScript** code analysis

---

## ✨ Features

### 🔍 Multi-Modal Analysis
- **Heuristic Pattern Detection**: Identifies unsafe code patterns specific to each language
- **ML-Based Classification**: TextCNN model trained to classify code as buggy or safe
- **LLM-Powered Explanations**: Uses Groq API to generate detailed, human-readable explanations
- **Risk Scoring**: Assigns risk scores (0.0-1.0) based on multiple detection methods

### 🛡️ Security Vulnerabilities Detected
- **Python**: `eval()`, `exec()`, `pickle.loads()`, `subprocess.call(shell=True)`
- **JavaScript**: `eval()`, `innerHTML`, `document.write()`, `dangerouslySetInnerHTML`
- **Java/C**: `Runtime.exec()`, `ProcessBuilder()`, unsafe memory operations
- **Buffer Overflows**, **Null Pointer Dereferences**, **Memory Leaks**

### 📊 Intelligent Feedback
- **Line-by-line risk assessment**
- **Caching for fast repeated analysis**
- **Detailed explanations** of detected issues
- **Severity classification** with actionable recommendations

### ⚡ VS Code Integration
- **Real-time scanning** on file save
- **Command palette integration** for manual analysis
- **Visual highlighting** of risky code sections
- **Quick explanations** with hover and command tools
- **Configurable backend URL** for flexible deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                     │
│         (TypeScript - Real-time UI & Commands)           │
├─────────────────────────────────────────────────────────┤
│                 HTTP/REST API Connection                 │
│                   (localhost:8000)                       │
├─────────────────────────────────────────────────────────┤
│                   FastAPI Backend                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Analysis Router                                   │ │
│  │  ├─ Heuristic Analyzer (Pattern Detection)        │ │
│  │  ├─ ML Classifier (TextCNN Model)                 │ │
│  │  ├─ LLM Service (Groq API for Explanations)       │ │
│  │  └─ Caching Layer (Redis/In-memory)               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Routes: /analyze, /review, /feedback             │ │
│  │  Database: Logging & Metrics Storage              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 16+ (for VS Code extension development)
- **Python** 3.10+ (for backend)
- **VS Code** 1.85.0 or later

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codelens
   ```

2. **Create a Python virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   LLM_MODEL_ID=mixtral-8x7b-32768
   RISK_THRESHOLD=0.4
   CNN_MODEL_PATH=./training/outputs/textcnn.pt
   VOCAB_PATH=./training/outputs/tokenizer_vocab.json
   DATABASE_URL=sqlite:///./codelens.db
   LOG_LEVEL=INFO
   BACKEND_PORT=8000
   CACHE_ENABLED=true
   MAX_CODE_LENGTH=256
   ```

5. **Download/Train ML Models**
   ```bash
   cd training
   python train.py
   cd ..
   ```

6. **Initialize the database**
   ```bash
   python -c "from backend.db.db import init_db; init_db()"
   ```

7. **Start the backend server**
   ```bash
   uvicorn backend.app:app --reload --port 8000
   ```

### VS Code Extension Setup

1. **Navigate to the extension directory**
   ```bash
   cd extension
   ```

2. **Install TypeScript dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Run the extension**
   - Press `F5` in VS Code to launch the extension in debug mode
   - Or package it: `vsce package`

---

## 🚀 Usage

### Via VS Code Commands

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and use:

- **`CodeLens: Explain this line`** - Get AI-powered explanation of the current line
- **`CodeLens: Scan this file`** - Analyze the entire file for issues
- **`CodeLens: Clear all highlights`** - Remove all visual highlighting

### Automatic Analysis

The extension automatically scans files on save for:
- `.c` files (C code)
- `.py` files (Python code)
- `.js` files (JavaScript code)

Detected issues appear as:
- **Visual highlights** (red/yellow backgrounds)
- **Hover tooltips** with issue descriptions
- **Decorations** showing risk scores

### Configuration

In VS Code settings, configure:
```json
{
  "codelens.backendUrl": "http://localhost:8000"
}
```

---

## 📁 Project Structure

```
codelens/
├── backend/                          # FastAPI backend service
│   ├── app.py                        # Main FastAPI application
│   ├── config.py                     # Configuration & settings
│   ├── db/
│   │   ├── db.py                     # Database initialization
│   │   └── schema.sql                # Database schema
│   ├── routes/
│   │   ├── analyze.py                # POST /analyze endpoint
│   │   ├── review.py                 # Code review route
│   │   └── feedback.py               # Feedback collection route
│   ├── schemas/                      # Pydantic request/response schemas
│   ├── services/
│   │   ├── analyzer.py               # Heuristic pattern detection
│   │   ├── llm_service.py            # Groq LLM integration
│   │   ├── cnn_service.py            # TextCNN model inference
│   │   ├── cache.py                  # Caching layer
│   │   ├── router.py                 # Route analysis logic
│   │   └── ...
│   ├── utils/                        # Utilities (logger, tokenizer, etc.)
│   └── shared/                       # Shared resources (prompts, examples)
│
├── extension/                        # VS Code TypeScript extension
│   ├── src/
│   │   ├── extension.ts              # Extension entry point
│   │   ├── commands.ts               # Command handlers
│   │   ├── api.ts                    # Backend API client
│   │   ├── highlighter.ts            # Visual highlighting logic
│   │   └── panel.ts                  # Webview panel
│   ├── package.json                  # Extension manifest
│   └── tsconfig.json                 # TypeScript configuration
│
├── training/                         # ML model training
│   ├── train.py                      # TextCNN training script
│   ├── model.py                      # TextCNN architecture
│   ├── dataset_loader.py             # Dataset preprocessing
│   ├── finetune_codebert.py          # CodeBERT fine-tuning
│   ├── generate_embeddings.py        # Embedding generation
│   ├── evaluate.py                   # Model evaluation
│   ├── outputs/                      # Trained model artifacts
│   │   ├── textcnn.pt                # Trained TextCNN weights
│   │   ├── tokenizer_vocab.json      # Vocabulary file
│   │   └── codebert_tokenizer/       # CodeBERT tokenizer
│   └── ...
│
├── requirements.txt                  # Python dependencies
├── vulnerable_sample.c               # Example C code with bugs
└── README.md                         # This file
```

---

## 🔧 API Endpoints

### POST `/analyze`
Analyzes code and returns risk assessment.

**Request:**
```json
{
  "code": "def my_function(user_input):\n    eval(user_input)",
  "language": "python"
}
```

**Response:**
```json
{
  "risk_score": 0.6,
  "is_buggy": true,
  "risky_lines": [
    {
      "line": 1,
      "score": 0.3
    },
    {
      "line": 2,
      "score": 0.6
    }
  ],
  "explanation": "Unsafe use of eval() function detected. This allows arbitrary code execution.",
  "mode": "hybrid"
}
```

### POST `/review`
Generates detailed code review.

### POST `/feedback`
Collects user feedback for model improvement.

### GET `/health`
Health check endpoint.

---

## 🧠 ML Models

### TextCNN
- **Architecture**: Convolutional Neural Network for text classification
- **Input**: Tokenized code snippets (max 256 tokens)
- **Output**: Binary classification (buggy/not buggy)
- **Training**: Binary cross-entropy loss with Adam optimizer
- **Vocab Size**: 50,265 tokens

### CodeBERT Embeddings
- **Purpose**: Semantic code understanding
- **Integration**: Optional embedding-based analysis
- **Fine-tuning**: Supports domain-specific fine-tuning

---

## ⚙️ Dependencies

### Backend
```
fastapi==0.110.0           # Web framework
uvicorn==0.29.0            # ASGI server
torch==2.2.1               # ML framework
transformers==4.39.0       # Pre-trained models (CodeBERT)
pydantic==2.6.0            # Data validation
scikit-learn==1.4.1        # ML utilities
nltk==3.8.1                # NLP toolkit
requests==2.31.0           # HTTP client (for Groq API)
```

### Extension
```
@types/vscode==1.85.0      # VS Code API types
typescript==5.0.0          # TypeScript compiler
```

---

## 🔐 Configuration

All configuration is managed through environment variables (see `.env` template above):

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for LLM | Required |
| `LLM_MODEL_ID` | LLM model to use | mixtral-8x7b-32768 |
| `RISK_THRESHOLD` | Risk score threshold | 0.4 |
| `CNN_MODEL_PATH` | Path to trained model | ./training/outputs/textcnn.pt |
| `VOCAB_PATH` | Tokenizer vocabulary path | ./training/outputs/tokenizer_vocab.json |
| `DATABASE_URL` | Database connection string | sqlite:///./codelens.db |
| `CACHE_ENABLED` | Enable result caching | true |
| `MAX_CODE_LENGTH` | Max tokens per analysis | 256 |

---

## 📊 Performance Metrics

- **Latency**: ~500ms per analysis (depends on code length)
- **Cache Hit Rate**: 30-50% for typical usage
- **Model Accuracy**: ~85% on test dataset
- **Supported Languages**: C, Python, JavaScript

---

## 🛠️ Development

### Running Tests
```bash
pytest backend/tests/
```

### Training Custom Models
```bash
cd training
python train.py --epochs 20 --batch-size 64
```

### Debugging Backend
```bash
LOGLEVEL=DEBUG uvicorn backend.app:app --reload
```

### Debugging Extension
Press `F5` in VS Code to attach debugger to the extension process.

---

## 🐛 Known Limitations

1. **Code Length**: Maximum 256 tokens per analysis (longer code is truncated)
2. **Language Support**: Limited to C, Python, and JavaScript
3. **LLM Rate Limiting**: Groq API rate limits may apply
4. **Cache**: In-memory cache not persisted across sessions
5. **ML Models**: TextCNN has limited semantic understanding compared to transformer models

---

## 🔮 Future Enhancements

- [ ] Support for additional languages (Java, Go, Rust)
- [ ] Integration with more LLM providers
- [ ] Persistent caching with Redis
- [ ] Custom model training UI
- [ ] Real-time collaborative analysis
- [ ] GitHub/GitLab integration
- [ ] Performance profiling insights
- [ ] Automated refactoring suggestions

---

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review example in [vulnerable_sample.c](vulnerable_sample.c)

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- ML models powered by [PyTorch](https://pytorch.org/) and [Transformers](https://huggingface.co/transformers/)
- LLM integration via [Groq API](https://groq.com/)
- VS Code extension using [official VS Code API](https://code.visualstudio.com/api)

---

**Last Updated**: April 2026
