"""
Build HD CampusCare launcher icons from assets/App Icon (1).png.

Source already has the correct mark (incl. overlap), fill #2970FF, and light
frame. We upscale to 1024 and produce adaptive FG/BG without a baked mask.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "App Icon (1).png"
BRAND = (41, 112, 255, 255)  # #2970FF
SIZE = 1024


def load_source() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    return Image.open(SOURCE).convert("RGBA")


def square_on_brand(src: Image.Image, size: int = SIZE) -> Image.Image:
    """Full-bleed square: brand fill + upscaled source (covers transparent corners)."""
    canvas = Image.new("RGBA", (size, size), BRAND)
    # Fit source into square preserving aspect (pad with brand)
    sw, sh = src.size
    scale = size / max(sw, sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    scaled = src.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (size - nw) // 2, (size - nh) // 2
    canvas.alpha_composite(scaled, (ox, oy))
    return canvas


def extract_mark(src: Image.Image) -> Image.Image:
    """Pale mark pixels (off-white / lavender) → RGBA crop."""
    w, h = src.size
    px = src.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 180:
                continue
            # Mark: very light blues/whites (not brand blue, not border)
            if r >= 190 and g >= 200 and b >= 230 and (r + g + b) >= 650:
                op[x, y] = (r, g, b, a)
    bbox = out.getbbox()
    if not bbox:
        raise RuntimeError("Could not extract mark from App Icon source")
    return out.crop(bbox)


def place_mark(
    canvas: Image.Image,
    mark: Image.Image,
    fill_ratio: float,
) -> None:
    size = canvas.size[0]
    target = int(size * fill_ratio)
    scale = target / max(mark.size)
    nw = max(1, int(mark.size[0] * scale))
    nh = max(1, int(mark.size[1] * scale))
    scaled = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    # Light soften then keep alpha for cleaner HD edges from ~500px source
    soft = scaled.filter(ImageFilter.GaussianBlur(radius=0.35))
    # Prefer original scaled for sharpness; blur only tiny jaggies via composite
    use = Image.alpha_composite(Image.new("RGBA", soft.size, (0, 0, 0, 0)), scaled)
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.alpha_composite(use, (ox, oy))


def make_foreground(mark: Image.Image, fill_ratio: float = 0.62) -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    place_mark(canvas, mark, fill_ratio)
    return canvas


def make_monochrome(mark: Image.Image, fill_ratio: float = 0.62) -> Image.Image:
    fg = make_foreground(mark, fill_ratio)
    # Solid black silhouette from alpha
    w, h = fg.size
    px = fg.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            _, _, _, a = px[x, y]
            if a > 20:
                op[x, y] = (0, 0, 0, a)
    return out


def main() -> None:
    src = load_source()
    print("source", src.size)

    # Canonical copy without spaces in the name
    clean = ASSETS / "app-icon-source.png"
    src.save(clean)
    print("wrote", clean.name)

    launcher = square_on_brand(src)
    launcher.save(ASSETS / "icon.png")
    (ASSETS / "images").mkdir(exist_ok=True)
    launcher.save(ASSETS / "images" / "icon.png")
    print("wrote icon.png")

    Image.new("RGBA", (SIZE, SIZE), BRAND).save(ASSETS / "android-icon-background.png")
    print("wrote android-icon-background.png")

    mark = extract_mark(src)
    print("mark", mark.size)
    # Slightly larger than prior set so home-screen mark reads clearly
    fg = make_foreground(mark, fill_ratio=0.64)
    fg.save(ASSETS / "android-icon-foreground.png")
    print("wrote android-icon-foreground.png", fg.getbbox())

    adaptive = Image.new("RGBA", (SIZE, SIZE), BRAND)
    adaptive.alpha_composite(fg)
    adaptive.save(ASSETS / "adaptive-icon.png")
    print("wrote adaptive-icon.png")

    mono = make_monochrome(mark, fill_ratio=0.64)
    mono.save(ASSETS / "android-icon-monochrome.png")
    print("wrote android-icon-monochrome.png")

    launcher.resize((48, 48), Image.Resampling.LANCZOS).save(ASSETS / "favicon.png")
    launcher.resize((192, 192), Image.Resampling.LANCZOS).save(ASSETS / "favicon-192.png")
    print("wrote favicon.png / favicon-192.png")

    bb = fg.getbbox()
    if bb:
        print(
            "fg fill",
            round((bb[2] - bb[0]) / SIZE, 3),
            "x",
            round((bb[3] - bb[1]) / SIZE, 3),
        )


if __name__ == "__main__":
    main()
