from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
for lang in ("render_ar2", "render_en2"):
    pages = sorted((ROOT / lang).glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
    out_dir = ROOT / f"contact_{lang}"
    out_dir.mkdir(exist_ok=True)
    for start in range(0, len(pages), 5):
        batch = pages[start:start+5]
        thumbs=[]
        for p in batch:
            im=Image.open(p).convert("RGB")
            im.thumbnail((640, 830))
            thumbs.append((p,im))
        sheet=Image.new("RGB",(640*len(thumbs),880),(245,247,250))
        draw=ImageDraw.Draw(sheet)
        for i,(p,im) in enumerate(thumbs):
            x=i*640
            sheet.paste(im,(x,40))
            draw.text((x+10,10),p.name,fill=(20,30,40))
        sheet.save(out_dir / f"pages-{start+1:02d}-{start+len(batch):02d}.png")
