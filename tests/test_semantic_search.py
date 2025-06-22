import pytest
import numpy as np
from services.chromadb_service import semantic_search

# ───────── Dummy stand-ins ──────────
class DummyModel:
    def __init__(self, vector):
        self.vector = vector

    def encode(self, _query):
        # return a numpy array so .tolist() exists
        return np.array(self.vector)


class DummyCollection:
    """Mimic ChromaDB .query() output structure."""
    def __init__(self, faux_result):
        self.faux_result = faux_result

    def query(self, *, query_embeddings, n_results):
        assert isinstance(query_embeddings, list) and len(query_embeddings) == 1
        return self.faux_result


# ───────── Fixtures ──────────
@pytest.fixture
def good_raw():
    """Three hits, all WITHIN threshold (distance <=0.8)."""
    return {
        "ids":        [["A", "B", "C"]],
        "distances":  [[0.10, 0.20, 0.30]],
        "documents":  [["docA", "docB", "docC"]],
        "metadatas":  [[{}, {}, {}]],
    }


@pytest.fixture
def over_thresh_raw():
    """All hits OUTSIDE threshold (distance >0.8)."""
    return {
        "ids":        [["X", "Y", "Z"]],
        "distances":  [[0.95, 0.93, 0.90]],
        "documents":  [["x", "y", "z"]],
        "metadatas":  [[{}, {}, {}]],
    }


@pytest.fixture
def empty_raw():
    return {
        "ids":        [[]],
        "distances":  [[]],
        "documents":  [[]],
        "metadatas":  [[]],
    }


# ───────── Test cases ──────────
def test_semantic_search_ok(good_raw):
    model = DummyModel([1, 0, 0])
    coll  = DummyCollection(good_raw)

    results, status = semantic_search(
        "query",
        top_k=3,
        _model=model,
        _collection=coll,
    )

    assert status == "ok"
    assert [r["id"] for r in results] == ["A", "B", "C"]
    assert [r["distance"] for r in results] == pytest.approx([0.10, 0.20, 0.30], rel=1e-6)


def test_semantic_search_threshold(over_thresh_raw):
    model = DummyModel([0, 1, 0])
    coll  = DummyCollection(over_thresh_raw)

    results, status = semantic_search(
        "query",
        top_k=2,  # any value; nothing should pass threshold
        _model=model,
        _collection=coll,
    )

    assert status == "threshold"
    assert results == []


def test_semantic_search_no_hits(empty_raw):
    model = DummyModel([0, 0, 1])
    coll  = DummyCollection(empty_raw)

    results, status = semantic_search(
        "query",
        top_k=5,
        _model=model,
        _collection=coll,
    )

    assert status == "no_hits"
    assert results == []
