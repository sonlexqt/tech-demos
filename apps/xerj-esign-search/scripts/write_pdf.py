"""Minimal PDF 1.4 writer (stdlib only). Text is extractable for XERJ / pdftotext."""

from __future__ import annotations

from pathlib import Path


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_pdf(path: Path, pages: list[list[str]], title: str) -> None:
    """Write a multi-page Helvetica PDF. Each page is a list of lines."""
    path.parent.mkdir(parents=True, exist_ok=True)
    objects: list[bytes] = []

    def add(payload: str) -> int:
        objects.append(payload.encode("latin-1", "replace"))
        return len(objects)

    add("<< /Type /Catalog /Pages 2 0 R >>")
    page_ids: list[int] = []
    content_ids: list[int] = []

    # Reserve slots: 1 catalog, 2 pages tree, then 2 objects per page, then font, then info
    # We build contents first, then patch the tree. Easier: collect streams, then emit all.
    page_streams: list[str] = []
    for lines in pages:
        cmds = ["BT", "/F1 10 Tf", "14 TL", "48 744 Td"]
        for i, line in enumerate(lines):
            if i:
                cmds.append("T*")
            cmds.append(f"({_escape(line[:110])}) Tj")
        cmds.append("ET")
        page_streams.append("\n".join(cmds) + "\n")

    n_pages = len(page_streams)
    # Object numbers:
    # 1 Catalog
    # 2 Pages
    # 3 Font
    # 4 Info
    # then for each page: page obj, content obj
    font_id = 3
    info_id = 4
    first_page_id = 5

    objects = []
    add("<< /Type /Catalog /Pages 2 0 R >>")  # 1

    kids = " ".join(f"{first_page_id + i * 2} 0 R" for i in range(n_pages))
    add(f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>")  # 2
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")  # 3
    add(f"<< /Title ({_escape(title)}) /Producer (xerj-esign-search fixture) >>")  # 4

    for i, stream in enumerate(page_streams):
        page_id = first_page_id + i * 2
        content_id = page_id + 1
        # page object (we add in order so ids match)
        add(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_id} 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> >>"
        )
        add(f"<< /Length {len(stream.encode('latin-1', 'replace'))} >>\nstream\n{stream}endstream")

    # Assemble xref
    header = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    body = b""
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(header) + len(body))
        body += f"{i} 0 obj\n".encode("ascii") + obj + b"\nendobj\n"

    xref_pos = len(header) + len(body)
    xref = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n"
    trailer = (
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R /Info {info_id} 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n"
    )
    path.write_bytes(header + body + xref.encode("ascii") + trailer.encode("ascii"))
