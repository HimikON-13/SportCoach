"""
GymAI Telegram Bot
==================
Установка:
  pip install aiogram anthropic aiohttp

Запуск:
  BOT_TOKEN=xxx ANTHROPIC_KEY=xxx python gymai_bot.py

Переменные окружения:
  BOT_TOKEN      — токен от @BotFather
  ANTHROPIC_KEY  — ключ от console.anthropic.com
"""

import os, json, asyncio
from pathlib import Path
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardMarkup,
    InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton,
    ReplyKeyboardRemove
)
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
import anthropic

# ─── Конфигурация ───────────────────────────────────────────────────────────
BOT_TOKEN     = os.environ["BOT_TOKEN"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_KEY"]
DATA_FILE     = Path("gym_data.json")   # простое хранение данных в JSON

bot      = Bot(token=BOT_TOKEN)
dp       = Dispatcher(storage=MemoryStorage())
ai       = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

# ─── FSM состояния ──────────────────────────────────────────────────────────
class ProfileSetup(StatesGroup):
    name    = State()
    age     = State()
    weight  = State()
    height  = State()
    goal    = State()
    level   = State()

class AddEquipment(StatesGroup):
    waiting_name    = State()
    waiting_muscles = State()

class LogWorkout(StatesGroup):
    waiting_input = State()

# ─── Хранилище данных (JSON файл) ──────────────────────────────────────────
def load_data() -> dict:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {}

def save_data(data: dict):
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def get_user(uid: int) -> dict:
    data = load_data()
    key  = str(uid)
    if key not in data:
        data[key] = {
            "profile":  {},
            "equipment": [],
            "workouts":  [],
        }
        save_data(data)
    return data[key]

def update_user(uid: int, user: dict):
    data = load_data()
    data[str(uid)] = user
    save_data(data)

# ─── Клавиатуры ─────────────────────────────────────────────────────────────
def main_menu() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="💪 Сгенерировать тренировку")],
        [KeyboardButton(text="🏋️ Мой зал"),  KeyboardButton(text="📋 История")],
        [KeyboardButton(text="📈 Прогресс"), KeyboardButton(text="🤖 AI-тренер")],
        [KeyboardButton(text="⚙️ Профиль")],
    ], resize_keyboard=True)

def goals_kb() -> ReplyKeyboardMarkup:
    goals = ["Набор массы", "Похудение", "Сила", "Выносливость", "Рельеф"]
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=g)] for g in goals],
        resize_keyboard=True
    )

def levels_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="Новичок")],
        [KeyboardButton(text="Средний")],
        [KeyboardButton(text="Продвинутый")],
    ], resize_keyboard=True)

def workout_type_kb() -> InlineKeyboardMarkup:
    types = ["Силовая", "Гипертрофия", "Полное тело", "Верх тела", "Низ тела"]
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t, callback_data=f"wtype:{t}")] for t in types
    ])

def muscle_focus_kb() -> InlineKeyboardMarkup:
    muscles = ["Грудь", "Спина", "Плечи", "Бицепс", "Трицепс",
               "Квадрицепс", "Бицепс бедра", "Пресс", "Без акцента"]
    rows = []
    for i in range(0, len(muscles), 2):
        row = [InlineKeyboardButton(text=muscles[i], callback_data=f"mfocus:{muscles[i]}")]
        if i+1 < len(muscles):
            row.append(InlineKeyboardButton(text=muscles[i+1], callback_data=f"mfocus:{muscles[i+1]}"))
        rows.append(row)
    return InlineKeyboardMarkup(inline_keyboard=rows)

# ─── Утилита: вызов Claude ──────────────────────────────────────────────────
def call_claude(system: str, messages: list, max_tokens: int = 900) -> str:
    resp = ai.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    return resp.content[0].text

def build_system(user: dict) -> str:
    p = user.get("profile", {})
    eq = user.get("equipment", [])
    wo = user.get("workouts", [])

    s  = "Ты персональный AI-тренер в Telegram. Отвечай по-русски, кратко и по делу. "
    s += "Предлагай упражнения ТОЛЬКО на оборудовании из зала пользователя.\n\n"

    if p:
        s += f"Профиль: {p.get('name','')}, цель — {p.get('goal','')}, уровень — {p.get('level','')}."
        if p.get("weight"): s += f" Вес — {p['weight']} кг."
        if p.get("height"): s += f" Рост — {p['height']} см."
        s += "\n"

    if eq:
        s += "\nОборудование в зале:\n"
        for e in eq:
            s += f"- {e['name']} (мышцы: {', '.join(e.get('muscles',[]))})\n"
    else:
        s += "\nТренажёры пользователя не заданы.\n"

    if wo:
        last = wo[-1]
        s += f"\nПоследняя тренировка: {last['name']} ({last['date']})"

    return s

def format_workout(plan: dict) -> str:
    lines = [f"💪 *{plan['name']}*  _{plan.get('duration','')}_ \n"]
    for ex in plan.get("exercises", []):
        lines.append(
            f"*{ex['name']}*\n"
            f"  🏋️ {ex.get('equipment','')}\n"
            f"  📊 {ex['sets']}×{ex['reps']}  ·  ⚖️ {ex.get('weight','')}"
            f"  ·  ⏱ {ex.get('rest','')}"
        )
        if ex.get("tip"):
            lines.append(f"  💡 _{ex['tip']}_")
        lines.append("")
    if plan.get("notes"):
        lines.append(f"📝 {plan['notes']}")
    return "\n".join(lines)

# ─── /start ─────────────────────────────────────────────────────────────────
@dp.message(CommandStart())
async def cmd_start(msg: Message, state: FSMContext):
    user = get_user(msg.from_user.id)
    if user["profile"].get("name"):
        name = user["profile"]["name"]
        await msg.answer(
            f"Привет, {name}! 👋 Я твой AI-тренер.\nЧем займёмся?",
            reply_markup=main_menu()
        )
    else:
        await msg.answer(
            "👋 Привет! Я *GymAI* — персональный тренер на базе Claude.\n\n"
            "Буду составлять тренировки под твоё оборудование и цели.\n\n"
            "Давай настроим профиль. Как тебя зовут?",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardRemove()
        )
        await state.set_state(ProfileSetup.name)

# ─── Настройка профиля (FSM) ─────────────────────────────────────────────────
@dp.message(ProfileSetup.name)
async def prof_name(msg: Message, state: FSMContext):
    await state.update_data(name=msg.text.strip())
    await msg.answer("Сколько тебе лет?")
    await state.set_state(ProfileSetup.age)

@dp.message(ProfileSetup.age)
async def prof_age(msg: Message, state: FSMContext):
    await state.update_data(age=msg.text.strip())
    await msg.answer("Твой вес (кг)?")
    await state.set_state(ProfileSetup.weight)

@dp.message(ProfileSetup.weight)
async def prof_weight(msg: Message, state: FSMContext):
    await state.update_data(weight=msg.text.strip())
    await msg.answer("Рост (см)?")
    await state.set_state(ProfileSetup.height)

@dp.message(ProfileSetup.height)
async def prof_height(msg: Message, state: FSMContext):
    await state.update_data(height=msg.text.strip())
    await msg.answer("Выбери цель:", reply_markup=goals_kb())
    await state.set_state(ProfileSetup.goal)

@dp.message(ProfileSetup.goal)
async def prof_goal(msg: Message, state: FSMContext):
    await state.update_data(goal=msg.text.strip())
    await msg.answer("Уровень подготовки:", reply_markup=levels_kb())
    await state.set_state(ProfileSetup.level)

@dp.message(ProfileSetup.level)
async def prof_level(msg: Message, state: FSMContext):
    data = await state.get_data()
    profile = {
        "name":   data["name"],
        "age":    data["age"],
        "weight": data["weight"],
        "height": data["height"],
        "goal":   data["goal"],
        "level":  msg.text.strip(),
    }
    user = get_user(msg.from_user.id)
    user["profile"] = profile
    update_user(msg.from_user.id, user)
    await state.clear()
    await msg.answer(
        f"✅ Профиль сохранён!\n\n"
        f"Теперь добавь тренажёры своего зала — напиши *🏋️ Мой зал*\n"
        f"или сразу генерируй тренировку.",
        parse_mode="Markdown",
        reply_markup=main_menu()
    )

# ─── Мой зал ─────────────────────────────────────────────────────────────────
@dp.message(F.text == "🏋️ Мой зал")
async def show_gym(msg: Message):
    user = get_user(msg.from_user.id)
    eq   = user.get("equipment", [])
    if not eq:
        text = (
            "🏋️ *Твой зал пустой*\n\n"
            "Добавь тренажёры командой /add\\_eq\n"
            "Например: `/add_eq Штанга + стойки`\n\n"
            "Формат: `/add_eq Название | Мышца1, Мышца2`"
        )
    else:
        lines = ["🏋️ *Тренажёры в твоём зале:*\n"]
        for i, e in enumerate(eq, 1):
            muscles = ", ".join(e.get("muscles", []))
            lines.append(f"{i}. *{e['name']}*" + (f" — {muscles}" if muscles else ""))
        lines.append("\n📌 /add\\_eq — добавить  |  /del\\_eq N — удалить номер")
        text = "\n".join(lines)
    await msg.answer(text, parse_mode="Markdown")

@dp.message(Command("add_eq"))
async def add_eq(msg: Message):
    """
    Использование:
      /add_eq Штанга + стойки
      /add_eq Жим ногами | Квадрицепс, Бицепс бедра, Ягодицы
    """
    args = msg.text.removeprefix("/add_eq").strip()
    if not args:
        await msg.answer(
            "Напиши название тренажёра:\n"
            "`/add_eq Штанга + стойки`\n"
            "или с мышцами:\n"
            "`/add_eq Тяга верхнего блока | Спина, Бицепс`",
            parse_mode="Markdown"
        )
        return

    parts = args.split("|", 1)
    name    = parts[0].strip()
    muscles = [m.strip() for m in parts[1].split(",")] if len(parts) > 1 else []

    # Если мышцы не указаны — спросим у Claude
    if not muscles:
        await msg.answer(f"⏳ Определяю мышцы для «{name}»...")
        prompt = (
            f"Тренажёр: {name}\n"
            "Перечисли основные рабочие мышцы через запятую (только названия, без пояснений). "
            "Выбирай только из: Грудь, Спина, Плечи, Бицепс, Трицепс, Квадрицепс, "
            "Бицепс бедра, Икры, Пресс, Ягодицы, Трапеции"
        )
        answer = call_claude("Ты эксперт по тренажёрам. Отвечай только списком мышц.", [{"role":"user","content":prompt}], 100)
        muscles = [m.strip() for m in answer.split(",")]

    user = get_user(msg.from_user.id)
    user["equipment"].append({"name": name, "muscles": muscles})
    update_user(msg.from_user.id, user)

    await msg.answer(
        f"✅ *{name}* добавлен!\n"
        f"Мышцы: {', '.join(muscles)}\n\n"
        f"Всего тренажёров: {len(user['equipment'])}",
        parse_mode="Markdown"
    )

@dp.message(Command("del_eq"))
async def del_eq(msg: Message):
    args = msg.text.removeprefix("/del_eq").strip()
    user = get_user(msg.from_user.id)
    try:
        idx = int(args) - 1
        removed = user["equipment"].pop(idx)
        update_user(msg.from_user.id, user)
        await msg.answer(f"🗑 «{removed['name']}» удалён.")
    except (ValueError, IndexError):
        await msg.answer("Напиши номер тренажёра: `/del_eq 2`", parse_mode="Markdown")

# ─── Генерация тренировки ────────────────────────────────────────────────────
@dp.message(F.text == "💪 Сгенерировать тренировку")
async def gen_workout_start(msg: Message):
    user = get_user(msg.from_user.id)
    if not user.get("equipment"):
        await msg.answer(
            "⚠️ Сначала добавь тренажёры своего зала!\n"
            "Используй /add\\_eq",
            parse_mode="Markdown"
        )
        return
    await msg.answer("Выбери тип тренировки:", reply_markup=workout_type_kb())

@dp.callback_query(F.data.startswith("wtype:"))
async def workout_type_chosen(cb: CallbackQuery, state: FSMContext):
    wtype = cb.data.split(":", 1)[1]
    await state.update_data(wtype=wtype)
    await cb.message.edit_text(f"Тип: *{wtype}*\n\nВыбери акцент на мышцы:", parse_mode="Markdown")
    await cb.message.edit_reply_markup(reply_markup=muscle_focus_kb())

@dp.callback_query(F.data.startswith("mfocus:"))
async def muscle_focus_chosen(cb: CallbackQuery, state: FSMContext):
    focus  = cb.data.split(":", 1)[1]
    data   = await state.get_data()
    wtype  = data.get("wtype", "Силовая")
    user   = get_user(cb.from_user.id)

    await cb.message.edit_text("⏳ Claude составляет тренировку...")
    await state.clear()

    eq = user.get("equipment", [])
    eq_desc = "\n".join(
        f"- {e['name']} (мышцы: {', '.join(e.get('muscles',[]))})"
        for e in eq
    )
    p = user.get("profile", {})
    prompt = (
        f"Составь тренировку СТРОГО на этом оборудовании:\n{eq_desc}\n\n"
        f"Профиль: цель — {p.get('goal','')}, уровень — {p.get('level','')}."
        + (f" Вес — {p['weight']} кг." if p.get("weight") else "")
        + f"\nТип: {wtype}."
        + (f"\nАкцент: {focus}." if focus != "Без акцента" else "")
        + "\n\nОтвечай ТОЛЬКО JSON без markdown:\n"
        '{"name":"Название","duration":"~60 мин","exercises":['
        '{"name":"Упражнение","equipment":"Тренажёр","sets":3,"reps":"8-10",'
        '"weight":"70 кг","rest":"90 сек","tip":"Подсказка"}],"notes":"Рекомендации"}'
    )

    try:
        raw  = call_claude(build_system(user), [{"role":"user","content":prompt}], 1200)
        plan = json.loads(raw.replace("```json","").replace("```","").strip())
        text = format_workout(plan)

        # Сохранить тренировку в историю
        from datetime import date
        user["workouts"].append({
            "name":      plan["name"],
            "date":      str(date.today()),
            "exercises": [{"name": e["name"]} for e in plan.get("exercises", [])],
        })
        update_user(cb.from_user.id, user)

        await cb.message.edit_text(text, parse_mode="Markdown")
    except Exception as e:
        await cb.message.edit_text(f"⚠️ Ошибка генерации. Попробуй ещё раз.\n`{e}`", parse_mode="Markdown")

# ─── История ─────────────────────────────────────────────────────────────────
@dp.message(F.text == "📋 История")
async def show_history(msg: Message):
    user = get_user(msg.from_user.id)
    wo   = user.get("workouts", [])
    if not wo:
        await msg.answer("Тренировок ещё нет. Сгенерируй первую! 💪")
        return
    lines = ["📋 *История тренировок:*\n"]
    for w in reversed(wo[-10:]):  # последние 10
        lines.append(f"*{w['date']}* — {w['name']}")
        if w.get("exercises"):
            names = ", ".join(e["name"] for e in w["exercises"][:3])
            if len(w["exercises"]) > 3:
                names += f" +{len(w['exercises'])-3}"
            lines.append(f"  _{names}_")
        lines.append("")
    await msg.answer("\n".join(lines), parse_mode="Markdown")

# ─── Прогресс ────────────────────────────────────────────────────────────────
@dp.message(F.text == "📈 Прогресс")
async def show_progress(msg: Message):
    user = get_user(msg.from_user.id)
    wo   = user.get("workouts", [])
    eq   = user.get("equipment", [])
    p    = user.get("profile", {})
    text = (
        f"📈 *Твой прогресс*\n\n"
        f"🏋️ Тренажёров в зале: {len(eq)}\n"
        f"💪 Тренировок записано: {len(wo)}\n"
    )
    if p.get("goal"):
        text += f"🎯 Цель: {p['goal']}\n"
    if wo:
        text += f"\n📅 Последняя тренировка: {wo[-1]['date']} — {wo[-1]['name']}"
    await msg.answer(text, parse_mode="Markdown")

# ─── AI-тренер (свободный чат) ───────────────────────────────────────────────
user_chat_history: dict[int, list] = {}  # uid -> история сообщений

@dp.message(F.text == "🤖 AI-тренер")
async def ai_chat_start(msg: Message):
    uid = msg.from_user.id
    user_chat_history[uid] = []
    await msg.answer(
        "🤖 *AI-тренер активен!*\n\n"
        "Пиши любой вопрос о тренировках, питании, технике.\n"
        "Для выхода — нажми любую кнопку меню.",
        parse_mode="Markdown"
    )

@dp.message(F.text == "⚙️ Профиль")
async def show_profile(msg: Message):
    user = get_user(msg.from_user.id)
    p    = user.get("profile", {})
    if not p:
        await msg.answer("Профиль не заполнен. Напиши /start")
        return
    text = (
        f"⚙️ *Профиль*\n\n"
        f"👤 {p.get('name','—')}\n"
        f"🎂 Возраст: {p.get('age','—')}\n"
        f"⚖️ Вес: {p.get('weight','—')} кг\n"
        f"📏 Рост: {p.get('height','—')} см\n"
        f"🎯 Цель: {p.get('goal','—')}\n"
        f"📊 Уровень: {p.get('level','—')}\n\n"
        f"Чтобы изменить — напиши /start"
    )
    await msg.answer(text, parse_mode="Markdown")

# ─── Универсальный обработчик текста (AI чат) ────────────────────────────────
MENU_TEXTS = {
    "💪 Сгенерировать тренировку", "🏋️ Мой зал", "📋 История",
    "📈 Прогресс", "🤖 AI-тренер", "⚙️ Профиль"
}

@dp.message(F.text)
async def ai_reply(msg: Message, state: FSMContext):
    if msg.text in MENU_TEXTS:
        return  # обработано выше

    uid  = msg.from_user.id
    user = get_user(uid)

    # Добавляем в историю диалога
    history = user_chat_history.get(uid, [])
    history.append({"role": "user", "content": msg.text})

    # Ограничиваем историю последними 20 сообщениями
    if len(history) > 20:
        history = history[-20:]

    await bot.send_chat_action(uid, "typing")
    try:
        answer = call_claude(build_system(user), history)
        history.append({"role": "assistant", "content": answer})
        user_chat_history[uid] = history
        await msg.answer(answer)
    except Exception as e:
        await msg.answer(f"⚠️ Ошибка: {e}")

# ─── Запуск ──────────────────────────────────────────────────────────────────
async def main():
    print("🏋️ GymAI Bot запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
