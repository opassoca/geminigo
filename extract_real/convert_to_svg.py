#!/usr/bin/env python3
"""Converte VectorDrawable XML do APK do Gemini para SVG real no assets/icons/."""
import os, re, sys

SRC = os.path.expanduser("~/geminigo/extract_real/drawables")
DST = os.path.expanduser("~/geminigo/app/src/main/assets/icons")
os.makedirs(DST, exist_ok=True)

# mapa nome_canonico -> substring_busca_no_nome_quantum_gm
MAP = {
    "add":              "ic_add_vd_theme_24",          # "+" simples (nao add_to_home)
    "auto_awesome":     "ic_auto_awesome_vd_theme_24",
    "account_circle":   "ic_account_circle_vd_theme_24",
    "settings":         "ic_settings_vd_theme_24",
    "help_outline":     "ic_help_outline_vd_theme_24",
    "more_vert":        "ic_more_vert_vd_theme_24",
    "menu":             "ic_menu_vd_theme_24",
    "chevron_right":    "ic_chevron_right_vd_theme_24",
    "mic":              "ic_mic_none_vd_theme_24",
    "send":             "ic_send_vd_theme_24",
    "plus":             "ic_add_vd_theme_24",          # "+" do pill
    "camera":           "ic_camera_alt_vd_theme_24",
    "alarm":            "ic_alarm_vd_theme_24",
    "android_messages": "ic_android_messages_vd_theme_24",
    "sparkle":          "ic_auto_awesome_vd_theme_24",  # logo = auto_awesome
    "edit":             "ic_edit_vd_theme_24",
}

def parse_vector(xml_text):
    """Extrai viewportWidth/Height e lista de (fillColor, pathData) de um <vector>."""
    vw = re.search(r'android:viewportWidth="([\d.]+)"', xml_text)
    vh = re.search(r'android:viewportHeight="([\d.]+)"', xml_text)
    if not vw or not vh:
        return None
    paths = re.findall(r'android:(?:fillColor|strokeColor)="([^"]+)"\s+android:pathData="([^"]+)"', xml_text)
    if not paths:
        paths = re.findall(r'android:pathData="([^"]+)"\s+android:(?:fillColor|strokeColor)="([^"]+)"', xml_text)
        paths = [(c, d) for d, c in paths]
    return float(vw.group(1)), float(vh.group(1)), paths

def to_svg(viewport, paths):
    w, h = viewport
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="24" height="24">']
    for fill, d in paths:
        # tint android:white no original; usamos currentColor pra herdar do CSS
        if fill.startswith("#") or fill.startswith("@"):
            fc = "currentColor"
        else:
            fc = "currentColor"
        out.append(f'<path fill="{fc}" d="{d}"/>')
    out.append('</svg>')
    return "\n".join(out)

missing = []
for canon, needle in MAP.items():
    found = None
    for fn in os.listdir(SRC):
        if needle in fn:
            found = os.path.join(SRC, fn); break
    if not found:
        missing.append((canon, needle)); continue
    xml = open(found, encoding="utf-8").read()
    parsed = parse_vector(xml)
    if not parsed:
        missing.append((canon, "parse_fail")); continue
    vw, vh, pths = parsed
    if not pths:
        missing.append((canon, "no_paths")); continue
    svg = to_svg((vw, vh), pths)
    out_path = os.path.join(DST, canon + ".svg")
    open(out_path, "w", encoding="utf-8").write(svg)
    print(f"[OK] {canon}.svg <- {os.path.basename(found)}")

print("\n=== FALTAS ===")
if missing:
    for m in missing: print("  FALTA:", m)
else:
    print("  nenhuma")
