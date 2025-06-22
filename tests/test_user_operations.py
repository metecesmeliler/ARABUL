"""
Smoke-tests the two most used DB helpers – get_user_rating and
calculate_bulk_average_ratings – by monkey-patching `get_db_connection`
so **no** real MySQL server is required.
"""
from contextlib import contextmanager
from types import SimpleNamespace
import builtins
import pytest

import user_operations


class _Cursor:
    def __init__(self):
        self._result = None

    def execute(self, sql, params=None):
        sql_clean = sql.strip().upper()          # ← strip leading whitespace
        if sql_clean.startswith("SELECT RATING"):
            # single-row result for get_user_rating
            self._result = [(4,)]
        elif "FROM RATINGS" in sql_clean and "AVG(RATING)" in sql_clean:
            # multi-row result for calculate_bulk_average_ratings
            self._result = [("SUP123", 4.5, 2)]
        else:
            self._result = []

    def fetchone(self):
        return self._result[0] if self._result else None

    def fetchall(self):
        return self._result or []

    def close(self):
        pass


class _Conn(SimpleNamespace):
    def __init__(self):
        super().__init__(cursor=lambda: _Cursor(),
                         commit=lambda: None,
                         rollback=lambda: None,
                         is_connected=lambda: False,
                         close=lambda: None)


@contextmanager
def _fake_conn_ctx():
    yield _Conn()


@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    # override for **all** tests in this module
    monkeypatch.setattr(user_operations, "get_db_connection", _fake_conn_ctx)
    yield


def test_get_user_rating():
    result = user_operations.get_user_rating(42, "SUP123")
    assert result == {"rating": 4}


def test_bulk_average_ratings():
    res = user_operations.calculate_bulk_average_ratings(["SUP123"])
    assert res == [{"supplier_id": "SUP123", "average_rating": 4.5,
                    "count": 2}]
