from datetime import date
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from . import analytics
from .database import get_db, init_db, SessionLocal
from .models import Attendance, Candidate, Employee, Performance
from .seed import seed
from .ai_service import QwenService

app = FastAPI(title="AI HR Decision Dashboard API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
qwen_service = QwenService()

class AIQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    department: str | None = None

@app.on_event("startup")
def startup():
    init_db()
    with SessionLocal() as db: seed(db)

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    return {"status":"ok","employees":db.query(Employee).count(),"attendance_records":db.query(Attendance).count(),"performance_records":db.query(Performance).count(),"candidates":db.query(Candidate).count(),"mode":"deterministic_mock"}

@app.get("/api/dashboard/overview")
def dashboard_overview(department: str | None = None, location: str | None = None, db: Session = Depends(get_db)):
    result=analytics.overview(db,department,location); s=result["summary"]
    risks=analytics.risks(db,department)
    result["kpis"]=[{"label":"Total workforce","value":s["totalEmployees"],"delta":f"{s['activeEmployees']} active employees","tone":"blue"},{"label":"At-risk departments","value":len([r for r in risks if r['severity'] in ('HIGH','CRITICAL')]),"delta":"Derived workforce risk","tone":"red"},{"label":"Avg. attendance","value":f"{s['attendanceRate']}%","delta":f"{s['lateRate']}% late rate","tone":"teal"},{"label":"Avg. performance","value":f"{s['averagePerformance']}/5","delta":f"{s['averageEngagement']} engagement","tone":"green"},{"label":"Open roles","value":s["openRoles"],"delta":f"{s['activeCandidates']} active candidates","tone":"purple"},{"label":"Attrition rate","value":f"{s['attritionRate']}%","delta":f"{s['employeesOnNotice']} on notice","tone":"orange"}]
    return result

@app.get("/api/employees")
def employees(department: str | None = None, location: str | None = None, risk_level: str | None = None, db: Session = Depends(get_db)):
    rows=analytics.filtered_people(db,department,location); severity={r["department"]:r["severity"].lower() for r in analytics.risks(db,department)}
    result=[{"id":e.employee_id,"employee_id":e.employee_id,"name":e.full_name,"full_name":e.full_name,"email":e.email,"department":e.department,"location":e.location,"role":e.role,"manager":e.manager,"tenure_months":round((date(2026,9,13)-e.join_date).days/30),"employment_status":e.employment_status,"engagement_score":e.engagement_score,"risk_level":severity.get(e.department,"low")} for e in rows]
    return [e for e in result if not risk_level or e["risk_level"]==risk_level]

@app.get("/api/recruitment")
@app.get("/api/recruitment/summary")
def recruitment_summary(department: str | None = None, db: Session = Depends(get_db)): return analytics.recruitment(db,department)
@app.get("/api/recruitment/funnel")
def recruitment_funnel(department: str | None = None, db: Session = Depends(get_db)): return analytics.recruitment(db,department)["funnel"]
@app.get("/api/recruitment/sources")
def recruitment_sources(department: str | None = None, db: Session = Depends(get_db)): return analytics.recruitment(db,department)["sources"]
@app.get("/api/recruitment/candidates")
def recruitment_candidates(department: str | None = None, db: Session = Depends(get_db)): return analytics.recruitment(db,department)["recent_candidates"]

@app.get("/api/attendance/summary")
def attendance_summary(department: str | None = None, db: Session = Depends(get_db)): return analytics.attendance(db,department)["summary"]
@app.get("/api/attendance/trends")
def attendance_trends(department: str | None = None, db: Session = Depends(get_db)): return analytics.attendance(db,department)["trends"]
@app.get("/api/attendance/departments")
def attendance_departments(department: str | None = None, db: Session = Depends(get_db)): return analytics.attendance(db,department)["departments"]
@app.get("/api/attendance/risks")
def attendance_risks(department: str | None = None, db: Session = Depends(get_db)): return analytics.attendance(db,department)["risks"]

@app.get("/api/performance/summary")
def performance_summary(department: str | None = None, db: Session = Depends(get_db)): return analytics.performance(db,department)["summary"]
@app.get("/api/performance/distribution")
def performance_distribution(department: str | None = None, db: Session = Depends(get_db)): return analytics.performance(db,department)["distribution"]
@app.get("/api/performance/departments")
def performance_departments(department: str | None = None, db: Session = Depends(get_db)): return analytics.performance(db,department)["departments"]
@app.get("/api/performance/employees")
def performance_employees(department: str | None = None, db: Session = Depends(get_db)): return analytics.performance(db,department)

@app.get("/api/workforce/summary")
def workforce_summary(department: str | None = None, db: Session = Depends(get_db)): return analytics.workforce(db,department)["summary"]
@app.get("/api/workforce/departments")
def workforce_departments(department: str | None = None, db: Session = Depends(get_db)): return analytics.workforce(db,department)["departments"]
@app.get("/api/workforce/distribution")
def workforce_distribution(department: str | None = None, db: Session = Depends(get_db)): return analytics.workforce(db,department)["distribution"]
@app.get("/api/workforce/attrition")
def workforce_attrition(department: str | None = None, db: Session = Depends(get_db)):
    return [{"department":r["department"],"severity":r["severity"],"risk_score":r["riskScore"],"attrition_rate":r["signals"][0]["value"]} for r in analytics.risks(db,department)]

@app.get("/api/risks")
@app.get("/api/risks/departments")
def department_risks(department: str | None = None, db: Session = Depends(get_db)): return analytics.risks(db,department)
@app.get("/api/risks/employees")
def employee_risks(department: str | None = None, db: Session = Depends(get_db)): return analytics.attendance(db,department)["risks"]

@app.get("/api/decision-center/insights")
def decision_signals(department: str | None = None, db: Session = Depends(get_db)):
    risks=analytics.risks(db,department)
    return [{"id":r["department"].lower().replace(' ', '-'),"type":"Analytics signal","priority":r["severity"].title(),"title":f"{r['department']} workforce risk","detail":"Derived from attendance, attrition, engagement, performance, and recruitment pressure.","evidence":[f"{x['metric'].replace('_',' ')}: {x['value']}" for x in r['signals']],"risk_score":r["riskScore"],"action":"Review department evidence"} for r in risks[:3]]

@app.get("/api/ai/status")
def ai_status(): return qwen_service.status()

class DepartmentAnalysisRequest(BaseModel):
    department: str

@app.post("/api/ai/analyze/department")
def analyze_department(request: DepartmentAnalysisRequest, db: Session = Depends(get_db)):
    if not qwen_service.available: raise HTTPException(status_code=503, detail="Qwen is not configured; deterministic risk evidence remains available.")
    try: return qwen_service.analyze_department(db, request.department)
    except ValueError as error: raise HTTPException(status_code=404, detail=str(error))
    except RuntimeError as error: raise HTTPException(status_code=502, detail=str(error))

@app.post("/api/ai/analyze/company")
def analyze_company(db: Session = Depends(get_db)):
    if not qwen_service.available: raise HTTPException(status_code=503, detail="Qwen is not configured; deterministic risk evidence remains available.")
    try: return qwen_service.analyze_company(db)
    except RuntimeError as error: raise HTTPException(status_code=502, detail=str(error))

@app.get("/api/ai/insights")
def ai_insights(department: str | None = None, db: Session = Depends(get_db)):
    if not qwen_service.available:
        return {"mode":"analytics_only", "status":qwen_service.status(), "insights":[], "answer":None}
    try:
        result=qwen_service.analyze_department(db, department) if department else qwen_service.analyze_company(db)
        return {"mode":"qwen", "status":qwen_service.status(), **result}
    except ValueError as error: raise HTTPException(status_code=404, detail=str(error))
    except RuntimeError as error: raise HTTPException(status_code=502, detail=str(error))

@app.post("/api/ai/ask")
def ai_ask(request: AIQuestion, db: Session = Depends(get_db)):
    if not qwen_service.available: raise HTTPException(status_code=503, detail="Qwen is not configured. Use analytics evidence until QWEN_API_KEY is configured.")
    try: return qwen_service.answer(db, request.question, request.department)
    except ValueError as error: raise HTTPException(status_code=404, detail=str(error))
    except RuntimeError as error: raise HTTPException(status_code=502, detail=str(error))
