"""Generate CampusCare launcher / adaptive icons from the existing logo mark."""

from __future__ import annotations

from PIL import Image, ImageDraw

BRAND = (0, 78, 235, 255)  # #004EEB
BORDER = (163, 193, 255, 255)


def extract_logo_mask(src_path: str) -> Image.Image:
    src = Image.open(src_path).convert("RGBA")
    w, h = src.size
    pixels = src.load()
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Dark navy logo on white/grid — ignore light grid lines.
            if a > 200 and r < 80 and g < 100 and 60 < b < 180 and (r + g + b) < 220:
                mp[x, y] = 255
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError(f"Could not extract logo from {src_path}")
    return mask.crop(bbox)


def tinted_logo(mask: Image.Image, color: tuple[int, int, int, int], size: tuple[int, int]) -> Image.Image:
    scaled = mask.resize(size, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    sp = scaled.load()
    op = out.load()
    cr, cg, cb, _ = color
    for y in range(size[1]):
        for x in range(size[0]):
            a = sp[x, y]
            if a > 20:
                op[x, y] = (cr, cg, cb, a)
    return out


def place_logo(
    canvas: Image.Image,
    mask: Image.Image,
    color: tuple[int, int, int, int],
    fill_ratio: float,
) -> None:
    size = canvas.size[0]
    target = int(size * fill_ratio)
    scale = target / max(mask.size)
    nw = max(1, int(mask.size[0] * scale))
    nh = max(1, int(mask.size[1] * scale))
    logo = tinted_logo(mask, color, (nw, nh))
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.alpha_composite(logo, (ox, oy))


def make_icon(mask: Image.Image, size: int = 1024, fill_ratio: float = 0.56) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BRAND)
    place_logo(canvas, mask, (255, 255, 255, 255), fill_ratio)
    return canvas


def make_foreground(mask: Image.Image, size: int = 1024, fill_ratio: float = 0.60) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    place_logo(canvas, mask, (255, 255, 255, 255), fill_ratio)
    return canvas


def make_monochrome(mask: Image.Image, size: int = 1024, fill_ratio: float = 0.60) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    place_logo(canvas, mask, (0, 0, 0, 255), fill_ratio)
    return canvas


def main() -> None:
    mask = extract_logo_mask("assets/icon.png")
    print("logo mask", mask.size)

    icon = make_icon(mask, 1024, 0.56)
    icon.save("assets/icon.png")
    icon.save("assets/images/icon.png")
    print("saved assets/icon.png")

    Image.new("RGBA", (1024, 1024), BRAND).save("assets/android-icon-background.png")
    print("saved assets/android-icon-background.png")

    fg = make_foreground(mask, 1024, 0.60)
    fg.save("assets/android-icon-foreground.png")
    print("saved assets/android-icon-foreground.png", fg.getbbox())

    adaptive = Image.new("RGBA", (1024, 1024), BRAND)
    adaptive.alpha_composite(fg)
    adaptive.save("assets/adaptive-icon.png")
    print("saved assets/adaptive-icon.png")

    mono = make_monochrome(mask, 1024, 0.60)
    mono.save("assets/android-icon-monochrome.png")
    print("saved assets/android-icon-monochrome.png", mono.getbbox())

    make_icon(mask, 48, 0.62).save("assets/favicon.png")
    print("saved assets/favicon.png")

    for path in (
        "assets/icon.png",
        "assets/android-icon-foreground.png",
        "assets/android-icon-background.png",
    ):
        im = Image.open(path).convert("RGBA")
        bb = im.getbbox()
        ratio = round((bb[2] - bb[0]) / im.size[0], 3) if bb else None
        print(path, im.size, "content_ratio", ratio)


if __name__ == "__main__":
    main()
