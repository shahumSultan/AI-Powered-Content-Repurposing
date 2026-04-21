"""
SSRF protection — reject URLs that target private/internal infrastructure.
"""
import ipaddress
from urllib.parse import urlparse


_BLOCKED_HOSTS = frozenset({
    "localhost",
    "metadata.google.internal",
})

_BLOCKED_PREFIXES = ("169.254.", "100.64.", "192.168.", "10.", "172.")


def assert_safe_url(url: str) -> None:
    """Raise ValueError if the URL could reach internal infrastructure."""
    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError("Malformed URL")

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs are allowed")

    hostname = (parsed.hostname or "").lower().strip("[]")
    if not hostname:
        raise ValueError("URL has no hostname")

    if hostname in _BLOCKED_HOSTS:
        raise ValueError("Internal URLs are not allowed")

    # Try to parse as IP address
    try:
        ip = ipaddress.ip_address(hostname)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValueError("Internal IP addresses are not allowed")
    except ValueError as exc:
        if "Internal" in str(exc) or "not allowed" in str(exc):
            raise
        # Not an IP — check string prefixes for common private ranges
        for prefix in _BLOCKED_PREFIXES:
            if hostname.startswith(prefix):
                raise ValueError("Internal IP ranges are not allowed")
