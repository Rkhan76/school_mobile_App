# mitmproxy addon: rewrite requests to our own LAN IP back to 127.0.0.1.
# Needed because this laptop can't connect to its own LAN-facing IP (hairpin NAT
# not supported on this network) -- but 127.0.0.1 always works.
# Run with: mitmweb -s scripts/mitm-rewrite-host.py

LAN_HOST = "192.168.0.2"
LOOPBACK_HOST = "127.0.0.1"


def request(flow):
    if flow.request.pretty_host == LAN_HOST:
        flow.request.host = LOOPBACK_HOST
