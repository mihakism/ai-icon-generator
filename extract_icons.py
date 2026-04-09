#!/usr/bin/env python3
"""
Extract individual icon SVGs from G SaaS UI icon sprite sheets.
Organizes icons into category folders based on OCR analysis.
"""

import os
import re
import xml.etree.ElementTree as ET

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)

# ── Category / Icon data from OCR ──────────────────────────────────────────

CATEGORIES = [
    {
        "dir": "01_Service",
        "rows": [
            ["home", "message", "mail", "calendar", "contact", "drive",
             "to-do", "board", "survey", "approval"],
            ["reservation", "my work"],
        ],
    },
    {
        "dir": "02_Common",
        "rows": [
            ["member", "members", "setting", "globe", "search", "delete",
             "link", "like", "favorite", "pin"],
            ["attach", "edit", "file", "folder", "note", "bookmark",
             "write", "copy", "sticker", "block"],
            ["refresh", "reload", "history", "align", "filter", "reply left",
             "lock", "security", "light mode", "dark mode"],
            ["check", "add", "close", "question", "menu", "apps",
             "list", "more_vert", "more hori", "info"],
            ["help", "conflict", "check circle", "close circle", "add circle",
             "more circle", "download", "upload", "log out", "new window"],
            ["share", "fileviewer", "admin", "pc", "print", "keypad",
             "checkbox", "scan", "approve", "template"],
            ["add template", "add folder", "move to folder", "add member",
             "add members", "search member", "check member",
             "external", "organization", "office"],
        ],
    },
    {
        "dir": "03_AI",
        "rows": [
            ["improve text", "edit length", "ai edit", "ai recommend",
             "ai shorten", "ai translate", "style"],
        ],
    },
    {
        "dir": "04_Communication",
        "rows": [
            ["mail", "mail open", "inbox", "send", "call", "comment",
             "reply right"],
        ],
    },
    {
        "dir": "05_Media",
        "rows": [
            ["video", "video off", "image", "camera", "sound on", "sound off",
             "voice", "voice off", "play", "pause"],
            ["stop", "show", "hide", "zoom in", "zoom out", "crop",
             "edit video"],
        ],
    },
    {
        "dir": "06_Arrow",
        "rows": [
            ["chevron up", "chevron down", "chevron left", "chevron right",
             "up", "down", "left", "right", "undo", "redo"],
            ["arrow drop up", "arrow drop down"],
        ],
    },
    {
        "dir": "07_Alert",
        "rows": [
            ["notification", "notification off", "notification setting",
             "notification all", "message notification", "time", "new"],
        ],
    },
]

# Columns: x start positions (10 per row, spaced 130 px, box width 120 px)
COL_X = [80 + i * 130 for i in range(10)]   # [80, 210, 340, ..., 1250]
BOX_SIZE = 120   # 120 x 120 px boxes

# Build a flat mapping: (row_y, col_x) -> (category_dir, icon_name)
def build_icon_map():
    icon_map = {}
    # Icon row y positions in order (matches CATEGORIES row lists)
    row_y_seq = [
        # Cat 1
        330, 460,
        # Cat 2
        750, 880, 1020, 1150, 1280, 1420, 1550,
        # Cat 3
        1840,
        # Cat 4
        2120,
        # Cat 5
        2410, 2540,
        # Cat 6
        2830, 2970,
        # Cat 7
        3250,
    ]
    row_idx = 0
    for cat in CATEGORIES:
        for row_icons in cat["rows"]:
            y = row_y_seq[row_idx]
            row_idx += 1
            for col, name in enumerate(row_icons):
                x = COL_X[col]
                icon_map[(y, x)] = (cat["dir"], name)
    return icon_map


# ── SVG parsing helpers ─────────────────────────────────────────────────────

def el_tag(el):
    return el.tag.split('}')[-1] if '}' in el.tag else el.tag


def get_first_coord(el):
    """Return (x, y) of the first coordinate point in an element."""
    tag = el_tag(el)
    if tag == 'path':
        m = re.match(r'M\s*([\d.+-]+)\s+([\d.+-]+)', el.get('d', ''))
        if m:
            return float(m.group(1)), float(m.group(2))
    elif tag in ('circle', 'ellipse'):
        cx, cy = el.get('cx'), el.get('cy')
        if cx and cy:
            return float(cx), float(cy)
    elif tag == 'rect':
        return float(el.get('x', 0)), float(el.get('y', 0))
    elif tag == 'line':
        return float(el.get('x1', 0)), float(el.get('y1', 0))
    return None, None


def coord_to_box(x, y, tol=10):
    """
    Find which icon box (row_y, col_x) contains coordinate (x, y).
    Returns (row_y, col_x) or None if not in any box.
    """
    for col_x in COL_X:
        if col_x - tol <= x <= col_x + BOX_SIZE + tol:
            # Possible column — now check row
            # Row y positions span across all categories
            for row_y in range(330, 3444, 1):
                if row_y - tol <= y <= row_y + BOX_SIZE + tol:
                    return (row_y, col_x)
    return None


def snap_to_known_row(y, known_rows, tol=20):
    """Snap a y coordinate to the nearest known row start."""
    for ry in known_rows:
        if abs(y - ry) <= tol or abs(y - (ry + BOX_SIZE)) <= tol:
            return ry
        if ry <= y <= ry + BOX_SIZE + tol:
            return ry
    return None


# ── Main extraction ─────────────────────────────────────────────────────────

def extract_icons(src_svg_path, out_base_dir, variant_name):
    """
    Parse src_svg_path, extract individual icons, and write them under
    out_base_dir / variant_name / category_dir / icon_name.svg
    """
    print(f"\nExtracting: {os.path.basename(src_svg_path)} → {variant_name}/")

    tree = ET.parse(src_svg_path)
    root = tree.getroot()

    icon_map = build_icon_map()

    # Collect all known row y values
    known_rows = sorted(set(ry for (ry, _) in icon_map.keys()))

    # ── Collect defs (clip paths, markers, etc.) ──────────────────────────
    defs_elements = {}   # id -> element
    for el in root:
        if el_tag(el) == 'defs':
            for child in el:
                cid = child.get('id')
                if cid:
                    defs_elements[cid] = child

    # ── Bucket each element into its icon box ─────────────────────────────
    icon_elements = {key: [] for key in icon_map}

    for el in root:
        tag = el_tag(el)
        if tag in ('rect', 'defs') and el.get('fill') in ('white', '#F5F5F6', None):
            # Background rect or defs — skip
            if tag == 'defs' or el.get('fill') in ('white',):
                continue

        fill = el.get('fill', '')
        stroke = el.get('stroke', '')

        # Skip containers (gray box) and label text
        if fill == '#F5F5F6':
            continue
        if fill == '#989898':
            continue

        x, y = get_first_coord(el)
        if x is None:
            continue

        # Find which row this belongs to
        row_y = snap_to_known_row(y, known_rows)
        if row_y is None:
            continue

        # Find which column
        col_x = None
        for cx in COL_X:
            if cx - 5 <= x <= cx + BOX_SIZE + 5:
                col_x = cx
                break
        if col_x is None:
            continue

        key = (row_y, col_x)
        if key not in icon_map:
            continue

        icon_elements[key].append(el)

    # ── Write individual SVG files ────────────────────────────────────────
    written = 0
    skipped = 0

    for (row_y, col_x), (cat_dir, icon_name) in icon_map.items():
        elements = icon_elements.get((row_y, col_x), [])
        if not elements:
            skipped += 1
            continue

        # Create output directory
        out_dir = os.path.join(out_base_dir, variant_name, cat_dir)
        os.makedirs(out_dir, exist_ok=True)

        # Sanitize filename
        safe_name = re.sub(r'[^\w\s-]', '', icon_name).strip()
        safe_name = re.sub(r'[\s]+', '_', safe_name)
        out_path = os.path.join(out_dir, f"{safe_name}.svg")

        # Collect referenced clip-path IDs
        needed_defs = {}
        for el in elements:
            cp = el.get('clip-path', '')
            if cp:
                m = re.search(r'url\(#([^)]+)\)', cp)
                if m and m.group(1) in defs_elements:
                    needed_defs[m.group(1)] = defs_elements[m.group(1)]

        # Build output SVG
        # Box y starts 10px above row_y (rounded corner offset)
        box_y = row_y - 10
        svg_el = ET.Element('svg')
        svg_el.set('width', '24')
        svg_el.set('height', '24')
        svg_el.set('viewBox', f'0 0 {BOX_SIZE} {BOX_SIZE}')
        svg_el.set('fill', 'none')

        if needed_defs:
            defs_el = ET.SubElement(svg_el, 'defs')
            for def_el in needed_defs.values():
                defs_el.append(def_el)

        # Wrap elements in a group with a translate to normalize coordinates to 0,0
        g_el = ET.SubElement(svg_el, 'g')
        g_el.set('transform', f'translate(-{col_x}, -{box_y})')
        for el in elements:
            g_el.append(el)

        out_tree = ET.ElementTree(svg_el)
        ET.indent(out_tree, space='  ')
        # Write with proper namespace
        ET.register_namespace('', SVG_NS)
        with open(out_path, 'w', encoding='utf-8') as fout:
            fout.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            out_tree.write(fout, xml_declaration=False, encoding='unicode')
        written += 1

    print(f"  Written: {written}, Skipped (empty): {skipped}")
    return written


# ── Entry point ─────────────────────────────────────────────────────────────

def main():
    downloads = os.path.expanduser(
        '~/Downloads/[WORKS] 프로덕트 가이드(Icon&Color)'
    )
    out_base = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'icons'
    )

    files = {
        'lined': os.path.join(downloads, 'v250826_G SaaS UI icon_lined.svg'),
        'filled': os.path.join(downloads, 'v250826_G SaaS UI icon_filled.svg'),
    }

    for variant, path in files.items():
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
        extract_icons(path, out_base, variant)

    # Print summary
    print("\n── Output structure ──────────────────────────────────────────")
    for variant in files:
        variant_dir = os.path.join(out_base, variant)
        if not os.path.isdir(variant_dir):
            continue
        total = 0
        for cat in sorted(os.listdir(variant_dir)):
            cat_path = os.path.join(variant_dir, cat)
            if os.path.isdir(cat_path):
                n = len([f for f in os.listdir(cat_path) if f.endswith('.svg')])
                total += n
                print(f"  {variant}/{cat}: {n} icons")
        print(f"  {variant}: {total} total")


if __name__ == '__main__':
    main()
