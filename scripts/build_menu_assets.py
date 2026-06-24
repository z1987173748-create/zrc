from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WORKSPACE = Path(r"C:\Users\z\Documents\微信小程序制作")
SOURCE = Path(r"C:\Users\z\Desktop\菜单.txt")
OUTPUT_DATA = WORKSPACE / "data" / "menu.js"
OUTPUT_ASSET_DIR = WORKSPACE / "assets" / "dishes" / "generated"

CATEGORY_META = {
    "cold": {
        "name": "凉菜轻食",
        "base_price": 18,
        "palette": ("#F6D37F", "#D97B43", "#FFF8EA"),
        "tagline": "清爽开胃，适合先点一份打开胃口。"
    },
    "wok": {
        "name": "鲜香热炒",
        "base_price": 26,
        "palette": ("#F39B5A", "#9A4218", "#FFF3E8"),
        "tagline": "现炒现出，锅气足，适合搭配主食。"
    },
    "soup": {
        "name": "汤羹蒸煮",
        "base_price": 28,
        "palette": ("#F0D8AF", "#B47B47", "#FFFAF3"),
        "tagline": "口感温润，适合想吃清淡一些的时候。"
    },
    "staple": {
        "name": "主食小点",
        "base_price": 22,
        "palette": ("#E9C57A", "#B26531", "#FFF8EE"),
        "tagline": "饱腹感更强，适合一人食或加餐。"
    },
    "chicken": {
        "name": "人气鸡肉",
        "base_price": 29,
        "palette": ("#E7AB54", "#8E4725", "#FFF7EE"),
        "tagline": "鸡肉类高人气单品，口味稳，点单率高。"
    },
    "seafood": {
        "name": "海鲜优选",
        "base_price": 32,
        "palette": ("#86D2CF", "#2E7687", "#F3FFFF"),
        "tagline": "鲜味更突出，适合想吃轻盈海味的人群。"
    },
    "beef": {
        "name": "牛肉能量",
        "base_price": 36,
        "palette": ("#D57F63", "#723221", "#FFF5F2"),
        "tagline": "肉感扎实，适合高满足感点单。"
    },
    "veggie": {
        "name": "蔬菜蛋白",
        "base_price": 24,
        "palette": ("#BFD88B", "#5B7F37", "#FAFFF2"),
        "tagline": "蔬菜和蛋白搭配，口感清新不腻。"
    }
}

NORMALIZE_MAP = {
    "鸡腿门娃娃菜": "鸡腿焖娃娃菜",
    "蒜蓉魷色": "蒜蓉鱿鱼",
    "凉拌菠菜金針菇": "凉拌菠菜金针菇",
    "掉秤芋泥巻": "掉秤芋泥卷",
    "豆皮海帯豆芽": "豆皮海带豆芽",
    "晶晶虾饺": "晶莹虾饺",
    "掉称鸡蛋卷": "掉秤鸡蛋卷",
    "虾仁胡萝卜馄炖": "虾仁胡萝卜馄饨",
    "里脊肉小混沌": "里脊肉小馄饨"
}


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        (r"C:\Windows\Fonts\msyhbd.ttc", bold),
        (r"C:\Windows\Fonts\msyh.ttc", False),
        (r"C:\Windows\Fonts\simhei.ttf", False),
    ]
    for path, preferred in candidates:
        if bold and not preferred:
            continue
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    for path, _ in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def pick_category(name: str) -> str:
    if re.search(r"虾|鱼|鲈|黑鱼|巴沙|海鲜|蟹柳|海苔|虾仁|鱿", name):
        return "seafood"
    if re.search(r"牛肉|肥牛|里脊", name):
        return "beef"
    if re.search(r"鸡腿|鸡胸|鸡丝|手撕鸡|滑鸡|奥尔良|照烧|鸡丁", name):
        return "chicken"
    if re.search(r"汤|蒸|馄饨|混沌|抱蛋", name):
        return "soup"
    if re.search(r"面|卷|饺|寿司|泥|丸|包", name):
        return "staple"
    if re.search(r"凉拌|黄瓜|贡菜|木耳|藕片|山药|菠菜|生菜|豆芽|金针菇|蒜苔|莴笋", name):
        return "cold"
    if re.search(r"蛋|西兰花|西葫芦|平菇|口蘑|香菇|包菜|番茄|荷兰豆|豆腐", name):
        return "veggie"
    return "wok"


def pick_tags(name: str, category_key: str) -> list[str]:
    tags: list[str] = []
    if re.search(r"低卡|低脂|掉秤", name):
        tags.append("轻负担")
    if re.search(r"凉拌|捞汁", name):
        tags.append("清爽")
    if re.search(r"酸辣|麻辣|黑椒|蒜香|照烧|奥尔良|酱香|葱油", name):
        tags.append("风味款")
    if re.search(r"鸡蛋|滑蛋", name):
        tags.append("蛋白感")
    if re.search(r"虾|鱼|海鲜|鱿", name):
        tags.append("鲜味足")
    if re.search(r"牛肉|鸡腿|鸡胸|鸡丝|里脊|鸡丁", name):
        tags.append("高满足")
    if not tags:
        fallback = {
            "cold": "开胃",
            "staple": "饱腹",
            "soup": "暖胃"
        }.get(category_key, "人气")
        tags.append(fallback)
    return list(dict.fromkeys(tags))[:3]


def build_description(name: str, category_key: str, tags: list[str]) -> str:
    tag_text = " / ".join(tags)
    return (
        f"{name} 采用门店常见家常做法，突出食材本味与层次口感；"
        f"推荐给喜欢 {tag_text} 风格的顾客。{CATEGORY_META[category_key]['tagline']}"
    )


def build_image(dish: dict) -> None:
    width, height = 640, 420
    primary, secondary, surface = CATEGORY_META[dish["categoryKey"]]["palette"]
    img = Image.new("RGB", (width, height), color=surface)
    draw = ImageDraw.Draw(img)

    for y in range(height):
      ratio = y / max(height - 1, 1)
      r1, g1, b1 = tuple(int(primary[i:i+2], 16) for i in (1, 3, 5))
      r2, g2, b2 = tuple(int(secondary[i:i+2], 16) for i in (1, 3, 5))
      color = (
          int(r1 + (r2 - r1) * ratio),
          int(g1 + (g2 - g1) * ratio),
          int(b1 + (b2 - b1) * ratio)
      )
      draw.line((0, y, width, y), fill=color)

    plate_bounds = (140, 95, 530, 350)
    draw.ellipse((165, 125, 565, 385), fill=(0, 0, 0, 35))
    draw.ellipse(plate_bounds, fill=(251, 247, 239))
    draw.ellipse((190, 130, 475, 305), fill=(255, 255, 255))

    accent = tuple(int(surface[i:i+2], 16) for i in (1, 3, 5))
    draw.rounded_rectangle((38, 30, 180, 74), radius=16, fill=(255, 255, 255))
    draw.text((56, 43), dish["category"], font=load_font(18, bold=True), fill=accent)
    draw.text((40, 96), dish["name"], font=load_font(36, bold=True), fill=(255, 255, 255))
    draw.text((40, 154), f"#{dish['id']:03d}  {dish['tags'][0]}", font=load_font(20), fill=(255, 245, 233))
    draw.text((40, 192), f"¥{dish['price']:.0f} · 库存 {dish['stock']}", font=load_font(22, bold=True), fill=(255, 255, 255))

    description = CATEGORY_META[dish["categoryKey"]]["tagline"]
    draw.rounded_rectangle((40, 334, 600, 390), radius=18, fill=(255, 255, 255))
    draw.text((58, 352), description, font=load_font(17), fill=(88, 68, 55))

    image_path = OUTPUT_ASSET_DIR / f"{dish['id']:03d}.jpg"
    img.save(image_path, format="JPEG", quality=68, optimize=True, progressive=True)


def build_menu() -> list[dict]:
    raw_text = SOURCE.read_text(encoding="utf-8")
    dishes: list[dict] = []
    for line in raw_text.splitlines():
        match = re.match(r"^\s*(\d+)\s*(.+?)\s*$", line)
        if not match:
            continue
        dish_id = int(match.group(1))
        name = NORMALIZE_MAP.get(match.group(2).strip(), match.group(2).strip())
        category_key = pick_category(name)
        category = CATEGORY_META[category_key]["name"]
        tags = pick_tags(name, category_key)
        price = CATEGORY_META[category_key]["base_price"] + (dish_id % 5)
        if re.search(r"牛肉|肥牛|鱼|黑鱼|鲈鱼|虾|海鲜|鱿", name):
            price += 4
        stock = 10 + (dish_id * 7 % 21)
        sales = 28 + (dish_id * 3 % 97)
        dish = {
            "id": dish_id,
            "name": name,
            "category": category,
            "categoryKey": category_key,
            "price": float(price),
            "sales": sales,
            "stock": stock,
            "enabled": True,
            "tags": tags,
            "description": build_description(name, category_key, tags),
            "image": f"/assets/dishes/generated/{dish_id:03d}.jpg",
            "imageType": "builtin",
            "updatedAt": "builtin"
        }
        dishes.append(dish)
    return dishes


def write_menu_file(dishes: list[dict]) -> None:
    OUTPUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    content = "module.exports = " + json.dumps(dishes, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT_DATA.write_text(content, encoding="utf-8")


def main() -> None:
    OUTPUT_ASSET_DIR.mkdir(parents=True, exist_ok=True)
    dishes = build_menu()
    write_menu_file(dishes)
    for dish in dishes:
        build_image(dish)
    print(f"built {len(dishes)} dishes and images")


if __name__ == "__main__":
    main()
