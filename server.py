"""
GymAI — сервер Mini App + Telegram бот
Запуск: python server.py
"""
import os, json, asyncio, threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import anthropic
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
)
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage

BOT_TOKEN     = os.environ["BOT_TOKEN"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_KEY"]
PORT          = int(os.environ.get("PORT", 8080))
WEBAPP_URL    = os.environ.get("WEBAPP_URL", f"http://localhost:{PORT}")

bot = Bot(token=BOT_TOKEN)
dp  = Dispatcher(storage=MemoryStorage())
ai  = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

# ─── HTTP сервер (отдаёт Mini App + Claude API) ─────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass  # тихий режим

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/" or path == "/index.html":
            self._serve_file("index.html", "text/html")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/claude":
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length))
            try:
                resp = ai.messages.create(
                    model      = "claude-sonnet-4-5",
                    max_tokens = body.get("max_tokens", 1000),
                    system     = body.get("system", "Ты полезный AI-ассистент."),
                    messages   = body.get("messages", []),
                )
                text = resp.content[0].text
                self._json({"text": text})
            except Exception as e:
                self._json({"error": str(e)}, 500)
        else:
            self.send_response(404)
            self.end_headers()

    def _serve_file(self, name, ct):
        p = Path(__file__).parent / name
        if p.exists():
            data = p.read_bytes()
            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", ct + "; charset=utf-8")
            self.send_header("Content-Length", len(data))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_response(404)
            self.end_headers()

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

# ─── Telegram бот ────────────────────────────────────────────────────────────
def webapp_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(
            text="🏋️ Открыть GymAI",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]],
        resize_keyboard=True
    )

@dp.message(CommandStart())
async def start(msg: Message):
    await msg.answer(
        "👋 Привет! Я *GymAI* — твой персональный тренер.\n\n"
        "Нажми кнопку ниже чтобы открыть приложение 👇",
        parse_mode="Markdown",
        reply_markup=webapp_kb()
    )

@dp.message(F.text)
async def any_msg(msg: Message):
    await msg.answer(
        "Нажми кнопку *🏋️ Открыть GymAI* чтобы войти в приложение!",
        parse_mode="Markdown",
        reply_markup=webapp_kb()
    )

# ─── Запуск ──────────────────────────────────────────────────────────────────
def run_http():
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"🌐 Mini App: {WEBAPP_URL}")
    server.serve_forever()

async def run_bot():
    print("🤖 Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    t = threading.Thread(target=run_http, daemon=True)
    t.start()
    asyncio.run(run_bot())
