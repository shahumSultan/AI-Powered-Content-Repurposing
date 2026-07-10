import pytest
from fastapi import HTTPException

from routers.auth import _validate_password


def test_valid_password_passes():
    _validate_password("GoodPass1")  # no exception
    _validate_password("Another1Valid")
    _validate_password("Xy1abcde")


@pytest.mark.parametrize(
    "password",
    [
        "Short1A",          # 7 chars — too short
        "alllowercase1",    # no uppercase
        "ALLUPPERCASE1",    # no lowercase
        "NoNumbersHere",    # no digit
        "",                 # empty
    ],
)
def test_invalid_password_raises_400(password):
    with pytest.raises(HTTPException) as exc_info:
        _validate_password(password)
    assert exc_info.value.status_code == 400
