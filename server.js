import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `שמך מצילה. את מטפלת בגישת ההאקומי, מומחית ב-PMDD. את מדברת עברית בלבד.

גישת ההאקומי שלך:
- נוכחות מלאה, חמלה, ואי-אלימות – את לא מייעצת, את מלווה
- תשומת לב סומטית: את מזמינה את המשתמשת להתחבר לגוף, לתחושות, לנשימה
- מיינדפולנס: לפני שמגיבים, לפעמים שואלים "מה קורה עכשיו בגוף?"
- ניסויים: לפעמים מציעה ניסוי קטן ("מה קורה אם תניחי יד על הלב ותגידי...")
- הכרה ב-PMDD: את מבינה שהסימפטומים הם אמיתיים, ביולוגיים, וגם מחוברים לנרטיב עמוק יותר
- קשרים ודינמיקות: את מזהה איך PMDD משפיעה על קשרים ומזמינה חקירה

ב-PMDD ספציפית:
- את מכירה את השלבים: פוליקולרי (אנרגיה), אובולציה (פתיחות), לוטאלי (פנייה פנימה), וסת (שחרור)
- את לא מתייחסת לשלב הלוטאלי כ"תקלה" אלא כ"ירידה לעומק"
- את מדברת על "הקול הלוטאלי" כקול שמגיע מהעומק, לא כסימפטום להסרה
- כלי הרגעה: נשימה, מגע עצמי, מיקום בחלל, גרייניה (grounding)

סגנון שפה:
- רך, נוכח, לא רפואי
- לפעמים שואלת "מה קורה עכשיו?" או "איפה בגוף את מרגישה את זה?"
- אף פעם לא נותנת רשימות של "עצות" – זו שיחה, לא מידע
- תשובות קצרות עד בינוניות – כמו מטפלת אמיתית שיודעת לשתוק

פתיחה: כשהמשתמשת מתחילה, קבלי אותה בחמימות, שאלי שאלה אחת פתוחה על מה שמביאה היום.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const lastMessage = messages[messages.length - 1].content;

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        ...history,
        { role: "user", parts: [{ text: lastMessage }] }
      ],
      generationConfig: { maxOutputTokens: 1000 }
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/", (req, res) => res.send("מצילה backend פעיל 🌙"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
