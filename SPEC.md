# Gemini Go — Especificação real (extraída do APK oficial)

Extraído via apktool 2.11 do `com.google.android.googlequicksearchbox` (Gemini embutido). Todos os labels, ícones, cores e ações abaixo são reais (namespace `assistant_robin_*` / `assistant_gemini_*` / `quantum_gm_*`).

## Identidade
- Nome exibido: **Gemini Go**
- Package: `org.opassoca.geminigo`
- minSdk 35, targetSdk 36, versionCode 1, versionName 0.1
- Logotipo: `assistant_logo_gemini_2025_monochrome_24.xml` (sparkle)

## Telas (estrutura real confirmada)

### 1. Tela de API key (antes do primeiro uso)
- Campo "Cole sua API key do Gemini" (`aistudio.google.com/apikey`)
- Botão "Salvar e continuar"
- Persistência em `localStorage.gemini_api_key`

### 2. Tela de chat principal (`assistant_response_layer_fragment.xml`)
Topbar (`assistant_response_layer_fragment`):
- Ícone menu → abre drawer (`assistant_chat_root_bar_side_nav_description`)
- Nome do modelo "Gemini Go" + chevron (`assistant_robin_threads_*`)
- Ícone conta/perfil → abre account sheet
- Ícone ⋮ more_vert → menu de ações

Centro:
- Saudação "Oi, o que você tem em mente?" + sparkle (`greeting`)
- Lista de mensagens: usuário à direita (#2a2a2e), resposta à esquerda sem bolha
- Disclaimer fixo: "O Gemini Go é uma IA e pode cometer erros."

Input bar (`assistant_robin_input_buttons_v2.xml` / `assistant_robin_input_oneline.xml`):
- Botão "+" → bottom sheet de anexo (`assistant_robin_companion_*`)
- Campo de texto (pill shape)
- Ícone microfone → voice input (`assistant_response_layer_voice_input_bar_container.xml`)
- Botão enviar → #596bfa circular

### 3. Bottom sheet de anexo (`assistant_robin_companion_single_picker.xml` / `_multi_picker.xml`)
- "Arquivos" (ícone plus)
- "Câmera" (ícone camera)
- Cada item tem ícone real `quantum_gm_*`

### 4. Aba lateral drawer (`assistant_robin_side_nav_host_fragment_*`)
Itens reais (strings `assistant_chat_threads_*` e `assistant_robin_*` em pt-BR):

| Item | Ícone real | Ação |
|------|-----------|------|
| Nova conversa | `quantum_gm_ic_add_vd_theme_24.xml` | Limpa `history[]` e `chat.innerHTML` |
| Gems | `quantum_gm_ic_*gems*` ou `assistant_logo_gemini_*` | Abre sheet/lista de Gems (placeholder: mostrar `Gems você cria na web vão aparecer aqui`) |
| Configurações | `quantum_gm_ic_settings*` | Abre account sheet (troca API key) |
| Ajuda | `quantum_gm_ic_help_outline_vd_theme_24.xml` | Abre `aistudio.google.com/apikey` ou disclaimer |

Search dentro do drawer: `assistant_chat_threads_search_*`

### 5. Bottom sheet de ações da thread (`assistant_robin_threads_actions_bottom_sheet_layout.xml`)
Ações reais (todas devem funcionar de verdade):
- Renomear (`assistant_chat_threads_edit_menu_*` → dialog `assistant_robin_threads_rename_dialog.xml`)
- Fixar/Desafixar (`assistant_chat_threads_pin_menu_*` / `un_pin_menu_*`)
- Excluir (`assistant_chat_threads_delete_menu_*`)
- Compartilhar (`assistant_chat_threads_share_menu_*`)
- Adicionar a notebook (`assistant_chat_threads_chat_add_to_notebook_menu_*`)

## Function calling (tools) — ações nativas do Android
O Gemini oficial expõe estas capacidades locais. Nossa implementação `AndroidBridge` (em `MainActivity.kt`):

| Função JS → Kotlin | Real no Gemini |
|--------------------|----------------|
| `criarAlarme(hora,min,mensagem)` | ✅ `AlarmClock.ACTION_SET_ALARM` |
| `criarEvento(titulo,inicioMs,fimMs)` | ✅ `Intent.ACTION_INSERT` calendário |
| `criarTimer(duracaoMs,rotulo)` | **adicionar** — `assistant_robin_create_timer_*` |
| `criarLembrete(titulo,horaEpochMs)` | **adicionar** — `assistant_reminder_*` |

## Paleta real extraída (`values/colors.xml`)
Confirmadas (não inventadas):

| Token real | Hex | Uso |
|------------|-----|-----|
| `og_consent_color_gemini_accent` | `#ff9dd2ff` | destaque |
| `og_consent_color_gemini_surface` | `#ffdfcfcf` | surface light |
| `og_consent_color_gemini_on_surface` | `#ff000000` | texto |
| `assistant_robin_live_default_background_color` | `#ff252626` | fundo dark |
| `assistant_robin_in_chat_stroke` | `?colorOutlineVariant` | stroke pílula |
| `assistant_robin_error_icon_color` | `#ffb3261e` | erro |
| `speechenroll_freshenroll_gemini_blue_dark` | `#ff669df6` | azul |
| `speechenroll_freshenroll_gemini_blue_light` | `#ff4285f4` | azul claro |

## Fontes reais (~ /fonts/)
- `google_sans_local.ttf` (Regular)
- `google_sans_medium_local.ttf` (Medium)
- `roboto_medium_regular.ttf` (fallback números)

## Ícones reais (`quantum_gm_ic_*` — 168 vetoriais)
Usados no clone (11 + drawer + anexo):
- `add_vd_theme_24`, `auto_awesome_vd_theme_24` (sparkle), `camera`
- `mic`, `send`, `plus`, `menu`, `chevron_right`, `edit`, `more_vert`
- `account_circle_vd_theme_24`, `settings`, `help_outline_vd_theme_24`
- `android_messages_vd_theme_24`, `alarm_vd_theme_24`

## Build
- GitHub Actions `Build APK` (gradle assembleDebug + upload artifact `apk`)
- Remote: `github.com/opassoca/geminigo`
- Sem `gradlew` commitado — CI usa `gradle/actions/setup-gradle@v4`

## Pendências que MATAM o trabalho
1. **Cobrir todas as funções do app oficial** — não decorativas
2. **Paleta/dimens reais** — não inventadas
3. **Ícones reais** em todas posições (account = `account_circle`, não `edit`)
4. **Decision: Stay WebView aprimorado OU migrar pra Compose**
