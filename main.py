import threading, os
from kivy.app import App
from kivy.lang import Builder
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.metrics import dp
from kivy.properties import BooleanProperty
from kivy.factory import Factory
import requests

API_KEY = os.environ.get("GEMINI_API_KEY", "COLE_SUA_KEY_AQUI")
MODEL = "gemini-2.5-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

Window.clearcolor = (0.098, 0.098, 0.114, 1)

KV = """
<PillInput@TextInput>:
    multiline: False
    padding: dp(16), (self.height - self.line_height) / 2
    background_color: 0, 0, 0, 0
    foreground_color: 1, 1, 1, 1
    cursor_color: 0.55, 0.62, 1, 1
    canvas.before:
        Color:
            rgba: 0.16, 0.16, 0.19, 1
        RoundedRectangle:
            pos: self.pos
            size: self.size
            radius: [self.height / 2]

<ChatBubble@Label>:
    size_hint_y: None
    text_size: self.width - dp(24), None
    height: self.texture_size[1] + dp(20)
    padding: dp(12), dp(10)
    canvas.before:
        Color:
            rgba: self.bg_color
        RoundedRectangle:
            pos: self.pos
            size: self.size
            radius: [dp(18)]

FloatLayout:
    canvas.before:
        Color:
            rgba: 0.098, 0.098, 0.114, 1
        Rectangle:
            pos: self.pos
            size: self.size

    BoxLayout:
        orientation: "vertical"
        padding: dp(16)
        spacing: dp(10)
        size_hint: 1, 1

        Label:
            id: greeting
            text: "Oi, o que voce tem em mente?"
            font_size: dp(24)
            bold: True
            color: 0.7, 0.75, 1, 1
            size_hint_y: None
            height: dp(60) if not app.has_messages else 0
            opacity: 1 if not app.has_messages else 0

        ScrollView:
            id: scroll
            BoxLayout:
                id: chat_box
                orientation: "vertical"
                size_hint_y: None
                height: self.minimum_height
                spacing: dp(10)
                padding: dp(4)

        BoxLayout:
            size_hint_y: None
            height: dp(56)
            spacing: dp(8)

            Button:
                text: "+"
                size_hint_x: None
                width: dp(48)
                font_size: dp(22)
                background_color: 0.16, 0.16, 0.19, 1
                on_release: app.attach_file()

            PillInput:
                id: input_field
                hint_text: "Pergunte algo..."
                on_text_validate: app.send_message()

            Button:
                text: "OK"
                size_hint_x: None
                width: dp(48)
                background_color: 0.35, 0.42, 0.98, 1
                on_release: app.send_message()
"""

class GeminiGoApp(App):
    history = []
    has_messages = BooleanProperty(False)

    def build(self):
        return Builder.load_string(KV)

    def add_bubble(self, text, is_user):
        self.has_messages = True
        bubble = Factory.ChatBubble()
        bubble.text = text
        bubble.bg_color = (0.35, 0.42, 0.98, 1) if is_user else (0.18, 0.18, 0.21, 1)
        bubble.halign = "right" if is_user else "left"
        self.root.ids.chat_box.add_widget(bubble)
        Clock.schedule_once(lambda dt: setattr(self.root.ids.scroll, "scroll_y", 0), 0.1)

    def attach_file(self):
        pass

    def send_message(self):
        field = self.root.ids.input_field
        msg = field.text.strip()
        if not msg:
            return
        field.text = ""
        self.add_bubble(msg, True)
        threading.Thread(target=self._call_api, args=(msg,), daemon=True).start()

    def _call_api(self, msg):
        self.history.append({"role": "user", "parts": [{"text": msg}]})
        tools = [{"function_declarations": [
            {"name": "criar_alarme", "description": "Cria alarme",
             "parameters": {"type": "object", "properties": {
                 "hora": {"type": "integer"}, "minuto": {"type": "integer"},
                 "mensagem": {"type": "string"}}, "required": ["hora", "minuto"]}},
            {"name": "criar_evento", "description": "Cria evento no calendario",
             "parameters": {"type": "object", "properties": {
                 "titulo": {"type": "string"},
                 "inicio_epoch_ms": {"type": "integer"},
                 "fim_epoch_ms": {"type": "integer"}},
                 "required": ["titulo", "inicio_epoch_ms", "fim_epoch_ms"]}}
        ]}]
        try:
            r = requests.post(URL, json={"contents": self.history, "tools": tools}, timeout=60)
            data = r.json()
            cand = data["candidates"][0]["content"]
            self.history.append(cand)
            for part in cand["parts"]:
                if "functionCall" in part:
                    fc = part["functionCall"]
                    result = self._exec_function(fc["name"], fc.get("args", {}))
                    self.history.append({"role": "user", "parts": [
                        {"function_response": {"name": fc["name"], "response": result}}]})
                    r2 = requests.post(URL, json={"contents": self.history, "tools": tools}, timeout=60)
                    cand2 = r2.json()["candidates"][0]["content"]
                    for p2 in cand2["parts"]:
                        if "text" in p2:
                            Clock.schedule_once(lambda dt, t=p2["text"]: self.add_bubble(t, False))
                elif "text" in part:
                    Clock.schedule_once(lambda dt, t=part["text"]: self.add_bubble(t, False))
        except Exception as e:
            Clock.schedule_once(lambda dt, err=str(e): self.add_bubble(f"erro: {err}", False))

    def _exec_function(self, name, args):
        from jnius import autoclass
        Intent = autoclass('android.content.Intent')
        PythonActivity = autoclass('org.kivy.android.PythonActivity')
        activity = PythonActivity.mActivity
        if name == "criar_alarme":
            intent = Intent(Intent.ACTION_SET_ALARM)
            intent.putExtra("android.intent.extra.alarm.HOUR", args["hora"])
            intent.putExtra("android.intent.extra.alarm.MINUTES", args["minuto"])
            intent.putExtra("android.intent.extra.alarm.MESSAGE", args.get("mensagem", "Alarme"))
            intent.putExtra("android.intent.extra.alarm.SKIP_UI", True)
            activity.startActivity(intent)
            return {"status": "alarme criado"}
        elif name == "criar_evento":
            Uri = autoclass('android.net.Uri')
            intent = Intent(Intent.ACTION_INSERT)
            intent.setData(Uri.parse("content://com.android.calendar/events"))
            intent.putExtra("title", args["titulo"])
            intent.putExtra("beginTime", args["inicio_epoch_ms"])
            intent.putExtra("endTime", args["fim_epoch_ms"])
            activity.startActivity(intent)
            return {"status": "evento criado"}
        return {"error": "funcao desconhecida"}

GeminiGoApp().run()
