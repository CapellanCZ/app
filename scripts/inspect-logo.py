from PIL import Image

im = Image.open("assets/Logo.png").convert("RGBA")
px = im.load()
w, h = im.size
transparent = white = opaque_black = other = 0
samples = []
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            transparent += 1
        elif r > 230 and g > 230 and b > 230:
            white += 1
        elif r < 25 and g < 25 and b < 25:
            opaque_black += 1
        else:
            other += 1
            if len(samples) < 8:
                samples.append((x, y, r, g, b, a))
print("size", w, h)
print("transparent", transparent, "white", white, "opaque_black", opaque_black, "other", other)
print("samples", samples)
print("bbox", im.getbbox())
bb = im.getbbox()
if bb:
    print("content", bb[2] - bb[0], "x", bb[3] - bb[1])
