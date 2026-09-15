"""Qwen reasoning layer: compact analytics in, validated advisory intelligence out."""
import json, logging, os, time
from dataclasses import dataclass
from typing import Literal
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session
from . import analytics

load_dotenv()
logger = logging.getLogger("hr_dashboard.qwen")
DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
SEVERITIES = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

@dataclass(frozen=True)
class QwenConfig:
    enabled: bool; api_key: str | None; model: str; base_url: str; timeout_seconds: float
    @classmethod
    def from_environment(cls):
        return cls(os.getenv("AI_ENABLED", "true").lower()=="true", os.getenv("QWEN_API_KEY"), os.getenv("QWEN_MODEL", "qwen-plus"), os.getenv("QWEN_BASE_URL", DEFAULT_BASE_URL), float(os.getenv("QWEN_TIMEOUT_SECONDS", "20")))

class Recommendation(BaseModel):
    action: str = Field(min_length=8, max_length=280)
    priority: SEVERITIES
    type: Literal["INVESTIGATE", "REVIEW", "MONITOR", "PLAN"]

class Insight(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    severity: SEVERITIES
    summary: str = Field(min_length=12, max_length=400)
    reasoning: list[str] = Field(min_length=1, max_length=5)
    evidence_ids: list[str] = Field(min_length=1, max_length=6)
    possible_factors: list[str] = Field(max_length=4)
    recommended_actions: list[Recommendation] = Field(min_length=1, max_length=4)
    confidence: float = Field(ge=0, le=1)
    limitations: list[str] = Field(min_length=1, max_length=4)

class CompanyAnalysis(BaseModel):
    executive_summary: str = Field(min_length=12, max_length=550)
    priorities: list[Insight] = Field(min_length=1, max_length=5)
    limitations: list[str] = Field(min_length=1, max_length=4)

class AskResponse(BaseModel):
    answer: str = Field(min_length=12, max_length=700)
    evidence_ids: list[str] = Field(min_length=1, max_length=8)
    recommendations: list[str] = Field(max_length=4)
    limitations: list[str] = Field(min_length=1, max_length=4)
    confidence: float = Field(ge=0, le=1)

def _department_context(db: Session, department: str, company: dict, risk: dict) -> dict:
    people=analytics.filtered_people(db, department); attendance=analytics.attendance(db, department)["summary"]; performance=analytics.performance(db, department)["summary"]
    exits=sum(p.employment_status=="Exited" for p in people)
    return {"name":department,"headcount":len(people),"attendanceRate":attendance["attendance_rate"],"lateRate":attendance["late_rate"],"averagePerformance":performance["average_performance"],"averageEngagement":round(sum(p.engagement_score for p in people)/len(people),1) if people else 0,"attritionRate":analytics.pct(exits,len(people)),"riskScore":risk["riskScore"],"severity":risk["severity"],"openRoles":risk["open_roles"]}

def build_context(db: Session, department: str | None = None) -> dict:
    company=analytics.overview(db)["summary"]; risks=analytics.risks(db); risk_by_department={r["department"]:r for r in risks}
    company_facts={key:company[key] for key in ("totalEmployees","activeEmployees","attendanceRate","averagePerformance","attritionRate","averageEngagement","openRoles","activeCandidates")}
    if department:
        risk=risk_by_department.get(department)
        if not risk: raise ValueError("Unknown department")
        department_data=_department_context(db,department,company,risk)
        evidence=[{"id":f"{department}:{s['metric']}","label":f"{department} {s['metric'].replace('_',' ')}","value":s["value"],"benchmark":s["companyAverage"],"direction":"negative" if (s["metric"] in ("attrition_rate","late_rate") and s["value"]>s["companyAverage"]) or (s["metric"] not in ("attrition_rate","late_rate") and s["value"]<s["companyAverage"]) else "neutral"} for s in risk["signals"]]
        evidence += [{"id":f"{department}:risk_score","label":f"{department} risk score","value":risk["riskScore"],"benchmark":None,"direction":"negative"},{"id":f"{department}:open_roles","label":f"{department} open roles","value":risk["open_roles"],"benchmark":None,"direction":"neutral"}]
        return {"scope":{"type":"department","name":department},"company":company_facts,"department":department_data,"risk":{"riskScore":risk["riskScore"],"severity":risk["severity"],"signals":risk["signals"]},"evidence":evidence}
    departments=[_department_context(db,r["department"],company,r) for r in risks[:5]]
    evidence=[{"id":f"{d['name']}:risk_score","label":f"{d['name']} risk score","value":d["riskScore"],"benchmark":None,"direction":"negative"} for d in departments]
    for d in departments:
        evidence += [{"id":f"{d['name']}:attendance_rate","label":f"{d['name']} attendance rate","value":d["attendanceRate"],"benchmark":company["attendanceRate"],"direction":"negative" if d["attendanceRate"]<company["attendanceRate"] else "neutral"},{"id":f"{d['name']}:attrition_rate","label":f"{d['name']} attrition rate","value":d["attritionRate"],"benchmark":company["attritionRate"],"direction":"negative" if d["attritionRate"]>company["attritionRate"] else "neutral"}]
    return {"scope":{"type":"company","name":"PeoplePulse"},"company":company_facts,"department_comparisons":departments,"top_risks":[{"department":r["department"],"severity":r["severity"],"riskScore":r["riskScore"],"openRoles":r["open_roles"]} for r in risks[:5]],"evidence":evidence}

class QwenService:
    def __init__(self, config: QwenConfig | None = None):
        self.config=config or QwenConfig.from_environment(); self._cache={}; self.cache_seconds=300
    @property
    def available(self): return self.config.enabled and bool(self.config.api_key)
    def status(self): return {"enabled":self.config.enabled,"configured":bool(self.config.api_key),"available":self.available,"status":"available" if self.available else "analytics_only","provider":"Qwen" if self.available else "Qwen (not configured)","model":self.config.model if self.available else None}
    def _cached(self, key):
        item=self._cache.get(key)
        return item[1] if item and time.monotonic()-item[0]<self.cache_seconds else None
    def _store(self,key,value): self._cache[key]=(time.monotonic(),value); return value
    def _request(self, schema: str, payload: dict, request_type: str):
        if not self.available: raise RuntimeError("Qwen is not configured")
        try:
            from openai import OpenAI
        except ImportError as error: raise RuntimeError("Qwen client dependency is missing") from error
        ids=[x["id"] for x in payload["evidence"]]
        system="""You are Qwen acting as an enterprise HR Decision Intelligence Analyst. Reason only from the structured application facts. Never invent employee/company facts, percentages, counts, dates, causes, or policy details. Distinguish supplied facts from cautious interpretation. Cite only exact evidence_ids supplied. If evidence is insufficient, say so in limitations. Recommendations are advisory only and must be INVESTIGATE, REVIEW, MONITOR, or PLAN actions; never recommend automatic termination, promotion, demotion, compensation changes, rejection, or hiring decisions. Return only valid JSON matching the requested schema."""
        prompt={"task":request_type,"json_schema":schema,"facts":payload,"allowed_evidence_ids":ids}
        start=time.monotonic(); last_error=None
        for attempt in range(2):
            try:
                client=OpenAI(api_key=self.config.api_key,base_url=self.config.base_url,timeout=self.config.timeout_seconds)
                response=client.chat.completions.create(model=self.config.model,temperature=.1,max_tokens=1300,messages=[{"role":"system","content":system},{"role":"user","content":json.dumps(prompt,separators=(",",":"))}])
                content=response.choices[0].message.content or "{}"
                logger.info("qwen_request_success type=%s model=%s latency_ms=%d",request_type,self.config.model,(time.monotonic()-start)*1000)
                return content, ids
            except Exception as error:
                last_error=error
                if attempt==0: time.sleep(.35)
        logger.warning("qwen_request_failed type=%s model=%s latency_ms=%d error=%s",request_type,self.config.model,(time.monotonic()-start)*1000,type(last_error).__name__)
        raise RuntimeError("Qwen request failed") from last_error
    @staticmethod
    def _validate(model, content, allowed_ids):
        try: result=model.model_validate_json(content)
        except ValidationError as error: raise RuntimeError("Qwen returned malformed structured output") from error
        insights=result.priorities if isinstance(result,CompanyAnalysis) else result.insights if hasattr(result,"insights") else [result]
        for item in insights:
            if not set(item.evidence_ids).issubset(allowed_ids): raise RuntimeError("Qwen referenced unsupported evidence")
        if isinstance(result,AskResponse) and not set(result.evidence_ids).issubset(allowed_ids): raise RuntimeError("Qwen referenced unsupported evidence")
        return result
    def analyze_department(self, db, department):
        context=build_context(db,department); key=("department",department); cached=self._cached(key)
        if cached:return {"cached":True,"context":context,**cached.model_dump()}
        schema='{"title":string,"severity":"LOW|MEDIUM|HIGH|CRITICAL","summary":string,"reasoning":[string],"evidence_ids":[string],"possible_factors":[string],"recommended_actions":[{"action":string,"priority":"LOW|MEDIUM|HIGH|CRITICAL","type":"INVESTIGATE|REVIEW|MONITOR|PLAN"}],"confidence":number_0_to_1,"limitations":[string]}'
        content,ids=self._request(schema,context,"department_analysis"); result=self._validate(Insight,content,ids)
        return {"cached":False,"context":context,**self._store(key,result).model_dump()}
    def analyze_company(self, db):
        context=build_context(db); key=("company",); cached=self._cached(key)
        if cached:return {"cached":True,"context":context,**cached.model_dump()}
        schema='{"executive_summary":string,"priorities":[Insight],"limitations":[string]} where Insight follows title,severity,summary,reasoning,evidence_ids,possible_factors,recommended_actions,confidence,limitations.'
        content,ids=self._request(schema,context,"company_analysis"); result=self._validate(CompanyAnalysis,content,ids)
        return {"cached":False,"context":context,**self._store(key,result).model_dump()}
    def ask(self, db, question, department=None):
        context=build_context(db,department); schema='{"answer":string,"evidence_ids":[string],"recommendations":[string],"limitations":[string],"confidence":number_0_to_1}'
        content,ids=self._request(schema,{**context,"question":question},"hr_question"); result=self._validate(AskResponse,content,ids)
        return {"context":context,**result.model_dump()}
    answer = ask

