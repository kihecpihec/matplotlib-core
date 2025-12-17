#!/usr/bin/env python3
"""
Convert a .ipynb notebook into the JSON shape accepted by:
  PUT /api/docs/pages/:id

Usage:
  python backend/scripts/ipynb_to_docs_json.py /path/to/notebook.ipynb \\
    --title "My Title" \\
    --breadcrumb "Documentation" "Templates" "Template 02" "Notebook"
"""

from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict, List


def _is_nonempty_str(s: Any) -> bool:
    return isinstance(s, str) and s.strip() != ""


def markdown_to_blocks(md: str) -> List[Dict[str, Any]]:
    """
    Very small markdown-ish splitter:
    - Lines starting with '# ' or '## ' become h2
    - Runs of '- ' become ul
    - Everything else becomes p
    """
    blocks: List[Dict[str, Any]] = []
    lines = md.splitlines()
    buf: List[str] = []
    ul: List[str] = []

    def flush_p():
        nonlocal buf
        txt = "\n".join(buf).strip()
        if txt:
            blocks.append({"type": "p", "text": txt})
        buf = []

    def flush_ul():
        nonlocal ul
        items = [x.strip() for x in ul if x.strip()]
        if items:
            blocks.append({"type": "ul", "items": items})
        ul = []

    for raw in lines:
        line = raw.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("#"):
            flush_ul()
            flush_p()
            header = stripped.lstrip("#").strip()
            if header:
                blocks.append({"type": "h2", "text": header})
            continue

        if stripped.startswith("- "):
            flush_p()
            ul.append(stripped[2:])
            continue

        if stripped == "":
            flush_ul()
            flush_p()
            continue

        flush_ul()
        buf.append(line)

    flush_ul()
    flush_p()
    return blocks


def convert_ipynb(path: str) -> Dict[str, Any]:
    nb = json.load(open(path, "r", encoding="utf-8"))
    cells = nb.get("cells", [])

    blocks: List[Dict[str, Any]] = []
    for cell in cells:
        ctype = cell.get("cell_type")
        src = "".join(cell.get("source", []))

        if ctype == "markdown":
            if _is_nonempty_str(src):
                blocks.extend(markdown_to_blocks(src))
            continue

        if ctype == "code":
            if _is_nonempty_str(src):
                blocks.append({"type": "code", "language": "python", "code": src})

            # Optionally include text outputs (kept minimal / safe)
            for out in cell.get("outputs", []) or []:
                if out.get("output_type") == "stream" and _is_nonempty_str(out.get("text")):
                    blocks.append(
                        {
                            "type": "code",
                            "language": "text",
                            "code": "".join(out.get("text", []))
                            if isinstance(out.get("text"), list)
                            else out.get("text"),
                        }
                    )
            continue

    name = os.path.basename(path)
    title = f"Notebook: {name}"

    return {
        "title": title,
        "breadcrumb": ["Documentation", "Notebook"],
        "blocks": blocks,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("ipynb_path")
    ap.add_argument("--title", default=None)
    ap.add_argument("--breadcrumb", nargs="*", default=None)
    args = ap.parse_args()

    doc = convert_ipynb(args.ipynb_path)
    if args.title:
        doc["title"] = args.title
    if args.breadcrumb and len(args.breadcrumb) > 0:
        doc["breadcrumb"] = args.breadcrumb

    print(json.dumps(doc, ensure_ascii=False))


if __name__ == "__main__":
    main()


