"""
Render the LA Luxury Gold image library with Blender Cycles.

  pip install bpy            # Blender as a Python module (Python 3.13)
  python tools/studio/render.py OUTDIR [--preview] [--force] [filter ...]

Writes OUTDIR/<key>.png for every job whose key contains one of the filters (all jobs if none).
--preview renders at 30% size with few samples for composition checks.
Existing files are skipped unless --force is given. Convert with `node tools/studio/optimise.cjs`.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib as L  # noqa: E402
import scenes  # noqa: E402


def main(argv):
    out = argv[0]
    preview = "--preview" in argv
    force = "--force" in argv or preview
    filters = [a for a in argv[1:] if not a.startswith("--")]
    keys = [k for k in scenes.JOBS if not filters or any(f in k for f in filters)]
    print(f"{len(keys)} job(s)")
    for key in keys:
        j = scenes.JOBS[key]
        path = os.path.join(out, key + ".png")
        if os.path.exists(path) and not force:
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        t = time.time()
        L.reset()
        scenes.POST_BUILD.clear()
        j["fn"]()
        for cb in scenes.POST_BUILD:
            cb()
        s = 0.3 if preview else 1.0
        L.render(path, int(j["w"] * s), int(j["h"] * s), 24 if preview else j["samples"])
        print(f"DONE {key} {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
