#!/usr/bin/env python3
"""
Generate a simple PDF from assets/whitepaper.html using ReportLab.
Creates assets/SNOZCOIN_whitepaper.pdf
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'assets' / 'whitepaper.html'
OUT = ROOT / 'assets' / 'SNOZCOIN_whitepaper.pdf'
LOGO = ROOT / 'assets' / 'SNOZCOIN.png'

if not HTML.exists():
    raise SystemExit(f"Missing {HTML}")

html = HTML.read_text(encoding='utf-8')

# Basic HTML -> text: remove scripts/styles and all tags, preserve headings with line breaks
html = re.sub(r'(?is)<(script|style).*?>.*?</\\1>', '', html)
text = re.sub(r'(?is)<br */?>', '\n', html)
text = re.sub(r'(?is)</h[1-6]>', '\n\n', text)
text = re.sub(r'(?is)<li>', '• ', text)
text = re.sub(r'(?is)</li>', '\n', text)
text = re.sub(r'(?is)<[^>]+>', '', text)
text = re.sub(r'\n\s+\n', '\n\n', text)
text = text.strip()

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate,
                                    Paragraph, Spacer, Image, Flowable)
except Exception:
    raise SystemExit('reportlab not installed: run "python3 -m pip install reportlab"')


PAGE_WIDTH, PAGE_HEIGHT = letter

def header_footer(canvas, doc):
    # Small header with logo (left) and title/tagline (right)
    canvas.saveState()
    # ensure white page background (ReportLab default) — don't draw dark backgrounds
    # logo (small)
    if LOGO.exists():
        try:
            # smaller header logo
            canvas.drawImage(str(LOGO), 36, PAGE_HEIGHT - 46, width=28, height=14, mask='auto')
        except Exception:
            pass
    # Title + tagline on header (small, black)
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica-Bold', 11)
    canvas.drawRightString(PAGE_WIDTH - 36, PAGE_HEIGHT - 36, 'SNOZCOIN ($SNOZ)')
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#333333'))
    canvas.drawRightString(PAGE_WIDTH - 36, PAGE_HEIGHT - 48, 'Community-first • Transparent • Built for holders')

    # Footer: small logo left, title center (or page number), small tagline right
    if LOGO.exists():
        try:
            # smaller footer logo
            canvas.drawImage(str(LOGO), 36, 30, width=20, height=12, mask='auto')
        except Exception:
            pass
    canvas.setFillColor(colors.HexColor('#333333'))
    canvas.setFont('Helvetica', 8)
    page_num = f"Page {doc.page}"
    canvas.drawCentredString(PAGE_WIDTH / 2.0, 18, page_num)
    canvas.drawRightString(PAGE_WIDTH - 36, 18, 'SNOZCOIN — Community-first')
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Heading', fontSize=14, leading=18, spaceAfter=8, spaceBefore=6))
styles.add(ParagraphStyle(name='Body', fontSize=11, leading=14))

doc = BaseDocTemplate(str(OUT), pagesize=letter,
                      rightMargin=72, leftMargin=72, topMargin=72 + 36, bottomMargin=72 + 24)

# Frames for cover and content
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
cover_frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='cover')

def cover_canvas(canvas, doc):
    # Full-bleed dark cover with centered logo and title
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#070707'))
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    # gold accent bar
    canvas.setFillColor(colors.HexColor('#c59a2f'))
    canvas.rect(0, PAGE_HEIGHT - 80, PAGE_WIDTH, 80, fill=1, stroke=0)
    # logo center
    if LOGO.exists():
        try:
            iw = 220
            ih = 220
            x = (PAGE_WIDTH - iw) / 2.0
            y = PAGE_HEIGHT - 320
            canvas.drawImage(str(LOGO), x, y, width=iw, height=ih, mask='auto')
        except Exception:
            pass
    # Title
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 28)
    canvas.drawCentredString(PAGE_WIDTH / 2.0, PAGE_HEIGHT - 380, 'SNOZCOIN ($SNOZ)')
    canvas.setFont('Helvetica', 14)
    canvas.setFillColor(colors.HexColor('#f4e7c9'))
    canvas.drawCentredString(PAGE_WIDTH / 2.0, PAGE_HEIGHT - 405, 'Community-first • Transparent • Built for holders')
    canvas.restoreState()

# Page template: content pages use header_footer
doc.addPageTemplates([
    PageTemplate(id='Content', frames=frame, onPage=header_footer),
])

elems = []

# Create a sensible split by double newlines
for block in text.split('\n\n'):
    blk = block.strip()
    if not blk:
        continue
    # treat short lines as headings
    is_heading = (len(blk) < 120 and (blk.endswith(':') or blk.isupper() or blk.startswith('SNOZCOIN') or (len(blk.split())<=6)))
    if is_heading:
        elems.append(Paragraph(blk, styles['Heading']))
    else:
        safe = blk.replace('&', '&amp;')
        elems.append(Paragraph(safe.replace('\n','<br/>'), styles['Body']))
    elems.append(Spacer(1, 8))

content = elems


# Roadmap visualization as a Flowable
class RoadmapFlowable(Flowable):
    def __init__(self, phases):
        Flowable.__init__(self)
        self.phases = phases
        self.width = doc.width
        self.height = 180
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)
    def draw(self):
        c = self.canv
        x = 0
        y = self.height - 12
        ph_w = self.width
        bar_h = 14
        icon_r = 10
        gap = 12
        c.saveState()
        for i, (title, pct, desc) in enumerate(self.phases):
            yy = y - i * (bar_h + 56)
            # icon (circle) on the left
            icon_cx = x + icon_r + 6
            icon_cy = yy + 10
            c.setFillColor(colors.HexColor('#ffd36b'))
            c.circle(icon_cx, icon_cy, icon_r, stroke=0, fill=1)
            c.setFillColor(colors.white)
            c.setFont('Helvetica-Bold', 9)
            c.drawCentredString(icon_cx, icon_cy - 3, str(i+1))

            # text to the right of icon
            text_x = icon_cx + icon_r + 8
            c.setFont('Helvetica-Bold', 11)
            c.setFillColor(colors.black)
            c.drawString(text_x, yy + 16, title)
            c.setFont('Helvetica', 9)
            c.setFillColor(colors.HexColor('#555555'))
            c.drawString(text_x, yy + 2, desc)

            # progress bar below the text
            bx = text_x
            by = yy - 10
            bw = ph_w - (bx)
            c.setFillColor(colors.HexColor('#e9e9e9'))
            c.roundRect(bx, by, bw, bar_h, 6, fill=1, stroke=0)
            fill_w = bw * (pct / 100.0)
            c.setFillColor(colors.HexColor('#c59a2f'))
            c.roundRect(bx, by, fill_w, bar_h, 6, fill=1, stroke=0)
            # percent text
            c.setFillColor(colors.black)
            c.setFont('Helvetica-Bold', 9)
            c.drawRightString(bx + bw, by + 2, f"{pct}%")
        c.restoreState()


# Insert roadmap after the initial sections; append the roadmap flowable at the end
phases = [
    ('Phase 1 — Foundation', 60, 'Community setup, contract deployment, listings.'),
    ('Phase 2 — Growth', 25, 'Community programs, partnerships, audits.'),
    ('Phase 3 — Maturity', 0, 'Governance tools, sustainability, expansion.'),
]
content.append(Spacer(1, 12))
content.append(Paragraph('Roadmap — Progress overview', styles['Heading']))
content.append(Spacer(1, 6))
content.append(RoadmapFlowable(phases))

doc.build(content)
print(f'Wrote {OUT}')
