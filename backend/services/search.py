"""
Arc AI - Web Search Service (Tavily)
Uses Tavily AI Search API — built for AI agents.
Returns clean, AI-ready search results as context.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TAVILY_KEY = os.getenv("TAVILY_API_KEY", "")

# Keywords that auto-trigger search in general/chat mode
SEARCH_TRIGGERS = [
    "latest", "recent", "news", "current", "today", "now", "update",
    "happened", "found", "discovered", "reported", "announced",
    "2024", "2025", "2026",
    "is there", "are there", "any ", "what is the", "who is", "where is",
    "when did", "how many", "sunken", "accident", "incident", "event",
    "weather", "price", "stock", "score", "result", "winner",
    "breaking", "trending", "rumor", "confirmed", "release",
]

def needs_search(message: str) -> bool:
    """Heuristic: decide if this query needs a live web search."""
    lowered = message.lower()
    return any(trigger in lowered for trigger in SEARCH_TRIGGERS)


async def web_search(query: str) -> str:
    """
    Search the web via Tavily AI Search API.
    Returns a clean formatted string of results for AI context.
    Falls back gracefully if API key is missing or request fails.
    """
    if not TAVILY_KEY:
        return ""

    payload = {
        "api_key":              TAVILY_KEY,
        "query":                query,
        "search_depth":         "advanced",   # deeper, more accurate results
        "include_answer":       True,          # Tavily's own AI answer summary
        "include_raw_content":  False,
        "max_results":          6,
        "include_images":       False,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            if resp.status_code != 200:
                return ""

            data = resp.json()
            sections = []

            # ── Tavily's built-in AI answer (most concise & accurate) ──────────
            answer = data.get("answer", "")
            if answer:
                sections.append(f"📌 **Quick Answer:** {answer}")

            # ── Individual search results ──────────────────────────────────────
            results = data.get("results", [])
            if results:
                sections.append("**Sources:**")
                for r in results:
                    title   = r.get("title", "Untitled")
                    url     = r.get("url", "")
                    content = r.get("content", "").strip()
                    score   = r.get("score", 0)

                    # Only include reasonably relevant results
                    if score < 0.2:
                        continue

                    # Truncate long snippets
                    snippet = content[:300] + "…" if len(content) > 300 else content
                    sections.append(f"• **{title}**\n  {snippet}\n  🔗 {url}")

            if not sections:
                return ""

            return "\n\n".join(sections)

    except Exception:
        return ""