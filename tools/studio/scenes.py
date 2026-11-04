"""
Scene catalogue for the LA Luxury Gold image library.

Each job builds one scene from scratch and renders it. Output keys mirror the media
registry, e.g. "products/maison-signet-1" or "campaign/hero-desktop".
"""
import math
import random

from mathutils import Vector

import lib as L

PI = math.pi
TAU = 2 * PI
JOBS = {}
POST_BUILD = []  # callbacks run after a scene is fully built (e.g. light linking)


def job(key, w, h, samples=56):
    def deco(fn):
        JOBS[key] = dict(w=w, h=h, fn=fn, samples=samples)
        return fn
    return deco


# ============================================================================ materials
def G(k="18k", rough=0.1):
    return L.gold(k, rough)


# ============================================================================ pieces
# Each piece is built at the origin and returned. Helpers place them on a surface.

def p_band(k="18k"):
    return L.ring(G(k), 0.86, 0.19, 0.085, 2.8, name="band")


def p_signet(k="21k"):
    return L.ring(G(k), 0.86, 0.15, 0.075, 2.6, wfn=L.bump(PI / 2, 1.3, 0.3), tfn=L.bump(PI / 2, 1.55, 0.24), flat=(PI / 2, 1.27), name="signet")


def p_dome(k="22k"):
    return L.ring(G(k), 0.86, 0.17, 0.07, 2.0, wfn=L.bump(PI / 2, 2.4, 0.26), tfn=L.bump(PI / 2, 2.2, 0.23), name="dome")


def p_corda(k="18k"):
    mat = G(k)
    parts = []
    Ri, rr, sr, twists = 0.86, 0.075, 0.072, 11
    for ph in (0, PI):
        pts = []
        for i in range(720):
            th = TAU * i / 720
            a = twists * th + ph
            rad = Ri + rr + sr + rr * math.cos(a)
            pts.append((rad * math.cos(th), rad * math.sin(th), rr * math.sin(a)))
        parts.append(L.tube(mat, pts, sr, closed=True, prof=18, name="strand"))
    return L.join(parts, "corda")


def p_bangle(k="22k"):
    return L.ring(G(k), 3.05, 0.17, 0.17, 2.0, segs=320, prof=32, name="bangle")


def p_cuff(k="18k"):
    mat = G(k)
    gap = 0.95
    segs, prof = 300, 36
    verts = []
    Ri = 2.9
    for i in range(segs):
        th = gap / 2 + (TAU - gap) * i / (segs - 1)
        s = (th - gap / 2) / (TAU - gap)
        env = math.sin(PI * s) ** 0.35
        ww = 0.3 + 0.85 * math.sin(PI * s) ** 1.6
        tt = 0.11 * env + 0.02
        cr = Vector((math.cos(th - PI / 2) * 1.0, math.sin(th - PI / 2) * 0.82, 0))  # oval, opening at the back
        for j in range(prof):
            ph = TAU * j / prof
            a, b = math.cos(ph), math.sin(ph)
            sx = math.copysign(abs(a) ** (2 / 2.4), a)
            sz = math.copysign(abs(b) ** (2 / 2.4), b)
            rad = cr.normalized()
            p = Vector((cr.x * Ri, cr.y * Ri, 0)) + rad * (tt + tt * sx) + Vector((0, 0, ww * env * sz))
            verts.append(p)
    faces = L.grid_faces(segs, prof, False, True)
    ob = L.mesh_obj("cuff", verts, faces, mat)
    return ob


def p_hoops_pair(k="18k", gap=3.0):
    a = L.hoop(G(k), 1.2, 0.12, 0.9, 0.42)
    b = L.hoop(G(k), 1.2, 0.12, 0.9, 0.42)
    L.transform(a, (-gap / 2, 0, 0), (0, 0, 0.3))
    L.transform(b, (gap / 2, 0.4, 0), (0, 0, -0.5))
    return [a, b]


def p_huggie(k="18k"):
    return L.ring(G(k), 0.42, 0.16, 0.1, 3.2, segs=200, prof=32, name="huggie")


def p_drop_earring(k="21k"):
    """Built lying down: hoop flat on the surface, drop resting on its side towards -Y."""
    mat = G(k)
    h = L.hoop(mat, 0.5, 0.05, 0.88, 0.7, name="small-hoop")
    L.transform(h, (0, 0, 0), (0, 0, PI))
    d = L.teardrop(mat, 1.55, 0.36)
    L.transform(d, (0, -0.52, 0), (-PI / 2, 0, 0))
    bl = L.bail(mat, 0.1, 0.03)
    L.transform(bl, (0, -0.5, 0), (0, 0, PI / 2))
    ob = L.join([L.apply(h), L.apply(d), L.apply(bl)], "drop-earring")
    ob.rotation_euler = (-0.33, 0, 0)
    L.apply(ob)
    return ob


def p_teardrop_pendant(k="18k"):
    mat = G(k)
    d = L.teardrop(mat, 1.7, 0.5)
    bl = L.bail(mat, 0.13, 0.035)
    L.transform(bl, (0, 0, 0.12))
    return L.join([L.apply(d), L.apply(bl)], "pendant")


def p_medal(k="21k"):
    mat = G(k)
    c = L.coin(mat, 1.0, 0.09)
    bl = L.bail(mat, 0.16, 0.045)
    L.transform(bl, (0, 1.12, 0.0), (0, PI / 2, PI / 2))
    return L.join([c, L.apply(bl)], "medal")


BAR_SIZES = {  # width, length, thickness (cm) — approximate proportions only, nothing is marked on the bars
    "5g": (1.4, 2.35, 0.09), "10g": (1.8, 3.1, 0.11), "20g": (2.2, 3.7, 0.14), "50g": (2.6, 4.5, 0.24),
}


def p_minted(size="10g"):
    w, l, h = BAR_SIZES[size]
    return L.minted_bar(G("24k", 0.08), l, w, h)


def p_cast():
    return L.cast_bar(L.gold("24k", 0.2, satin=True), 5.4, 2.5, 0.75)


# ============================================================================ placement
def stand_ring(ob, x, y, z0, rz=0.0, lean=0.0, outer=1.12):
    """Stand a ring upright on a surface at height z0."""
    L.transform(ob, (x, y, z0 + outer - 0.005), (PI / 2 + lean, 0, rz))
    return ob


def lay(ob, x, y, z0, h=0.0, rz=0.0, rx=0.0, ry=0.0):
    L.transform(ob, (x, y, z0 + h), (rx, ry, rz))
    return ob


def chain_on(surfaces, path_xy, style="cable", k="18k", size=1.0, closed=False, z_from=300, smooth=2):
    dims = dict(cable=(0.5, 0.34, 0.062), rope=(0.42, 0.28, 0.05), curb=(0.5, 0.4, 0.07))[style]
    ll, lw, wr = (d * size for d in dims)
    off = (lw / 2 if style == "cable" else lw * 0.42 if style == "rope" else wr * 0.9)
    pts = L.drape_on(surfaces, path_xy, z_from=z_from, offset=off)
    pts = L.smooth_path(pts, smooth, closed)
    return L.chain(G(k), pts, style, ll, lw, wr, closed=closed)


# ============================================================================ environments
def env_studio(bg=None, key=1.0, warm=False, cove=True):
    """Clean ivory-champagne seamless with large soft key, white bounce above and a black flag."""
    bg = bg or L.hexrgb("#efe7da")
    L.world((0.012, 0.011, 0.01), 1)
    sweep = L.backdrop(L.plaster(bg), 400, 260, 220, 70, z=0) if cove else L.floor(L.plaster(bg))
    L.area((-26, -24, 40), (0, 0, 0), 38, 14000 * key, (1, 0.97, 0.93))
    L.area((30, -6, 22), (0, 0, 0), 22, 3200 * key, (1, 0.95, 0.88) if warm else (1, 0.98, 0.96))
    L.area((0, 30, 34), (0, 0, 0), 40, 4200 * key)
    L.card((0, 6, 30), (0, 0, 0), 50, 30, (1, 1, 1), emit=0.9)
    L.card((0, -26, 4), (0, 0, 3), 60, 10, (0, 0, 0))
    return [sweep]


def env_gloss(glow=None, key=1.0):
    """Polished obsidian surface curving into a dark wall — mirror reflections, no horizon."""
    L.world((0.0, 0.0, 0.0), 1)
    fm = L.mirror_black(0.07, 0.03)
    cove = L.floor(fm, 3000)
    L.area((-18, -4, 40), (0, 0, 0), 6, 6800 * key, (1, 0.95, 0.88), size_y=60, spread=50)
    L.area((20, 8, 36), (0, 0, 0), 5, 4200 * key, (1, 0.97, 0.93), size_y=50, spread=50)
    top = L.area((0, 0, 46), (0, 0, 0), 20, 2400 * key, spread=45)
    rim = L.card((0, 18, 12), (0, 0, 0), 60, 6, (1, 0.93, 0.82), emit=2.0)
    tc = L.card((0, 2, 40), (0, 0, 0), 24, 16, (1, 0.94, 0.84), emit=1.2)
    front = L.card((0, -34, 12), (0, 0, 1), 60, 22, (1, 0.93, 0.84), emit=1.1)
    POST_BUILD.append(lambda: L.exclude_from_light([top, tc, rim, front], [cove]))
    if glow:
        L.spot((0, -40, 60), (0, 160, 40), 160000, 10, 26, 0.9, glow)
    return [cove]


def env_travertine(plinth=(18, 12, 7), sun_dir=(-0.62, 0.55, -0.56), bg=None, gobo=True, key=1.0, extra_blocks=True):
    """Warm ivory set with a travertine plinth and hard late-afternoon sun through a window."""
    bg = bg or L.hexrgb("#ece2d2")
    L.world((0.10, 0.09, 0.08), 1)
    sweep = L.backdrop(L.plaster(bg), 500, 300, 260, 80)
    st = L.stone(L.TRAVERTINE)
    pl = L.box(st, plinth, (0, 0, plinth[2] / 2), bev=0.25)
    surfaces = [pl, sweep]
    if extra_blocks:
        b2 = L.box(st, (8, 8, 13), (plinth[0] / 2 + 3, 6, 6.5), bev=0.25, rot=(0, 0, 0.3))
        surfaces.append(b2)
    L.sun(sun_dir, 3.4 * key, 1.2)
    if gobo:
        L.gobo_window(sun_dir, (0, 0, plinth[2]), 140, 300, 3)
    L.area((26, -30, 24), (0, 0, 4), 50, 2600 * key, (1, 0.96, 0.9))
    L.card((0, 10, 34), (0, 0, 0), 60, 40, (1, 0.98, 0.94), emit=0.6)
    return surfaces, plinth[2]


def env_silk(color=L.BURGUNDY, light=1.0, rake=(-38, -8, 10), seed=3, amp=2.6, dark=True):
    """Silk drape with low raking light — deep folds and satin highlights."""
    L.world((0.002, 0.0015, 0.0015) if dark else (0.05, 0.045, 0.04), 1)
    sheet = L.heightfield(L.silk(color), (140, 100), (280, 200), (0, 0, 0), L.silk_fn(seed, amp * 0.5, 0.3, ((1.0, 0.25), (0.6, 1.6), (0.35, -0.9))))
    L.area(rake, (0, 0, 0), 10, 16000 * light, (1, 0.94, 0.86), size_y=60)
    L.area((26, 22, 26), (0, 0, 0), 20, 3200 * light, (1, 0.86, 0.84))
    L.area((0, -30, 40), (0, 0, 0), 30, 500 * light, (1, 0.95, 0.9))
    L.card((0, 14, 18), (0, 0, 0), 50, 16, (1, 0.92, 0.82), emit=1.4)
    return [sheet]


def env_velvet(color=L.EMERALD, light=1.0, seed=8):
    L.world((0.002, 0.002, 0.002), 1)
    sheet = L.heightfield(L.velvet(color, (0.7, 1.0, 0.85) if color == L.EMERALD else (1.0, 0.75, 0.8)), (120, 90), (220, 170), (0, 0, 0),
                          L.silk_fn(seed, 1.1, 0.05, ((1.0, 0.4), (0.5, 1.9))))
    L.area((-24, -18, 30), (0, 0, 0), 24, 8000 * light, (1, 0.95, 0.88))
    L.area((24, 10, 22), (0, 0, 0), 14, 2400 * light)
    L.card((0, 10, 26), (0, 0, 0), 50, 24, (1, 0.95, 0.88), emit=1.0)
    return [sheet]


def env_champagne(key=1.0):
    bg = L.hexrgb("#d9c39b")
    L.world((0.03, 0.025, 0.02), 1)
    sweep = L.backdrop(L.plaster(bg, 0.8), 400, 260, 220, 70)
    st = L.stone(L.hexrgb("#e6dccb"), 0.7, 1.2)
    cyl = L.cylinder(st, 6.5, 9, (6.5, 4, 0), bev=0.3)
    L.area((-30, -20, 34), (0, 0, 0), 34, 12000 * key, (1, 0.95, 0.88))
    L.area((30, 0, 18), (0, 0, 0), 20, 2400 * key)
    L.card((0, 8, 30), (0, 0, 0), 50, 30, (1, 0.97, 0.9), emit=0.8)
    L.card((0, -26, 4), (0, 0, 3), 60, 10, (0, 0, 0))
    return [cyl, sweep]


def gift_box(outer=(8.4, 8.4, 3.6), loc=(0, 0, 0), rz=0.0, color=L.BURGUNDY, lid_open=True):
    """Lined presentation box: leatherette shell, ivory satin cushion, open lid resting behind."""
    shell = L.leather(color)
    lining = L.silk(L.hexrgb("#efe6d6"), 0.35)
    W, D, H = outer
    t = 0.35
    parts = []
    parts.append(L.box(shell, (W, D, 0.4), (0, 0, 0.2), bev=0.12))
    parts.append(L.box(shell, (W, t, H), (0, -D / 2 + t / 2, H / 2), bev=0.12))
    parts.append(L.box(shell, (W, t, H), (0, D / 2 - t / 2, H / 2), bev=0.12))
    parts.append(L.box(shell, (t, D, H), (-W / 2 + t / 2, 0, H / 2), bev=0.12))
    parts.append(L.box(shell, (t, D, H), (W / 2 - t / 2, 0, H / 2), bev=0.12))
    cushion = L.box(lining, (W - 2 * t - 0.05, D - 2 * t - 0.05, H - 0.9), (0, 0, 0.4 + (H - 0.9) / 2), bev=0.5, seg=6)
    parts.append(cushion)
    if lid_open:
        lid = L.box(shell, (W + 0.2, D + 0.2, 1.4), (0, 0, 0), bev=0.15)
        lid_in = L.box(lining, (W - 0.5, D - 0.5, 0.2), (0, 0, -0.62), bev=0.08)
        for o in (lid, lid_in):
            o.location = (0, D / 2 + 0.35, H + 0.2 + D / 2 * 0.98)
            o.rotation_euler = (-1.42, 0, 0)
        parts += [lid, lid_in]
    for p in parts:
        p.location = Vector(p.location) + Vector(loc)
        p.rotation_euler.z += 0  # keep
    if rz:
        for p in parts:
            p.location = Vector((p.location.x * math.cos(rz) - p.location.y * math.sin(rz), p.location.x * math.sin(rz) + p.location.y * math.cos(rz), p.location.z))
            p.rotation_euler.z += rz
    return parts, cushion, H - 0.5


# ============================================================================ product shots
# 1 = studio, 2 = styled, 3 = detail. All 1200 x 1500 (4:5).
PW, PH = 1200, 1500


def cam_product(target=(0, 0, 0.8), dist=13, el=22, az=0, lens=100, fstop=None, focus=None):
    t = Vector(target)
    a, e = math.radians(az), math.radians(el)
    loc = t + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist
    return L.camera(loc, t, lens, fstop, focus)


def necklace_loop(cx, cy, rx, ry, seed, rot=0.0, n=500, pinch=0.0):
    pts = L.loose_loop(cx, cy, rx, ry, seed, 0.16, n, rot)
    if pinch:
        pts = [(x, y - pinch * max(0, -(y - cy) / ry) ** 2 * ry) for (x, y) in pts]
    return pts


# ---------------------------------------------------------------- rings
RINGS = {
    "aurelia-band": (p_band, "18k"),
    "maison-signet": (p_signet, "21k"),
    "corda-twist": (p_corda, "18k"),
    "soleil-dome": (p_dome, "22k"),
}
RING_STYLED = {"aurelia-band": "travertine", "maison-signet": "gloss", "corda-twist": "champagne", "soleil-dome": "silk"}


def ring_studio(name):
    fn, k = RINGS[name]
    env_studio()
    a = fn(k)
    stand_ring(a, -0.2, 0.3, 0, rz=-0.5)
    b = fn(k)
    lay(b, 1.55, -1.2, 0, 0.19 if name != "maison-signet" else 0.16, rz=0.6)
    cam_product((0.5, -0.3, 0.75), 15, 20, 8, 100, 5.6, (0, 0, 0.8))


def ring_styled(name):
    fn, k = RINGS[name]
    st = RING_STYLED[name]
    a = fn(k)
    if st == "travertine":
        surf, z0 = env_travertine((10, 8, 5), extra_blocks=False)
        stand_ring(a, 0, -0.5, z0, rz=-0.4)
        cam_product((0, -0.5, z0 + 0.9), 14, 16, -10, 100, 4.0, (0, -0.5, z0 + 0.9))
    elif st == "gloss":
        env_gloss(key=0.9)
        stand_ring(a, 0, 0, 0, rz=-0.55)
        cam_product((0, 0, 0.9), 13, 12, 6, 100, 4.0)
    elif st == "champagne":
        surf = env_champagne()
        stand_ring(a, -1.5, -1.5, 0, rz=0.5)
        b = fn(k)
        lay(b, 6.5, 4, 9, 0.19, rz=0.2)
        cam_product((-1.2, -1.2, 1.1), 13, 12, 14, 100, 3.5, (-1.5, -1.5, 1.1))
    else:  # silk
        surf = env_silk(L.BURGUNDY, 1.0, seed=5)
        hit = L.drape_on(surf, [(0, 0)])[0]
        stand_ring(a, 0, 0, hit.z - 0.15, rz=-0.5, lean=0.08)
        cam_product((0, 0, hit.z + 0.9), 14, 18, 0, 100, 3.5, (0, 0, hit.z + 1.0))


def ring_detail(name):
    fn, k = RINGS[name]
    env_studio(L.hexrgb("#e6dccb"), 0.9)
    a = fn(k)
    stand_ring(a, 0, 0, 0, rz=-0.7)
    cam_product((0, 0, 1.3), 6.8, 24, -18, 100, 2.8, (0.3, -0.5, 1.5))


for _n in RINGS:
    job(f"products/{_n}-1", PW, PH)(lambda n=_n: ring_studio(n))
    job(f"products/{_n}-2", PW, PH)(lambda n=_n: ring_styled(n))
    job(f"products/{_n}-3", PW, PH)(lambda n=_n: ring_detail(n))


# ---------------------------------------------------------------- necklaces
def neck_piece(name, surf, cx=0, cy=0, scale=1.0, seed=4, rot=0.2):
    loop = necklace_loop(cx, cy, 4.6 * scale, 3.4 * scale, seed, rot, pinch=0.25)
    if name == "riviera-cable-chain":
        chain_on(surf, loop, "cable", "18k", 1.35, closed=True)
    elif name == "corde-rope-chain":
        chain_on(surf, loop, "rope", "22k", 1.25, closed=True)
    else:
        k = "21k" if name == "medaille-coin-pendant" else "18k"
        chain_on(surf, loop, "cable", k, 0.55, closed=True)
        # pendant at the lowest point of the loop
        py = min(y for (_, y) in loop)
        px = [x for (x, y) in loop if y == py][0]
        hit = L.drape_on(surf, [(px, py - 1.2)])[0]
        if name == "medaille-coin-pendant":
            m = p_medal(k)
            lay(m, px, py - 1.25, hit.z - 0.02, 0.05, rz=PI + 0.1)
        else:
            d = p_teardrop_pendant(k)
            lay(d, px, py - 0.25, hit.z + 0.45, 0, rz=0.1, rx=-PI / 2 + 0.05)


NECKS = ["riviera-cable-chain", "medaille-coin-pendant", "corde-rope-chain", "goutte-teardrop-pendant"]
NECK_STYLED = {"riviera-cable-chain": "travertine", "medaille-coin-pendant": "velvet-burgundy", "corde-rope-chain": "gloss", "goutte-teardrop-pendant": "silk-ivory"}


def neck_studio(name):
    surf = env_studio()
    neck_piece(name, surf, 0, 0, 1.0, 4)
    cam_product((0, -0.8, 0), 30, 58, 0, 85, 8.0)


def neck_styled(name):
    st = NECK_STYLED[name]
    if st == "travertine":
        surf, z0 = env_travertine((16, 13, 6), extra_blocks=True)
        neck_piece(name, surf, -0.5, -1, 0.95, 7, 0.4)
        cam_product((0, -1.2, z0), 30, 45, -12, 85, 5.6, (0, -1.5, z0))
    elif st == "velvet-burgundy":
        surf = env_velvet(L.BURGUNDY, 1.1, 4)
        neck_piece(name, surf, 0, 0, 1.0, 9, -0.2)
        cam_product((0, -1.5, 1), 26, 50, 8, 85, 5.6, (0, -3.5, 1.2))
    elif st == "gloss":
        surf = env_gloss()
        neck_piece(name, surf, 0, 0, 1.0, 11, 0.5)
        cam_product((0, -0.8, 0), 26, 40, -6, 85, 5.6, (0, -2.5, 0))
    else:
        surf = env_silk(L.hexrgb("#ece2d0"), 0.9, seed=9, amp=2.0, dark=False)
        neck_piece(name, surf, 0, 0, 1.0, 13, 0.1)
        cam_product((0, -1.5, 1.6), 26, 48, 5, 85, 5.6, (0, -4.0, 1.5))


def neck_detail(name):
    surf = env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    neck_piece(name, surf, 0, 2.4, 1.0, 4)
    if name in ("riviera-cable-chain", "corde-rope-chain"):
        cam_product((0, -1.0, 0.1), 7, 26, 0, 100, 2.8, (0, -1.0, 0.1))
    else:
        cam_product((0, -2.0, 0.3), 9.5, 34, 0, 100, 2.8, (0, -2.4, 0.3))


for _n, _k in zip(NECKS, ["riviera-cable-chain", "medaille-coin-pendant", "corde-rope-chain", "goutte-teardrop-pendant"]):
    _key = {"riviera-cable-chain": "riviera-cable-chain", "medaille-coin-pendant": "medaille-coin-pendant",
            "corde-rope-chain": "corde-rope-chain", "goutte-teardrop-pendant": "goutte-teardrop-pendant"}[_n]
    job(f"products/{_key}-1", PW, PH)(lambda n=_n: neck_studio(n))
    job(f"products/{_key}-2", PW, PH)(lambda n=_n: neck_styled(n))
    job(f"products/{_key}-3", PW, PH)(lambda n=_n: neck_detail(n))


# ---------------------------------------------------------------- bracelets
def bracelet_piece(name, surf, cx=0, cy=0, z=None, rz=0.0):
    if name == "halo-bangle":
        hit = L.drape_on(surf, [(cx, cy)])[0] if z is None else Vector((cx, cy, z))
        b = p_bangle("22k")
        lay(b, cx, cy, hit.z, 0.17, rz=rz)
        return b
    if name == "arc-cuff":
        hit = L.drape_on(surf, [(cx, cy)])[0] if z is None else Vector((cx, cy, z))
        c = p_cuff("18k")
        # stand the cuff on its edge
        lay(c, cx, cy, hit.z, 2.95 * 0.82 + 0.1, rz=rz, rx=PI / 2)
        return c
    loop = necklace_loop(cx, cy, 2.9, 2.2, 5, rz, n=300)
    return chain_on(surf, loop, "cable", "18k", 1.75, closed=True)


BRACELETS = ["halo-bangle", "arc-cuff", "riviera-cable-bracelet"]
BR_STYLED = {"halo-bangle": "velvet-emerald", "arc-cuff": "travertine", "riviera-cable-bracelet": "silk"}


def bracelet_studio(name):
    surf = env_studio()
    bracelet_piece(name, surf, 0, 0, 0 if name != "riviera-cable-bracelet" else None, 0.3)
    if name == "arc-cuff":
        cam_product((0, 0, 2.2), 26, 14, 18, 85, 8.0)
    else:
        cam_product((0, 0, 0.3), 22, 50, 0, 85, 8.0)


def bracelet_styled(name):
    st = BR_STYLED[name]
    if st == "velvet-emerald":
        surf = env_velvet(L.EMERALD, 1.2, 6)
        bracelet_piece(name, surf, 0, 0, None, 0.2)
        cam_product((0, 0, 1.2), 22, 34, -10, 85, 4.5, (0, -2.5, 1.2))
    elif st == "travertine":
        surf, z0 = env_travertine((14, 11, 6), extra_blocks=True)
        bracelet_piece(name, surf, -1, -0.5, z0, -0.35)
        cam_product((-1, -0.5, z0 + 2.4), 26, 16, -14, 85, 5.0)
    else:
        surf = env_silk(L.BURGUNDY, 1.0, seed=12)
        bracelet_piece(name, surf, 0, 0, None, 0.4)
        cam_product((0, 0, 1.0), 22, 40, 10, 85, 4.5, (0, -2.0, 1.0))


def bracelet_detail(name):
    surf = env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    bracelet_piece(name, surf, 0, 0, 0 if name != "riviera-cable-bracelet" else None, 0.3)
    if name == "arc-cuff":
        cam_product((0, -0.6, 4.6), 9, 26, 12, 100, 2.8, (0, -0.9, 4.9))
    elif name == "halo-bangle":
        cam_product((0, -3.0, 0.2), 7, 22, 10, 100, 2.8, (0, -3.0, 0.2))
    else:
        cam_product((0, -2.2, 0.2), 6.5, 30, 0, 100, 2.8, (0, -2.2, 0.2))


for _n in BRACELETS:
    job(f"products/{_n}-1", PW, PH)(lambda n=_n: bracelet_studio(n))
    job(f"products/{_n}-2", PW, PH)(lambda n=_n: bracelet_styled(n))
    job(f"products/{_n}-3", PW, PH)(lambda n=_n: bracelet_detail(n))


# ---------------------------------------------------------------- earrings
def earring_piece(name, surf, cx=0, cy=0, z=0.0):
    if name == "classic-hoops":
        a, b = p_hoops_pair("18k", 3.2)
        for o, dx, dy, r in ((a, -1.6, 0, 0.4), (b, 1.6, 0.4, -0.6)):
            lay(o, cx + dx, cy + dy, z, 0.12, rz=r)
    elif name == "petite-huggies":
        a, b = p_huggie(), p_huggie()
        stand_ring(a, cx - 0.75, cy, z, rz=0.4, outer=0.62)
        lay(b, cx + 0.85, cy - 0.5, z, 0.16, rz=0.2)
    else:
        a, b = p_drop_earring(), p_drop_earring()
        lay(a, cx - 0.45, cy + 0.6, z, 0.36, rz=-1.3)
        lay(b, cx + 0.45, cy - 0.2, z, 0.36, rz=1.25)


EARRINGS = ["classic-hoops", "petite-huggies", "goutte-drop-earrings"]
EAR_STYLED = {"classic-hoops": "gloss", "petite-huggies": "champagne", "goutte-drop-earrings": "velvet-emerald"}


def ear_studio(name):
    env_studio()
    earring_piece(name, None, 0, 0, 0)
    cam_product((0, 0.3, 0.3), {"classic-hoops": 26, "petite-huggies": 12, "goutte-drop-earrings": 22}[name], 38, 0, 100, 8.0)


def ear_styled(name):
    st = EAR_STYLED[name]
    if st == "gloss":
        env_gloss()
        earring_piece(name, None, 0, 0, 0)
        cam_product((0, 0.3, 0.4), 25 if name == "classic-hoops" else 22, 18, 6, 100, 5.0)
    elif st == "champagne":
        env_champagne()
        earring_piece(name, None, 6.5, 4, 9)
        cam_product((6.5, 4, 9.4), 11, 26, -14, 100, 4.0)
    else:
        surf = env_velvet(L.EMERALD, 1.15, 10)
        hit = L.drape_on(surf, [(0, 0)])[0]
        earring_piece(name, None, 0, 0, hit.z - 0.1)
        cam_product((0, 0.2, hit.z + 0.4), 20, 30, -8, 100, 4.0)


def ear_detail(name):
    env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    earring_piece(name, None, 0, 0, 0)
    if name == "petite-huggies":
        cam_product((-0.75, 0, 0.6), 4.5, 16, -10, 100, 2.8)
    elif name == "classic-hoops":
        cam_product((-1.6, -1.0, 0.15), 5.5, 26, -6, 100, 2.8)
    else:
        cam_product((-1.2, 0.4, 0.3), 8, 30, -10, 100, 2.8, (-1.2, 0.5, 0.35))


for _n in EARRINGS:
    _key = {"classic-hoops": "classic-hoops", "petite-huggies": "petite-huggies", "goutte-drop-earrings": "goutte-drop-earrings"}[_n]
    job(f"products/{_key}-1", PW, PH)(lambda n=_n: ear_studio(n))
    job(f"products/{_key}-2", PW, PH)(lambda n=_n: ear_styled(n))
    job(f"products/{_key}-3", PW, PH)(lambda n=_n: ear_detail(n))


# ---------------------------------------------------------------- gold bars
def bars_studio(size):
    env_studio(L.hexrgb("#ebe3d6"))
    b = p_minted(size)
    w, l, h = BAR_SIZES[size]
    lay(b, 0, 0, 0, 0, rz=0.35)
    cam_product((0, 0, 0), 9 + l * 2.2, 52, 0, 100, 8.0)


def bars_styled(size):
    if size in ("5g", "20g"):
        env_gloss()
        a, b = p_minted(size), p_minted(size)
        w, l, h = BAR_SIZES[size]
        lay(a, -w * 0.4, 0, 0, 0, rz=0.25)
        lay(b, w * 0.55, -0.4, h * 0.0, 0, rz=-0.15, rx=0.0)
        L.transform(b, (w * 0.75, -0.2, h + 0.002), (0, 0, -0.32))
        cam_product((0, 0, 0.1), 8 + l * 2, 22, 6, 100, 4.0)
    else:
        surf, z0 = env_travertine((14, 10, 5), extra_blocks=False, key=0.9)
        b = p_minted(size)
        w, l, h = BAR_SIZES[size]
        lay(b, 0, -0.5, z0, 0, rz=-0.4)
        cam_product((0, -0.5, z0), 8 + l * 2.2, 30, -10, 100, 4.0)


def bars_detail(size):
    env_studio(L.hexrgb("#e6dccb"), 0.9)
    b = p_minted(size)
    w, l, h = BAR_SIZES[size]
    lay(b, 0, 0, 0, 0, rz=0.5)
    cam_product((w * 0.35, -l * 0.2, h), 5.0 + l * 0.8, 34, 30, 100, 2.8)


for _s in BAR_SIZES:
    job(f"products/minted-gold-bar-{_s}-1", PW, PH)(lambda s=_s: bars_studio(s))
    job(f"products/minted-gold-bar-{_s}-2", PW, PH)(lambda s=_s: bars_styled(s))
    job(f"products/minted-gold-bar-{_s}-3", PW, PH)(lambda s=_s: bars_detail(s))


@job("products/cast-gold-bar-100g-1", PW, PH)
def cast_studio():
    env_studio(L.hexrgb("#ebe3d6"))
    lay(p_cast(), 0, 0, 0, 0, rz=0.4)
    cam_product((0, 0, 0.4), 22, 36, 0, 100, 8.0)


@job("products/cast-gold-bar-100g-2", PW, PH)
def cast_styled():
    env_gloss(glow=None, key=1.1)
    lay(p_cast(), 0, 0, 0, 0, rz=-0.3)
    cam_product((0, 0, 0.5), 20, 16, 12, 100, 4.0)


@job("products/cast-gold-bar-100g-3", PW, PH)
def cast_detail():
    env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    lay(p_cast(), 0, 0, 0, 0, rz=0.6)
    cam_product((1.0, -0.8, 0.7), 8, 18, 30, 100, 2.8)


# ---------------------------------------------------------------- jewellery sets (pieces shown together)
@job("products/riviera-set-1", PW, PH)
def riviera_set_1():
    surf = env_studio()
    chain_on(surf, necklace_loop(-0.8, 1.2, 4.4, 3.2, 4, 0.2, pinch=0.25), "cable", "18k", 1.35, closed=True)
    chain_on(surf, necklace_loop(1.6, -3.6, 2.8, 2.1, 7, -0.3, 300), "cable", "18k", 1.75, closed=True)
    cam_product((0.3, -1.2, 0), 32, 58, 0, 85, 8.0)


@job("products/riviera-set-2", PW, PH)
def riviera_set_2():
    L.world((0.002, 0.002, 0.002), 1)
    fl = L.floor(L.velvet(L.hexrgb("#2a0a16")))
    parts, cushion, ztop = gift_box((14, 11, 3.2), (0, 0, 0))
    L.area((-24, -18, 34), (0, 0, 0), 24, 9000, (1, 0.95, 0.88))
    L.area((26, 10, 22), (0, 0, 0), 14, 2600)
    L.card((0, 12, 26), (0, 0, 0), 50, 24, (1, 0.95, 0.88), emit=1.0)
    chain_on([cushion], necklace_loop(-1.6, -0.2, 3.3, 3.0, 4, 0.1, 380), "cable", "18k", 1.1, closed=True)
    chain_on([cushion], necklace_loop(3.6, -0.4, 1.9, 2.0, 7, 0.3, 260), "cable", "18k", 1.3, closed=True)
    cam_product((0.5, -0.5, 2.5), 30, 46, 6, 85, 5.6, (0, -1, 3.0))


@job("products/riviera-set-3", PW, PH)
def riviera_set_3():
    surf = env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    chain_on(surf, necklace_loop(-1.2, 1.6, 4.4, 3.2, 4, 0.2, pinch=0.25), "cable", "18k", 1.35, closed=True)
    chain_on(surf, necklace_loop(1.4, -2.6, 2.8, 2.1, 7, -0.3, 300), "cable", "18k", 1.75, closed=True)
    cam_product((0.6, -2.6, 0.2), 8, 28, 0, 100, 2.8)


@job("products/soleil-halo-set-1", PW, PH)
def soleil_halo_set_1():
    env_studio()
    lay(p_bangle("22k"), 0.6, 0.4, 0, 0.17, rz=0.2)
    stand_ring(p_dome("22k"), -2.6, -4.4, 0, rz=-0.5)
    cam_product((-0.6, -1.6, 0.6), 26, 36, 0, 85, 8.0, (-0.6, -1.6, 0.6))


@job("products/soleil-halo-set-2", PW, PH)
def soleil_halo_set_2():
    surf = env_silk(L.BURGUNDY, 1.1, seed=21)
    h = L.drape_on(surf, [(0.5, 0.8)])[0]
    lay(p_bangle("22k"), 0.5, 0.8, h.z - 0.05, 0.17, rz=0.2)
    h2 = L.drape_on(surf, [(-1.6, -4.6)])[0]
    stand_ring(p_dome("22k"), -1.6, -4.6, h2.z - 0.15, rz=-0.4)
    cam_product((-0.4, -1.8, 1.4), 26, 30, 8, 85, 4.0, (-1.6, -4.6, 1.6))


@job("products/soleil-halo-set-3", PW, PH)
def soleil_halo_set_3():
    env_studio(L.hexrgb("#e6dccb"), 0.9, cove=False)
    lay(p_bangle("22k"), 0.0, 1.6, 0, 0.17, rz=0.2)
    stand_ring(p_dome("22k"), -0.6, -3.6, 0, rz=-0.6)
    cam_product((-0.6, -3.0, 1.2), 9, 18, -14, 100, 2.8, (-0.6, -3.6, 1.2))


# ============================================================================ campaign
def bust_set(bx=0.0):
    """Burgundy velvet display bust on obsidian, wearing three layered chains and a medallion."""
    L.world((0.0, 0.0, 0.0), 1)
    cove = L.backdrop(L.plaster(L.hexrgb("#1d0c12"), 0.9), 600, 200, 300, 20)
    L.transform(cove, (0, -50, 0))
    plinth = L.box(L.gloss(L.hexrgb("#0e0c0b"), 0.1), (34, 18, 8), (bx, 0, 4), bev=0.3)
    bust = L.bust(L.velvet(L.hexrgb("#5a1430"), (1.0, 0.62, 0.7)), 30.0)
    L.transform(bust, (bx, 0, 8))
    L.apply(bust)
    # burgundy halo on the wall, from a lamp hidden behind the bust
    L.area((bx, 12, 26), (bx, 70, 36), 6, 26000, L.hexrgb("#b0304f", 1.0))
    # warm reflection cards so polished gold faces read bright
    L.card((bx - 30, -70, 55), (bx, 0, 28), 70, 40, (1, 0.94, 0.84), emit=1.6)
    L.card((bx + 40, -40, 30), (bx, 0, 28), 30, 50, (1, 0.9, 0.8), emit=0.8)
    # three necklaces: choker-length rope, mid cable with medallion, long fine chain with drop
    specs = [
        dict(style="rope", k="22k", size=1.6, z_back=33.8, drop=4.2, rad_pad=0.0),
        dict(style="cable", k="21k", size=1.45, z_back=33.0, drop=8.5, rad_pad=0.0, pendant="medal"),
        dict(style="cable", k="18k", size=0.8, z_back=32.4, drop=13.0, rad_pad=0.0, pendant="drop"),
    ]
    for sp in specs:
        pts = []
        n = 420
        for i in range(n):
            th = TAU * i / n
            front = (1 - math.sin(th + PI)) / 2  # 1 at the front (-Y)
            front = (1 + math.sin(-th + 0)) / 2
            f = max(0.0, -math.sin(th))  # front half weight
            z = sp["z_back"] - sp["drop"] * f ** 1.7
            pts.append((bx + math.cos(th) * 30, math.sin(th) * 30, z))
        pts = L.wrap_on(bust, pts, offset=sp["size"] * 0.2)
        pts = L.smooth_path(pts, 3, True)
        dims = dict(cable=(0.5, 0.34, 0.062), rope=(0.42, 0.28, 0.05))[sp["style"]]
        ll, lw, wr = (d * sp["size"] for d in dims)
        L.chain(G(sp["k"]), pts, sp["style"], ll, lw, wr, closed=True)
        if sp.get("pendant"):
            low = min(pts, key=lambda p: p.z)
            nrm = Vector((low.x, low.y, 0)).normalized()
            if sp["pendant"] == "medal":
                m = p_medal("21k")
                L.transform(m, (low.x, low.y - 0.2, low.z - 1.25), (PI / 2 - 0.12, 0, 0), 1.7)
            else:
                d = p_teardrop_pendant("18k")
                L.transform(d, (low.x, low.y - 0.25, low.z - 0.05), (-0.1, 0, 0), 1.6)
    return bust


@job("campaign/hero-desktop", 2560, 1440, 80)
def hero_desktop():
    bust_set()
    L.area((-55, -45, 70), (0, 0, 30), 24, 52000, (1, 0.93, 0.84))
    L.area((50, 25, 50), (0, 0, 30), 8, 22000, (1, 0.86, 0.8), size_y=60)
    # bust in the right third, cropped at the chest; dark negative space on the left for type
    L.camera((-16, -88, 29), (-8, 0, 26), 70, 3.2, (0, -4, 28))


@job("campaign/hero-mobile", 1080, 1920, 80)
def hero_mobile():
    bust_set()
    L.area((-55, -45, 70), (0, 0, 30), 24, 52000, (1, 0.93, 0.84))
    L.area((50, 25, 50), (0, 0, 30), 8, 22000, (1, 0.86, 0.8), size_y=60)
    # bust in the lower half; dark headroom at the top for the headline
    L.camera((-8, -96, 33), (0, 0, 32), 70, 3.2, (0, -4, 28), shift=(0, 0.2))


@job("campaign/campaign-burgundy", 2560, 1280, 48)
def campaign_burgundy():
    surf = env_silk(L.hexrgb("#6a1631"), 1.15, (-46, -4, 9), seed=31, amp=3.6)
    h = L.drape_on(surf, [(3, 1)])[0]
    lay(p_bangle("22k"), 3, 1, h.z - 0.1, 0.17, rz=0.3)
    h2 = L.drape_on(surf, [(9.5, -1.5)])[0]
    c = p_cuff("18k")
    lay(c, 9.5, -1.5, h2.z - 0.15, 2.95 * 0.82 + 0.1, rz=-0.5, rx=PI / 2)
    chain_on(surf, L.s_curve((-6, -5), (16, 4), 2.2, 0.8, 500, 1.2), "rope", "22k", 1.4)
    L.camera((9, -36, 15), (8, 0, 0.5), 60, 3.5, (5, 0, 1))


@job("campaign/campaign-editorial", 2400, 1600, 80)
def campaign_editorial():
    sun_dir = (-0.7, 0.45, -0.55)
    L.world((0.11, 0.1, 0.09), 1)
    sweep = L.backdrop(L.plaster(L.hexrgb("#efe6d8")), 600, 320, 300, 90)
    st = L.stone(L.TRAVERTINE)
    st2 = L.stone(L.hexrgb("#e4d6bf"), 0.7, 1.3)
    col = L.cylinder(st, 7, 34, (-16, 16, 0), bev=0.4)
    b1 = L.box(st, (22, 14, 9), (2, 2, 4.5), bev=0.3)
    b2 = L.box(st2, (12, 12, 18), (17, 10, 9), bev=0.3, rot=(0, 0, 0.25))
    cy = L.cylinder(st2, 4.5, 4, (-6, -4, 0), bev=0.3)
    L.sun(sun_dir, 3.6, 1.0)
    L.gobo_window(sun_dir, (0, 0, 9), 160, 340, 3)
    L.area((40, -40, 30), (0, 0, 6), 60, 3200, (1, 0.96, 0.9))
    L.card((0, 10, 40), (0, 0, 0), 80, 50, (1, 0.98, 0.94), emit=0.6)
    surf = [b1, cy, b2, sweep]
    stand_ring(p_signet("21k"), -1.5, 0.5, 9, rz=-0.4)
    lay(p_band("18k"), 1.6, -1.2, 9, 0.19, rz=0.4)
    stand_ring(p_dome("22k"), 4.4, 1.6, 9, rz=0.6)
    chain_on(surf, L.s_curve((-12, -2.5), (-1, -2.5), 0.8, 0.5, 300, 0.2), "cable", "18k", 1.35)
    lay(p_bangle("22k"), -6, -4, 4, 0.17)
    L.camera((-1, -34, 19), (0.8, 0, 9.5), 60, 4.0, (1, 0, 9.5))


@job("campaign/gold-bars-wide", 2400, 1350, 80)
def bars_wide():
    env_gloss(key=1.1)
    w, l, h = BAR_SIZES["50g"]
    lay(p_cast(), -2.5, 1.5, 0, 0, rz=0.35)
    for i, (sz, x, y, r) in enumerate([("50g", 3.6, -0.5, -0.25), ("20g", 7.2, 1.8, 0.4), ("10g", 6.4, -2.8, 0.1), ("5g", 9.6, -1.0, -0.5)]):
        lay(p_minted(sz), x, y, 0, 0, rz=r)
    L.camera((3, -26, 9), (3, 0, 0.4), 70, 4.0, (3, -1, 0.4))


# ============================================================================ collections (1600 x 2000)
CW, CH = 1600, 2000


@job("collections/collection-rings", CW, CH, 72)
def col_rings():
    surf, z0 = env_travertine((16, 12, 8), extra_blocks=True)
    stand_ring(p_signet("21k"), -1.6, -1.0, z0, rz=-0.4)
    stand_ring(p_dome("22k"), 1.6, 0.6, z0, rz=0.5)
    lay(p_band("18k"), 0.2, -3.0, z0, 0.19, rz=0.3)
    lay(p_corda("18k"), 3.4, -2.6, z0, 0.15, rz=0.3)
    L.camera((2, -30, z0 + 12), (0.6, -0.6, z0 + 0.6), 85, 4.5, (0, -1, z0 + 1))


@job("collections/collection-necklaces", CW, CH, 72)
def col_necklaces():
    surf = env_champagne()
    chain_on(surf, necklace_loop(6.5, 4.8, 3.9, 3.0, 4, 0.3, pinch=0.2), "cable", "18k", 1.35, closed=True)
    chain_on(surf, necklace_loop(5.8, 3.6, 4.6, 3.6, 9, -0.2, pinch=0.3), "cable", "21k", 0.6, closed=True)
    tail = L.s_curve((9.5, 6.5), (3.5, -6.5), 1.3, 0.7, 500, 0.6) + L.s_curve((3.5, -6.5), (-3.5, -9.0), 1.0, 0.5, 200, 1.0)[1:]
    chain_on(surf, tail, "rope", "22k", 1.3)
    L.camera((-4, -30, 34), (4, 0, 6), 70, 5.6, (5.5, 1, 9))


@job("collections/collection-bracelets", CW, CH, 72)
def col_bracelets():
    surf = env_velvet(L.EMERALD, 1.2, 14)
    h = L.drape_on(surf, [(0, 1)])[0]
    lay(p_bangle("22k"), 0, 1, h.z - 0.05, 0.17, rz=0.2)
    h = L.drape_on(surf, [(1.5, 1.6)])[0]
    lay(p_bangle("22k"), 1.3, 1.5, h.z + 0.3, 0.17, rz=0.2, rx=0.08)
    h = L.drape_on(surf, [(-1.8, -4.2)])[0]
    c = p_cuff("18k")
    lay(c, -1.8, -4.2, h.z - 0.05, 0.11, rz=0.5)
    chain_on(surf, necklace_loop(4.0, -4.6, 2.6, 2.0, 5, 0.2, 300), "cable", "18k", 1.75, closed=True)
    L.camera((0, -26, 26), (0.6, -1.6, 0.8), 70, 4.5, (0, -2, 1.2))


@job("collections/collection-earrings", CW, CH, 72)
def col_earrings():
    env_gloss(key=1.0)
    a, b = p_hoops_pair("18k", 3.4)
    lay(a, -2.2, 1.2, 0, 0.12, rz=0.3)
    lay(b, 1.4, 1.8, 0, 0.12, rz=-0.5)
    d1, d2 = p_drop_earring(), p_drop_earring()
    lay(d1, -0.4, -1.4, 0, 0.36, rz=-1.3)
    lay(d2, 0.6, -2.2, 0, 0.36, rz=1.25)
    stand_ring(p_huggie(), 3.4, -0.6, 0, rz=0.3, outer=0.62)
    L.camera((0, -19, 9), (0.2, -0.4, 0.3), 85, 4.0, (0, -1.6, 0.3))


@job("collections/collection-sets", CW, CH, 72)
def col_sets():
    L.world((0.002, 0.002, 0.002), 1)
    L.floor(L.velvet(L.hexrgb("#1a0c10")))
    parts, cushion, ztop = gift_box((15, 12, 3.4), (0, 0, 0), color=L.BURGUNDY)
    L.area((-26, -20, 36), (0, 0, 0), 26, 9500, (1, 0.95, 0.88))
    L.area((26, 12, 24), (0, 0, 0), 14, 2600)
    L.card((0, 12, 28), (0, 0, 0), 50, 24, (1, 0.95, 0.88), emit=1.0)
    chain_on([cushion], necklace_loop(-1.5, 0.2, 3.6, 3.4, 8, 0.0, 380, pinch=0.2), "cable", "18k", 0.6, closed=True)
    h = L.drape_on([cushion], [(-1.5, -3.6)])[0]
    d = p_teardrop_pendant("18k")
    lay(d, -1.5, -3.4, h.z + 0.45, 0, rz=0.0, rx=-PI / 2 + 0.05)
    a, b = p_hoops_pair("18k", 2.6)
    lay(a, 3.9, 1.6, ztop + 0.1, 0.12, rz=0.2)
    lay(b, 4.3, -2.0, ztop + 0.1, 0.12, rz=-0.4)
    L.camera((1, -30, 30), (1, -0.6, 2.4), 70, 5.0, (1, -1, 3.0))


@job("collections/collection-gold-bars", CW, CH, 72)
def col_bars():
    env_gloss(key=1.1)
    lay(p_cast(), -0.5, 2.6, 0, 0, rz=0.3)
    lay(p_minted("50g"), 1.6, -1.4, 0, 0, rz=-0.35)
    lay(p_minted("20g"), -2.2, -2.2, 0, 0, rz=0.25)
    b = p_minted("10g")
    L.transform(b, (-1.6, -2.4, BAR_SIZES["20g"][2] + 0.002), (0, 0, -0.1))
    L.camera((0, -17, 15), (0, 0, 0.3), 85, 4.5, (0, -1, 0.3))


# ============================================================================ details & brand
@job("details/gold-texture", 2000, 1400, 72)
def det_texture():
    surf = env_silk(L.hexrgb("#2b0915"), 1.2, (-30, -10, 14), seed=41, amp=1.0)
    chain_on(surf, L.s_curve((-6, -2), (6, 1.5), 0.8, 0.6, 400, 0.4), "rope", "22k", 1.6)
    L.camera((0.5, -9, 3.6), (0, 0, 0.4), 100, 2.2, (0, -0.2, 0.5))


@job("details/jewellery-craftsmanship", 2000, 1400, 72)
def det_craft():
    surf, z0 = env_travertine((24, 16, 5), extra_blocks=False)
    stand_ring(p_signet("21k"), 0, 0.4, z0, rz=-0.9)
    chain_on(surf, L.s_curve((-5, -1.6), (5, -2.2), 0.4, 0.5, 300, 0.1), "cable", "18k", 1.6)
    L.camera((2.4, -17, z0 + 4.6), (0, -0.6, z0 + 1.2), 100, 2.8, (0.1, 0.2, z0 + 1.3))


@job("details/premium-packaging", 1600, 2000, 72)
def det_packaging():
    surf, z0 = env_travertine((26, 18, 4), extra_blocks=False, key=0.9)
    parts, cushion, ztop = gift_box((8.4, 8.4, 3.6), (0, 0, z0), rz=-0.3)
    stand_ring(p_signet("21k"), 0, -0.3, ztop + z0 - 0.4, rz=-0.3, outer=1.12)
    L.camera((4, -30, 24), (0, 0, z0 + 3.5), 85, 5.6, (0, -0.3, z0 + 4))


@job("brand/our-story", 1600, 2000, 72)
def our_story():
    surf = env_silk(L.hexrgb("#ece2d0"), 0.95, (-36, -14, 16), seed=17, amp=2.2, dark=False)
    parts, cushion, ztop = gift_box((8.4, 8.4, 3.4), (5, 4, 0.6), rz=0.35, color=L.BURGUNDY)
    h = L.drape_on(surf, [(0.6, -3.2)])[0]
    stand_ring(p_band("18k"), 0.6, -3.2, h.z - 0.15, rz=-0.3)
    h = L.drape_on(surf, [(-5, 2)])[0]
    lay(p_bangle("22k"), -5, 2, h.z - 0.05, 0.17, rz=0.2)
    chain_on(surf, L.s_curve((-12, -6), (2, -5), 1.0, 0.7, 400, 0.9), "cable", "18k", 0.6)
    L.camera((-2, -32, 24), (-0.5, 0, 2), 70, 5.0, (0.6, -3.2, 1.5))
