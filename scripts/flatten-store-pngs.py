from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "store" / "screenshots"
BG = (11, 12, 16)  # #0b0c10


def flatten(path: Path) -> None:
    image = Image.open(path)
    if image.mode == "RGBA":
        out = Image.new("RGB", image.size, BG)
        out.paste(image, mask=image.split()[-1])
        out.save(path, "PNG")
        print(f"RGB {path.relative_to(ROOT)} {out.size[0]}x{out.size[1]}")
        return
    if image.mode != "RGB":
        image.convert("RGB").save(path, "PNG")
        print(f"converted {path.relative_to(ROOT)}")
        return
    print(f"ok {path.relative_to(ROOT)} {image.size[0]}x{image.size[1]} {image.mode}")


def main() -> None:
    files = sorted(ROOT.rglob("*.png"))
    if not files:
        raise SystemExit("Nessun PNG in store/screenshots")
    for path in files:
        flatten(path)


if __name__ == "__main__":
    main()
