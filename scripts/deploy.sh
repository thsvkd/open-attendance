#!/usr/bin/env bash

set -euo pipefail

# Usage: ./scripts/deploy.sh
# Reads `PORT` and `NEXTAUTH_URL` (or `URL`) from environment or from an env file
# Default env file: repo-root/.env.local (override with ENV_FILE)

# Resolve project root (repo root is one level above this scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_ENV="$PROJECT_ROOT/.env.local"
ENV_FILE="${ENV_FILE:-$DEFAULT_ENV}"

usage() {
	cat <<EOF
Usage: ENV_FILE=.env ./scripts/deploy.sh

Environment variables used:
	URL        - public URL to bind ngrok to (e.g. benton-synchronistical-counterattractively.ngrok-free.dev)
	PORT       - local port to forward (e.g. 3000)
	NGROK_URL  - alternative name for URL
	NGROK_PORT - alternative name for PORT

You can also export URL and PORT in the env file and set ENV_FILE to point to it.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
	usage
	exit 0
fi

# Defaults for daemon control
DAEMON=false
KILL_DAEMON=false

PID_FILE="${PID_FILE:-$PROJECT_ROOT/.ngrok.pid}"
LOG_FILE="${LOG_FILE:-$PROJECT_ROOT/ngrok.log}"


if [ -f "$ENV_FILE" ]; then
	set -o allexport
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +o allexport
fi

# Allow multiple variable names and fallbacks; prefer NEXTAUTH_URL if present
URL="${URL:-${NGROK_URL:-${NEXTAUTH_URL:-}}}"
PORT="${PORT:-${NGROK_PORT:-}}"

# If NEXTAUTH_URL included a scheme (https://...), strip it for ngrok's --url
if [[ "$URL" == http://* || "$URL" == https://* ]]; then
	URL="${URL#http://}"
	URL="${URL#https://}"
fi

if [ -z "$URL" ]; then
	echo "Error: URL not set. Set URL in $ENV_FILE or export URL env var." >&2
	usage
	exit 1
fi

if [ -z "$PORT" ]; then
	echo "Error: PORT not set. Set PORT in $ENV_FILE or export PORT env var." >&2
	usage
	exit 1
fi

# Parse args for daemon/kill
while [[ $# -gt 0 ]]; do
	case "$1" in
		-d|--daemon)
			DAEMON=true
			shift
			;;
		-k|--kill-daemon|--kill)
			KILL_DAEMON=true
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			# ignore unknown here; earlier help handled
			shift
			;;
	esac
done

if [ "$KILL_DAEMON" = true ]; then
	if [ -f "$PID_FILE" ]; then
		PID=$(cat "$PID_FILE" 2>/dev/null || true)
		if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
			echo "Stopping ngrok (pid $PID)"
			kill "$PID" && sleep 1
			if kill -0 "$PID" 2>/dev/null; then
				echo "PID $PID still running; sending SIGKILL"
				kill -9 "$PID" || true
			fi
			rm -f "$PID_FILE"
			echo "Stopped."
			exit 0
		else
			echo "No running ngrok process found for PID in $PID_FILE. Cleaning up." >&2
			rm -f "$PID_FILE"
			exit 1
		fi
	else
		echo "PID file not found at $PID_FILE; no daemon to kill." >&2
		exit 1
	fi
fi

echo "Starting ngrok with URL=$URL and PORT=$PORT"

if [ "$DAEMON" = true ]; then
	if [ -f "$PID_FILE" ]; then
		OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
		if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
			echo "ngrok daemon already running with PID $OLD_PID (PID file: $PID_FILE)" >&2
			exit 1
		else
			rm -f "$PID_FILE"
		fi
	fi

	echo "Launching ngrok in background; logging to $LOG_FILE; pidfile: $PID_FILE"
	nohup ngrok http --url="$URL" "$PORT" >"$LOG_FILE" 2>&1 &
	NGROK_PID=$!
	# Give it a moment to start
	sleep 0.5
	if kill -0 "$NGROK_PID" 2>/dev/null; then
		echo "$NGROK_PID" > "$PID_FILE"
		echo "ngrok started (pid $NGROK_PID)"
		exit 0
	else
		echo "Failed to start ngrok; see $LOG_FILE" >&2
		exit 1
	fi
else
	exec ngrok http --url="$URL" "$PORT"
fi