# AI HR Decision Dashboard API

Base URL: `/api`. Every analytics endpoint accepts optional `department`; overview and employee records also accept `location`. The 90-day seeded dataset is deterministic.

| Method | Route | Response highlights |
|---|---|---|
| GET | `/health` | Dataset record counts and service state |
| GET | `/dashboard/overview` | `summary`, KPI cards, trends, department mix, filters |
| GET | `/employees` | Employee directory; filters: `department`, `location`, `risk_level` |
| GET | `/recruitment` or `/recruitment/summary` | Summary, funnel, sources, department mix, open roles, recent candidates |
| GET | `/recruitment/funnel`, `/sources`, `/candidates` | Focused recruitment datasets |
| GET | `/attendance/summary`, `/trends`, `/departments`, `/risks` | Attendance KPIs, daily trend, department comparison, employee risk list |
| GET | `/performance/summary`, `/distribution`, `/departments`, `/employees` | Performance, rating distribution, department data, top/coaching lists |
| GET | `/workforce/summary`, `/departments`, `/distribution`, `/attrition` | Headcount, distributions, engagement, attrition/risk data |
| GET | `/risks`, `/risks/departments`, `/risks/employees` | Deterministic department or employee risk evidence |
| GET | `/decision-center/insights` | Rules-based analytics cards for the Qwen-ready Decision Center |
| GET | `/ai/status` | Safe Qwen configuration status; never exposes credentials |
| GET | `/ai/insights` | Qwen-generated, evidence-ID-cited recommendations when configured |
| POST | `/ai/ask` | Body: `{ "question": "...", "department": "optional" }`; Qwen answer grounded in supplied analytics |

Example request:

```text
GET /api/risks?department=Sales
```

Example response:

```json
{
  "department": "Sales",
  "severity": "HIGH",
  "riskScore": 64,
  "signals": [
    { "metric": "attrition_rate", "value": 9.1, "companyAverage": 1.3 },
    { "metric": "attendance_rate", "value": 87.9, "companyAverage": 92.8 }
  ],
  "open_roles": 2
}
```

## Qwen decision-intelligence layer

`POST /ai/analyze/department` accepts `{ "department": "Sales" }` and returns one validated advisory insight. `POST /ai/analyze/company` returns a cached executive brief with three to five priorities. `GET /ai/insights` retrieves the company brief (or a department brief with `?department=`). `POST /ai/ask` accepts `{ "question": "...", "department": "optional" }`.

All Qwen calls receive a compact context: calculated company KPIs, relevant department comparison/risk facts, and a whitelist of evidence IDs. The system prompt prohibits invented facts and automatic employment decisions. Server validation rejects malformed JSON and any Qwen output that references an evidence ID outside that whitelist.

Insight schema: `title`, `severity`, `summary`, `reasoning[]`, `evidence_ids[]`, `possible_factors[]`, `recommended_actions[{action, priority, type}]`, `confidence` (0–1), and `limitations[]`. Company analysis adds `executive_summary` and `priorities[]`. Ask responses add `answer`, `evidence_ids[]`, `recommendations[]`, `limitations[]`, and `confidence`.

`/ai/insights` returns `analytics_only` and `/ai/ask` returns 503 when Qwen is not configured, unavailable, rate-limited, timed out, or emits invalid JSON. The rest of the dashboard continues to use deterministic evidence. The in-memory Qwen analysis cache lasts five minutes. EnterPro is not implemented.
