"""Compatibility shim — the Operator adapter moved to
src/integrations/operator/rstack_sdlc.py as part of the SDLC layer restructure.

Operator discovers extensions via operator.json's "extensions" directory, so this
loader keeps existing installs working by re-exporting every public symbol from
the real module. Will be removed in v2.0.

owner: RStack developed by Richardson Gunde
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

_REAL = Path(__file__).resolve().parents[1] / "src" / "integrations" / "operator" / "rstack_sdlc.py"
_spec = importlib.util.spec_from_file_location("rstack_sdlc_impl", _REAL)
if _spec is None or _spec.loader is None:  # pragma: no cover
    raise ImportError(f"cannot load relocated Operator adapter: {_REAL}")
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

globals().update({k: v for k, v in vars(_mod).items() if not k.startswith("_")})
