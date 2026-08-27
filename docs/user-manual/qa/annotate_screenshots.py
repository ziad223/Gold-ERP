from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "screenshots"

def font(size):
    candidates = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()

def annotate(path: Path, out: Path, rtl: bool):
    image = Image.open(path).convert("RGBA")
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    f = font(max(22, min(34, w // 42)))
    small = font(max(14, min(20, w // 70)))
    if w < 650:
        points = [(34, 34), (w // 2, 42), (w // 2, min(h - 55, 260))]
    else:
        points = [((w - 54) if rtl else 54, 128), (w // 2, 42), (w // 2, 270)]
    colors = [(20, 184, 166, 240), (245, 158, 11, 240), (59, 130, 246, 240)]
    for i, ((x, y), color) in enumerate(zip(points, colors), 1):
        r = 22 if w < 650 else 26
        draw.ellipse((x-r, y-r, x+r, y+r), fill=color, outline=(255,255,255,255), width=3)
        label = str(i)
        box = draw.textbbox((0, 0), label, font=f)
        tw, th = box[2]-box[0], box[3]-box[1]
        draw.text((x-tw/2, y-th/2-box[1]), label, fill=(255,255,255,255), font=f)
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, "PNG")

def main():
    for language in ("ar", "en"):
        source_dir = ROOT / language
        output_dir = source_dir / "annotated"
        for source in sorted(source_dir.glob("*.png")):
            annotate(source, output_dir / source.name, rtl=language == "ar")

if __name__ == "__main__":
    main()
