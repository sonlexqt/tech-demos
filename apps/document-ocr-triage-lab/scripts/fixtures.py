"""Deterministic synthetic fixture generation; ground truth is maintained separately."""
from pathlib import Path
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=Path(__file__).resolve().parent.parent/'fixtures'
lines=['SYNTHETIC / DEMO ONLY', 'NORTHSTAR PAPER CO', 'INVOICE: INV-2048', 'DATE: 2026-10-01', 'CUSTOMER: Cedar Studio', 'Subtotal: 1200.00', 'Tax: 120.00', 'TOTAL: USD 1320.00', 'BATES: DEMO-000042']
c=canvas.Canvas(str(ROOT/'native.pdf'),pagesize=(612,792),invariant=1)
for i,line in enumerate(lines):
 c.setFont('Helvetica',18); c.drawString(55,735-i*60,line)
c.save()
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',36)
im=Image.new('RGB',(1224,1584),'white'); d=ImageDraw.Draw(im)
for i,line in enumerate(lines): d.text((110,85+i*120),line,font=font,fill='black')
for name,img in [('clean',im),('degraded',im.resize((459,594)).resize(im.size).filter(ImageFilter.GaussianBlur(2.2)))]:
 # Mixed fixture: scan body with a crisp native Bates stamp. Mask one value to demonstrate loss.
 if name=='degraded':
  ImageDraw.Draw(img).rectangle((380,910,880,965),fill='white')
 img.save(ROOT/f'{name}.png')
 c=canvas.Canvas(str(ROOT/f'{name}.pdf'),pagesize=(612,792),invariant=1)
 c.drawInlineImage(img,0,0,612,792)
 if name=='degraded': c.setFont('Helvetica',12); c.drawString(55,40,'BATES: DEMO-000042')
 c.save()
