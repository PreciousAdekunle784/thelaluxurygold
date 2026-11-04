"""
LA Luxury Gold — Cycles studio library.

Physically based, path-traced studio renders (Blender Cycles via the `bpy` module).
Everything is modelled procedurally: there are no third-party assets, scans or photographs.
Units: 1 Blender unit = 1 cm (scene unit scale 0.01), so camera depth of field is physical.

The output is CGI — rendered imagery, not photography — and the jewellery is representative of
each design, not a photograph of a specific item for sale.
"""
import math
import random

import bpy  # noqa: I001  (must load before addon_utils)
import addon_utils
import bmesh
import numpy as np
from mathutils import Matrix, Vector, noise
from mathutils.bvhtree import BVHTree

PI = math.pi
TAU = 2 * math.pi


# ----------------------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable("cycles", default_set=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 0.01
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 12
    sc.cycles.glossy_bounces = 7
    sc.cycles.diffuse_bounces = 4
    sc.cycles.transmission_bounces = 4
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 0.6
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    return sc


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_obj(name, verts, faces, mat=None, smooth=True, recalc=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate(clean_customdata=False)
    if recalc:
        bm_ = bmesh.new()
        bm_.from_mesh(me)
        bmesh.ops.remove_doubles(bm_, verts=bm_.verts[:], dist=1e-6)
        bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:])
        bm_.to_mesh(me)
        bm_.free()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    if mat is not None:
        me.materials.append(mat)
    return link(ob)


def grid_faces(nu, nv, wrap_u, wrap_v, offset=0):
    """Quad faces for a (nu x nv) vertex grid, index = i*nv + j."""
    faces = []
    iu = nu if wrap_u else nu - 1
    iv = nv if wrap_v else nv - 1
    for i in range(iu):
        for j in range(iv):
            a = i * nv + j
            b = ((i + 1) % nu) * nv + j
            c = ((i + 1) % nu) * nv + (j + 1) % nv
            d = i * nv + (j + 1) % nv
            faces.append((a + offset, b + offset, c + offset, d + offset))
    return faces


def smoothstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def bump(center, width, amp=1.0):
    """Smooth periodic bump on the circle, peaking at `center` (radians)."""
    def f(th):
        d = math.atan2(math.sin(th - center), math.cos(th - center))
        if abs(d) > width:
            return 0.0
        return amp * (0.5 + 0.5 * math.cos(PI * d / width))
    return f


def transform(ob, loc=(0, 0, 0), rot=(0, 0, 0), scale=None):
    ob.location = loc
    ob.rotation_euler = rot
    if scale is not None:
        ob.scale = (scale, scale, scale) if isinstance(scale, (int, float)) else scale
    return ob


def apply(ob):
    bpy.context.view_layer.update()
    me = ob.data
    me.transform(ob.matrix_world)
    ob.matrix_world = Matrix.Identity(4)
    return ob


def modifier_subsurf(ob, levels=2):
    m = ob.modifiers.new("subsurf", "SUBSURF")
    m.levels = levels
    m.render_levels = levels
    return ob


def bevel(ob, width=0.05, segments=4):
    m = ob.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.harden_normals = False
    return ob


# ----------------------------------------------------------------------------- materials
def _mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"]


def _tex_coord(nt):
    return nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]


GOLD = {
    # linear F0 reflectance, kept on the yellow side of gold (never orange)
    "24k": (1.0, 0.705, 0.33),
    "22k": (1.0, 0.725, 0.37),
    "21k": (0.985, 0.74, 0.40),
    "18k": (0.96, 0.765, 0.46),
}


def gold(k="18k", rough=0.11, satin=False):
    m, nt, b = _mat(f"gold-{k}-{rough}")
    b.inputs["Base Color"].default_value = (*GOLD[k], 1)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Specular Tint"].default_value = (1.0, 0.93, 0.8, 1)
    co = _tex_coord(nt)
    # micro variation in roughness: polished metal is never perfectly uniform
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 3.0
    nz.inputs["Detail"].default_value = 6
    nt.links.new(co, nz.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    base = 0.2 if satin else rough
    mr.inputs["To Min"].default_value = base * 0.75
    mr.inputs["To Max"].default_value = base * 1.35
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    # fine polishing marks
    nz2 = nt.nodes.new("ShaderNodeTexNoise")
    nz2.inputs["Scale"].default_value = 180.0
    nz2.inputs["Detail"].default_value = 2
    nt.links.new(co, nz2.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.03 if satin else 0.015
    bm.inputs["Distance"].default_value = 0.002
    nt.links.new(nz2.outputs["Fac"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def velvet(color, sheen=(1.0, 0.75, 0.8)):
    m, nt, b = _mat("velvet")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = 1.0
    b.inputs["Specular IOR Level"].default_value = 0.15
    b.inputs["Sheen Weight"].default_value = 1.0
    b.inputs["Sheen Roughness"].default_value = 0.35
    b.inputs["Sheen Tint"].default_value = (*sheen, 1)
    co = _tex_coord(nt)
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 260.0
    nt.links.new(co, nz.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.12
    nt.links.new(nz.outputs["Fac"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def silk(color, rough=0.3):
    m, nt, b = _mat("silk")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = 0.65
    b.inputs["Anisotropic"].default_value = 0.65
    b.inputs["Sheen Weight"].default_value = 0.5
    b.inputs["Sheen Roughness"].default_value = 0.25
    co = _tex_coord(nt)
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.inputs["Scale"].default_value = 400.0
    wv.inputs["Distortion"].default_value = 0.5
    nt.links.new(co, wv.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.03
    nt.links.new(wv.outputs["Fac"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def stone(base=(0.62, 0.55, 0.46), rough=0.75, scale=1.0):
    """Travertine-like stone: soft strata, colour drift and small pores."""
    m, nt, b = _mat("stone")
    co = _tex_coord(nt)
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.55 * scale, 0.55 * scale, 1.4 * scale)
    nt.links.new(co, mp.inputs["Vector"])
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 2.2
    nz.inputs["Detail"].default_value = 8
    nz.inputs["Distortion"].default_value = 0.6
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    lo = tuple(c * 0.86 for c in base)
    hi = tuple(min(1, c * 1.12) for c in base)
    e[0].position, e[0].color = 0.35, (*lo, 1)
    e[1].position, e[1].color = 0.68, (*hi, 1)
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    # pores
    vo = nt.nodes.new("ShaderNodeTexVoronoi")
    vo.inputs["Scale"].default_value = 14.0 / scale
    nt.links.new(co, vo.inputs["Vector"])
    pr = nt.nodes.new("ShaderNodeMapRange")
    pr.inputs["From Min"].default_value = 0.0
    pr.inputs["From Max"].default_value = 0.09
    pr.inputs["To Min"].default_value = 0.0
    pr.inputs["To Max"].default_value = 1.0
    nt.links.new(vo.outputs["Distance"], pr.inputs["Value"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.5
    nt.links.new(ramp.outputs["Color"], mix.inputs["A"])
    nt.links.new(pr.outputs["Result"], mix.inputs["B"])
    nt.links.new(mix.outputs["Result"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.25
    bm.inputs["Distance"].default_value = 0.05
    nt.links.new(pr.outputs["Result"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def plaster(color, rough=0.85):
    m, nt, b = _mat("plaster")
    co = _tex_coord(nt)
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.6
    nz.inputs["Detail"].default_value = 4
    nt.links.new(co, nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].color = (*(c * 0.96 for c in color), 1)
    e[1].color = (*(min(1, c * 1.03) for c in color), 1)
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = 0.3
    return m


def gloss(color=(0.006, 0.006, 0.006), rough=0.05):
    """Polished lacquer / obsidian surface."""
    m, nt, b = _mat("gloss")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = 0.55
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.02
    return m


def mirror_black(reflect=0.05, rough=0.03):
    """Black lacquer floor: a dim, sharp mirror with no diffuse or sheen component."""
    m = bpy.data.materials.new("mirror-black")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    out = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"][0]
    gl = nt.nodes.new("ShaderNodeBsdfGlossy")
    gl.inputs["Color"].default_value = (reflect, reflect, reflect * 0.95, 1)
    gl.inputs["Roughness"].default_value = rough
    nt.links.new(gl.outputs["BSDF"], out.inputs["Surface"])
    return m


def leather(color, rough=0.55):
    m, nt, b = _mat("leather")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    co = _tex_coord(nt)
    vo = nt.nodes.new("ShaderNodeTexVoronoi")
    vo.inputs["Scale"].default_value = 90.0
    nt.links.new(co, vo.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump")
    bm.inputs["Strength"].default_value = 0.08
    nt.links.new(vo.outputs["Distance"], bm.inputs["Height"])
    nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def hexrgb(h, gain=1.0):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # sRGB -> linear
    lin = [((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c]
    return tuple(min(1.0, v * gain) for v in lin)


# Brand palette (linear)
OBSIDIAN = hexrgb("#11100F")
BURGUNDY = hexrgb("#4A1025")
EMERALD = hexrgb("#174C3A")
CHAMPAGNE = hexrgb("#C6A46A")
IVORY = hexrgb("#F7F3EC")
TRAVERTINE = hexrgb("#d9cdb8")


# ----------------------------------------------------------------------------- lights & camera
def world(color=(0, 0, 0), strength=1.0):
    w = bpy.data.worlds.new("world")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength
    bpy.context.scene.world = w
    return w


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def area(loc, target=(0, 0, 0), size=40, power=2000, color=(1, 1, 1), shape="RECTANGLE", size_y=None, spread=180):
    ld = bpy.data.lights.new("area", "AREA")
    ld.energy = power
    ld.color = color
    ld.shape = shape
    ld.size = size
    ld.size_y = size_y or size
    ld.spread = math.radians(spread)
    ob = link(bpy.data.objects.new("area", ld))
    ob.location = loc
    look_at(ob, target)
    return ob


def sun(direction=(-0.5, -0.4, -0.75), strength=4.0, angle=1.0, color=(1.0, 0.95, 0.88)):
    ld = bpy.data.lights.new("sun", "SUN")
    ld.energy = strength
    ld.angle = math.radians(angle)
    ld.color = color
    ob = link(bpy.data.objects.new("sun", ld))
    ob.rotation_euler = Vector(direction).normalized().to_track_quat("-Z", "Y").to_euler()
    return ob


def spot(loc, target, power=3000, size=2.0, cone=30, blend=0.4, color=(1, 0.96, 0.9)):
    ld = bpy.data.lights.new("spot", "SPOT")
    ld.energy = power
    ld.shadow_soft_size = size
    ld.spot_size = math.radians(cone)
    ld.spot_blend = blend
    ld.color = color
    ob = link(bpy.data.objects.new("spot", ld))
    ob.location = loc
    look_at(ob, target)
    return ob


def camera(loc, target, lens=85, fstop=None, focus=None, shift=(0, 0)):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens
    cd.sensor_width = 36
    cd.shift_x, cd.shift_y = shift
    cd.clip_start = 0.5
    cd.clip_end = 20000
    ob = link(bpy.data.objects.new("cam", cd))
    ob.location = loc
    look_at(ob, target)
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        f = Vector(focus if focus is not None else target)
        cd.dof.focus_distance = (f - Vector(loc)).length
    bpy.context.scene.camera = ob
    return ob


def gobo_window(sun_dir, center=(0, 0, 0), dist=120, size=260, bars=3, frame=0.18, mat=None):
    """A large window frame between the sun and the set, casting architectural shadows."""
    d = Vector(sun_dir).normalized()
    p = Vector(center) - d * dist
    bm_ = bmesh.new()
    n = bars + 1
    pane = size / n
    for i in range(n + 1):  # vertical mullions
        x = -size / 2 + i * pane
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation((x, 0, 0)) @ Matrix.Diagonal((pane * frame, 1, size, 1)))
    for i in range(3):  # transoms
        z = -size / 2 + i * size / 2
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation((0, 0, z)) @ Matrix.Diagonal((size, 1, pane * frame, 1)))
    me = bpy.data.meshes.new("gobo")
    bm_.to_mesh(me)
    ob = link(bpy.data.objects.new("gobo", me))
    ob.location = p
    ob.rotation_euler = d.to_track_quat("Y", "Z").to_euler()
    ob.visible_camera = False
    ob.visible_glossy = False
    if mat:
        me.materials.append(mat)
    return ob


def card(loc, target, w=60, h=60, color=(1, 1, 1), emit=0.0, visible=False):
    """Bounce card / black flag. Seen in reflections only (not by the camera)."""
    m, nt, b = _mat("card")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = 0.9
    if emit:
        b.inputs["Emission Color"].default_value = (*color, 1)
        b.inputs["Emission Strength"].default_value = emit
    ob = mesh_obj("card", [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [(0, 1, 2, 3)], m, smooth=False, recalc=False)
    ob.location = loc
    look = Vector(target) - Vector(loc)
    ob.rotation_euler = look.to_track_quat("Z", "Y").to_euler()
    ob.visible_camera = visible
    ob.visible_shadow = False
    return ob


def exclude_from_light(emitters, excluded):
    """Light linking: the emitters light (and reflect in) everything except `excluded` objects."""
    recv = bpy.data.collections.new("receivers")
    ex = {o.name for o in excluded}
    for o in bpy.context.scene.objects:
        if o.type == "MESH" and o.name not in ex and o not in emitters:
            recv.objects.link(o)
    for e in emitters:
        e.light_linking.receiver_collection = recv


# ----------------------------------------------------------------------------- environment props
def backdrop(color_mat, width=600, depth=400, height=300, curve=80, z=0):
    """Infinity cove: floor that curves up into a back wall."""
    verts, nu = [], 48
    prof = []
    for i in range(nu):
        t = i / (nu - 1)
        s = t * (depth + curve * PI / 2 + height)
        if s < depth:
            prof.append((-depth / 2 + s, z))
        elif s < depth + curve * PI / 2:
            a = (s - depth) / curve
            prof.append((depth / 2 + math.sin(a) * curve, z + curve - math.cos(a) * curve))
        else:
            prof.append((depth / 2 + curve, z + curve + (s - depth - curve * PI / 2)))
    nv = 4
    for (y, zz) in prof:
        for j in range(nv):
            x = -width / 2 + width * j / (nv - 1)
            verts.append((x, y, zz))
    faces = grid_faces(nu, nv, False, False)
    ob = mesh_obj("backdrop", verts, faces, color_mat)
    return ob


def floor(mat, size=2000, z=0):
    return mesh_obj("floor", [(-size, -size, z), (size, -size, z), (size, size, z), (-size, size, z)], [(0, 1, 2, 3)], mat, smooth=False)


def box(mat, size=(10, 10, 10), loc=(0, 0, 0), rot=(0, 0, 0), bev=0.3, seg=5):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bev:
        bevel(ob, bev, seg)
    ob.data.shade_smooth()
    if mat:
        ob.data.materials.append(mat)
    return ob


def cylinder(mat, r=5, h=5, loc=(0, 0, 0), bev=0.3, verts=128, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(loc[0], loc[1], loc[2] + h / 2), rotation=rot)
    ob = bpy.context.object
    if bev:
        bevel(ob, bev, 5)
    ob.data.shade_smooth()
    if mat:
        ob.data.materials.append(mat)
    return ob


def arch(mat, w=24, h=34, d=8, loc=(0, 0, 0), rot=(0, 0, 0), opening=0.55):
    """Sculptural stone arch block (rectangle with a round-headed opening)."""
    bm_ = bmesh.new()
    ow = w * opening
    oh = h * 0.72
    n = 48
    outer, inner = [], []
    # Build the face as a ring of points: outline, then the opening, as two loops joined by a bridge.
    loop_o = [(-w / 2, 0), (w / 2, 0), (w / 2, h), (-w / 2, h)]
    loop_i = [(ow / 2, 0)]
    r = ow / 2
    for i in range(n + 1):
        a = i / n * PI
        loop_i.append((r * math.cos(a), oh - r + r * math.sin(a)))
    loop_i.append((-ow / 2, 0))
    # outline polygon: go around outer, but notch into the opening along the bottom
    poly = [(-w / 2, 0), (-ow / 2, 0)] + list(reversed(loop_i[1:-1]))[::-1][::-1]
    pts = [(-w / 2, 0), (-ow / 2, 0)]
    pts += [loop_i[k] for k in range(len(loop_i) - 2, 0, -1)]
    pts += [(ow / 2, 0), (w / 2, 0), (w / 2, h), (-w / 2, h)]
    vs = [bm_.verts.new((x, -d / 2, y)) for (x, y) in pts]
    f = bm_.faces.new(vs)
    bmesh.ops.triangulate(bm_, faces=[f])
    res = bmesh.ops.extrude_face_region(bm_, geom=bm_.faces[:])
    ext = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm_, verts=ext, vec=(0, d, 0))
    bmesh.ops.recalc_face_normals(bm_, faces=bm_.faces[:])
    me = bpy.data.meshes.new("arch")
    bm_.to_mesh(me)
    ob = link(bpy.data.objects.new("arch", me))
    ob.location, ob.rotation_euler = loc, rot
    bevel(ob, 0.35, 4)
    me.materials.append(mat)
    return ob


def heightfield(mat, size=(120, 80), res=(220, 150), loc=(0, 0, 0), fn=None, rot=(0, 0, 0)):
    """Displaced sheet, used for silk drapes and velvet folds."""
    nx, ny = res
    sx, sy = size
    verts = []
    for i in range(nx):
        for j in range(ny):
            x = -sx / 2 + sx * i / (nx - 1)
            y = -sy / 2 + sy * j / (ny - 1)
            verts.append((x, y, fn(x, y) if fn else 0))
    faces = grid_faces(nx, ny, False, False)
    ob = mesh_obj("sheet", verts, faces, mat)
    ob.location, ob.rotation_euler = loc, rot
    return ob


def silk_fn(seed=3, amp=2.2, freq=0.07, folds=((0.9, 0.0), (0.5, 1.3)), lift=None):
    """Soft, flowing folds: a few directional ridges with low-frequency noise."""
    rnd = random.Random(seed)
    offs = Vector((rnd.uniform(0, 100), rnd.uniform(0, 100), rnd.uniform(0, 100)))

    def f(x, y):
        h = 0.0
        for k, (w, ang) in enumerate(folds):
            u = x * math.cos(ang) + y * math.sin(ang)
            v = -x * math.sin(ang) + y * math.cos(ang)
            warp = noise.noise(Vector((u * 0.02, v * 0.02, k)) + offs) * 9
            ridge = math.sin((u + warp) * freq * (1 + 0.4 * k)) * 0.5 + 0.5
            h += w * amp * ridge ** 2.2 * (0.6 + 0.4 * noise.noise(Vector((v * 0.03, k, 2)) + offs))
        h += noise.noise(Vector((x * 0.05, y * 0.05, 7)) + offs) * amp * 0.25
        if lift:
            h += lift(x, y)
        return h
    return f


# ----------------------------------------------------------------------------- jewellery
def ring(mat, Ri=0.86, w=0.18, t=0.09, n=2.6, wfn=None, tfn=None, flat=None, segs=360, prof=48, name="ring"):
    """
    Parametric ring lying in the XY plane (axis = Z).
    Ri: inner radius, w: half-width (along Z), t: half-thickness (radial);
    wfn/tfn(theta) add to w/t; n: superellipse exponent of the cross-section (2 = round);
    flat: (theta, distance) flattens the outer surface to a plane (signet face).
    """
    verts = []
    for i in range(segs):
        th = TAU * i / segs
        ww = w + (wfn(th) if wfn else 0)
        tt = t + (tfn(th) if tfn else 0)
        cr = Vector((math.cos(th), math.sin(th), 0))
        for j in range(prof):
            ph = TAU * j / prof
            a, b = math.cos(ph), math.sin(ph)
            sx = math.copysign(abs(a) ** (2 / n), a)
            sz = math.copysign(abs(b) ** (2 / n), b)
            p = cr * (Ri + tt + tt * sx) + Vector((0, 0, ww * sz))
            if flat:
                d = Vector((math.cos(flat[0]), math.sin(flat[0]), 0))
                dd = p.dot(d)
                if dd > flat[1]:
                    p = p - d * (dd - flat[1])
            verts.append(p)
    return mesh_obj(name, verts, grid_faces(segs, prof, True, True), mat)


def frames_along(pts, closed=False):
    """Parallel-transport frames (T, N, B) along a polyline."""
    P = [Vector(p) for p in pts]
    n = len(P)
    T = []
    for i in range(n):
        if closed:
            d = P[(i + 1) % n] - P[(i - 1) % n]
        else:
            d = P[min(i + 1, n - 1)] - P[max(i - 1, 0)]
        T.append(d.normalized())
    up = Vector((0, 0, 1)) if abs(T[0].z) < 0.9 else Vector((1, 0, 0))
    N = [(up - T[0] * up.dot(T[0])).normalized()]
    for i in range(1, n):
        v = N[-1] - T[i] * N[-1].dot(T[i])
        N.append(v.normalized() if v.length > 1e-8 else N[-1])
    B = [T[i].cross(N[i]) for i in range(n)]
    return P, T, N, B


def tube(mat, pts, r=0.1, closed=False, prof=24, rfn=None, name="tube", caps=True):
    P, T, N, B = frames_along(pts, closed)
    n = len(P)
    verts = []
    for i in range(n):
        rr = r * (rfn(i / (n - 1)) if rfn else 1)
        for j in range(prof):
            a = TAU * j / prof
            verts.append(P[i] + (N[i] * math.cos(a) + B[i] * math.sin(a)) * rr)
    faces = grid_faces(n, prof, closed, True)
    if not closed and caps:
        c0 = len(verts)
        verts.append(P[0])
        verts.append(P[-1])
        for j in range(prof):
            faces.append((c0, (j + 1) % prof, j))
            faces.append((c0 + 1, (n - 1) * prof + j, (n - 1) * prof + (j + 1) % prof))
    return mesh_obj(name, verts, faces, mat)


def resample(pts, step, closed=False):
    P = [Vector(p) for p in pts]
    if closed:
        P = P + [P[0]]
    seg = [(P[i + 1] - P[i]).length for i in range(len(P) - 1)]
    total = sum(seg)
    out, s, i, acc = [], 0.0, 0, 0.0
    while s <= total and i < len(seg):
        while i < len(seg) and acc + seg[i] < s:
            acc += seg[i]
            i += 1
        if i >= len(seg):
            break
        t = (s - acc) / seg[i] if seg[i] > 0 else 0
        out.append(P[i].lerp(P[i + 1], t))
        s += step
    return out


def _link_template(length, width, r, nu=28, nv=10, flat=1.0):
    """Oval wire link centred at origin, long axis X, lying in XY (normal Z)."""
    a = (length - 2 * r) / 2
    b = (width - 2 * r) / 2
    st = a - b if a > b else 0
    path = []
    for i in range(nu):
        u = TAU * i / nu
        x = (st + b) * math.cos(u) if st == 0 else (math.copysign(st, math.cos(u)) + b * math.cos(u))
        y = b * math.sin(u)
        path.append(Vector((x, y, 0)))
    V = []
    for i in range(nu):
        p = path[i]
        tng = (path[(i + 1) % nu] - path[(i - 1) % nu]).normalized()
        nrm = Vector((0, 0, 1)).cross(tng).normalized()  # in-plane, outward-ish
        for j in range(nv):
            v = TAU * j / nv
            V.append(p + nrm * (r * math.cos(v)) + Vector((0, 0, r * flat * math.sin(v))))
    F = grid_faces(nu, nv, True, True)
    return np.array([tuple(v) for v in V]), F


def chain(mat, pts, style="cable", link_len=0.5, link_w=0.34, wire=0.065, closed=False, name="chain", tilt=0.95, per_turn=6):
    """
    Chain along a path. style: 'cable' (alternating 90°), 'rope' (twisted, overlapping links),
    'curb' (flattened, twisted links lying almost flat).
    """
    if style == "rope":
        step = link_len * 0.28
    elif style == "curb":
        step = link_len - 2.2 * wire
    else:
        step = link_len - 2.25 * wire
    P = resample(pts, step, closed)
    if len(P) < 3:
        return None
    P, T, N, B = frames_along(P, closed)
    tv, tf = _link_template(link_len, link_w, wire, flat=0.75 if style == "curb" else 1.0)
    allv, allf = [], []
    nt = len(tv)
    for i in range(len(P)):
        t, nn, bb = T[i], N[i], B[i]
        if style == "cable":
            ang = (PI / 2) * (i % 2)
            ax_long = t
            ax_w = nn * math.cos(ang) + bb * math.sin(ang)
        elif style == "curb":
            ang = 0.35 * (1 if i % 2 else -1)
            ax_long = (t * math.cos(ang) + nn * math.sin(ang)).normalized()
            ax_w = bb
        else:  # rope
            ang = TAU * i / per_turn
            radial = nn * math.cos(ang) + bb * math.sin(ang)
            ax_long = (t * math.cos(tilt) + radial * math.sin(tilt)).normalized()
            side = t.cross(radial).normalized()
            ax_w = side
        ax_n = ax_long.cross(ax_w).normalized()
        ax_w = ax_n.cross(ax_long).normalized()
        M = np.array([ax_long, ax_w, ax_n]).T  # columns
        v = tv @ M.T + np.array(P[i])
        allv.append(v)
        allf.extend([(a + i * nt, b + i * nt, c + i * nt, d + i * nt) for (a, b, c, d) in tf])
    V = np.concatenate(allv)
    return mesh_obj(name, V, allf, mat)


def lathe(mat, profile, segs=128, name="lathe", axis="Z"):
    """Revolve a (r, z) profile around Z."""
    verts = []
    m = len(profile)
    for i in range(segs):
        a = TAU * i / segs
        for (r, z) in profile:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    faces = grid_faces(segs, m, True, False)
    return mesh_obj(name, verts, faces, mat)


def teardrop(mat, H=1.6, R=0.46, segs=96, n=72):
    """Polished drop: tapers to a point at the top (z = 0) and rounds off at the base (z = -H)."""
    tc = 1 - R / H
    prof = []
    for i in range(n):
        t = i / (n - 1)
        if t < tc:
            r = R * math.sin(PI / 2 * t / tc) ** 1.7
        else:
            u = (t - tc) / (1 - tc)
            r = R * math.sqrt(max(0.0, 1 - u * u))
        prof.append((max(r, 0.0001), -H * t))
    return lathe(mat, prof, segs, "drop")


def hoop(mat, R=1.15, wire=0.11, arc=0.9, end=0.45, name="hoop"):
    """Tapered hoop in the XY plane: thick at the front (angle -pi/2), fine at the ends."""
    gap = TAU * (1 - arc)
    a0 = PI / 2 + gap / 2
    pts = [(R * math.cos(a0 + (TAU - gap) * k / 199), R * math.sin(a0 + (TAU - gap) * k / 199), 0) for k in range(200)]
    rf = lambda s: end + (1 - end) * math.sin(PI * s) ** 0.7
    parts = [tube(mat, pts, wire, prof=24, rfn=rf, name=name)]
    # ear post bridging part of the gap
    p0 = Vector(pts[-1])
    post = [p0.lerp(Vector(pts[0]), k / 9) for k in range(7)]
    parts.append(tube(mat, post, wire * end * 0.55, prof=10, name="post"))
    return join(parts, name)


def bail(mat, r=0.13, wire=0.035):
    pts = [(0, r * math.cos(a), r * math.sin(a)) for a in np.linspace(0, TAU, 40, endpoint=False)]
    return tube(mat, pts, wire, closed=True, prof=14, name="bail")


def coin(mat, R=0.95, h=0.09, rays=24):
    """Medal with raised rim, a softly domed sun at the centre and radiating rays (no lettering)."""
    prof = [(0.0001, h + 0.06)]
    for i in range(1, 12):
        r = 0.32 * R * i / 11
        prof.append((r, h + 0.06 * math.cos(PI / 2 * i / 11) ** 1.5))
    prof += [(0.34 * R, h + 0.005), (0.80 * R, h), (0.84 * R, h + 0.05), (0.90 * R, h + 0.075), (0.96 * R, h + 0.065),
             (0.995 * R, h + 0.03), (R, 0.0), (0.98 * R, -0.035), (0.6 * R, -0.04), (0.0001, -0.04)]
    base = lathe(mat, prof, 192, "coin")
    parts = [base]
    for k in range(rays):
        a = TAU * k / rays
        ln = (0.43 if k % 2 else 0.36) * R
        p0 = Vector((math.cos(a), math.sin(a), 0)) * (0.37 * R)
        p1 = Vector((math.cos(a), math.sin(a), 0)) * (0.37 * R + ln)
        pts = [p0.lerp(p1, s) + Vector((0, 0, h)) for s in np.linspace(0, 1, 12)]
        parts.append(tube(mat, pts, 0.016, prof=8, rfn=lambda s: 1.0 - 0.7 * s, name="ray"))
    return join(parts, "medal")


def join(objs, name="joined"):
    objs = [o for o in objs if o is not None]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    return ob


def minted_bar(mat, L=2.6, W=1.55, H=0.16, frame=True):
    """Minted bar: crisp slab with a raised inset border. Deliberately left unmarked."""
    slab = box(mat, (W, L, H), (0, 0, H / 2), bev=0.05, seg=4)
    parts = [slab]
    if frame:
        ix, iy = W / 2 - 0.13, L / 2 - 0.13
        pts = []
        for (x, y) in [(-ix, -iy), (ix, -iy), (ix, iy), (-ix, iy)]:
            pts.append((x, y, H + 0.004))
        loop = resample(pts, 0.02, closed=True)
        parts.append(tube(mat, loop, 0.012, closed=True, prof=8, name="frame"))
    for p in parts:
        bpy.context.view_layer.objects.active = p
        for m in p.modifiers:
            bpy.ops.object.modifier_apply(modifier=m.name)
    return join(parts, "minted-bar")


def cast_bar(mat, L=6.2, W=2.9, H=1.25, seed=5):
    """Cast bar: tapered sides, softened edges and a gently rippled, poured top. Unmarked."""
    nx, ny, nz = 60, 110, 14
    verts = []
    rnd = random.Random(seed)
    off = Vector((rnd.random() * 50, rnd.random() * 50, 0))
    bm_ = bmesh.new()
    bmesh.ops.create_cube(bm_, size=1.0)
    for v in bm_.verts:
        x, y, z = v.co
        k = 1.0 if z < 0 else 0.82  # taper toward the top
        v.co = Vector((x * W * k, y * L * (1.0 if z < 0 else 0.9), (z + 0.5) * H))
    me = bpy.data.meshes.new("cast")
    bm_.to_mesh(me)
    ob = link(bpy.data.objects.new("cast-bar", me))
    bevel(ob, 0.28, 6)
    modifier_subsurf(ob, 3)
    tex = bpy.data.textures.new("ripple", "CLOUDS")
    tex.noise_scale = 0.9
    d = ob.modifiers.new("disp", "DISPLACE")
    d.texture = tex
    d.strength = 0.012
    d.mid_level = 0.5
    ob.data.shade_smooth()
    ob.data.materials.append(mat)
    return ob


def bust(mat, H=30.0):
    """Jewellery display bust: a sloping shoulder line rising into a neck, flattened front-to-back."""
    nz, nu = 120, 128
    verts = []
    zs = []
    for i in range(nz):
        t = i / (nz - 1)
        z = H * t
        # half-widths of the elliptical section (x = across shoulders, y = front-back)
        neck = smoothstep(0.32, 0.62, t)
        rx = 13.0 * (1 - neck) + 3.7 * neck - 1.2 * (1 - t) ** 3
        ry = 5.6 * (1 - neck) + 3.5 * neck
        rx *= 1 + 0.06 * math.sin(PI * min(1, t / 0.3))
        zs.append((z, rx, ry))
    for (z, rx, ry) in zs:
        for j in range(nu):
            a = TAU * j / nu
            # chest sits slightly forward of the neck
            fy = 0.9 * max(0, math.sin(a)) * (1 - smoothstep(0.0, 0.55 * H, z))
            verts.append((rx * math.cos(a), (ry + fy) * math.sin(a), z))
    faces = grid_faces(nz, nu, False, True)
    # caps
    top = len(verts)
    verts.append((0, 0, H + 0.6))
    for j in range(nu):
        faces.append((top, (nz - 1) * nu + j, (nz - 1) * nu + (j + 1) % nu))
    bot = len(verts)
    verts.append((0, 0, 0))
    for j in range(nu):
        faces.append((bot, (j + 1) % nu, j))
    ob = mesh_obj("bust", verts, faces, mat)
    modifier_subsurf(ob, 1)
    return ob


def _trees(objs):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    return [(BVHTree.FromObject(o, dg), o.matrix_world.copy(), o.matrix_world.inverted()) for o in objs]


def _cast(tree, origin, direction):
    tr, mw, mi = tree
    o = mi @ Vector(origin)
    d = (mi.to_3x3() @ Vector(direction)).normalized()
    hit = tr.ray_cast(o, d)
    if hit[0] is None:
        return None, None
    n = (mi.to_3x3().transposed() @ hit[1]).normalized()
    return mw @ hit[0], n


def drape_on(objs, path_xy, z_from=200, offset=0.08, fallback=0.0):
    """Drop a path (x, y) straight down onto the given objects' surfaces (world space)."""
    trees = _trees([o for o in objs if o is not None])
    out = []
    for (x, y) in path_xy:
        best = None
        for t in trees:
            p, _ = _cast(t, (x, y, z_from), (0, 0, -1))
            if p is not None and (best is None or p.z > best.z):
                best = p
        z = (best.z if best is not None else fallback) + offset
        out.append(Vector((x, y, z)))
    return out


def wrap_on(obj, path, offset=0.08):
    """Project points horizontally onto an object from outside (towards its vertical axis)."""
    t = _trees([obj])[0]
    c = obj.matrix_world.translation
    out = []
    for p in path:
        p = Vector(p)
        d = Vector((c.x - p.x, c.y - p.y, 0)).normalized()
        hit, n = _cast(t, p - d * 40, d)
        out.append(p if hit is None else hit + n * offset)
    return out


def smooth_path(pts, it=3, closed=False):
    P = [Vector(p) for p in pts]
    for _ in range(it):
        Q = []
        n = len(P)
        for i in range(n):
            if not closed and (i == 0 or i == n - 1):
                Q.append(P[i])
            else:
                Q.append((P[(i - 1) % n] + P[i] * 2 + P[(i + 1) % n]) / 4)
        P = Q
    return P


def loose_loop(cx=0, cy=0, rx=8, ry=6, seed=1, wobble=0.18, n=400, rot=0.0):
    rnd = random.Random(seed)
    off = rnd.random() * 100
    pts = []
    for i in range(n):
        a = TAU * i / n
        k = 1 + wobble * noise.noise(Vector((math.cos(a) * 1.3 + off, math.sin(a) * 1.3, 0.5)))
        x, y = rx * math.cos(a) * k, ry * math.sin(a) * k
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        pts.append((cx + xr, cy + yr))
    return pts


def s_curve(p0, p1, amp=3.0, waves=1.0, n=300, seed=2):
    p0, p1 = Vector((*p0, 0)), Vector((*p1, 0))
    d = p1 - p0
    nrm = Vector((-d.y, d.x, 0)).normalized()
    out = []
    for i in range(n):
        t = i / (n - 1)
        p = p0.lerp(p1, t) + nrm * amp * math.sin(TAU * waves * t + seed)
        out.append((p.x, p.y))
    return out


# ----------------------------------------------------------------------------- render
def render(path, w, h, samples=256, exposure=0.0, look=None):
    sc = bpy.context.scene
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.cycles.samples = samples
    sc.view_settings.exposure = exposure
    if look:
        sc.view_settings.look = look
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
