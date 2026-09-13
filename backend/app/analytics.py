from collections import Counter, defaultdict
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .models import Attendance, Candidate, Employee, Performance

STAGES=["Applied","Screening","Interview","Offer","Hired","Rejected"]

def filtered_people(db: Session, department=None, location=None):
    q=db.query(Employee)
    if department: q=q.filter(Employee.department==department)
    if location: q=q.filter(Employee.location==location)
    return q.all()

def attendance_rows(db, ids): return db.query(Attendance).filter(Attendance.employee_id.in_(ids)).all() if ids else []
def performance_rows(db, ids): return db.query(Performance).filter(Performance.employee_id.in_(ids)).all() if ids else []
def pct(a,b): return round(100*a/b,1) if b else 0
def attendance_metrics(rows):
    total=len(rows); present=sum(r.attendance_status in ("Present","Late") for r in rows)
    return {"attendance_rate":pct(present,total),"absenteeism_rate":pct(sum(r.attendance_status=="Absent" for r in rows),total),"late_rate":pct(sum(r.attendance_status=="Late" for r in rows),total),"total_days":total}

def overview(db, department=None, location=None):
    people=filtered_people(db,department,location); ids=[p.employee_id for p in people]; att=attendance_rows(db,ids); perf=performance_rows(db,ids)
    active=sum(p.employment_status=="Active" for p in people); notice=sum(p.employment_status=="Notice Period" for p in people); exited=sum(p.employment_status=="Exited" for p in people)
    am=attendance_metrics(att); avg_rating=round(sum(p.performance_rating for p in perf)/len(perf),2) if perf else 0; engagement=round(sum(p.engagement_score for p in people)/len(people),1) if people else 0
    cands=db.query(Candidate).filter(Candidate.department==department).all() if department else db.query(Candidate).all(); hired=sum(c.status=="Hired" for c in cands); active_c=sum(c.status=="Active" for c in cands)
    by_day=defaultdict(list)
    for r in att: by_day[r.date].append(r)
    weeks=defaultdict(list)
    for day, rows in by_day.items(): weeks[day.isocalendar().week].extend(rows)
    trend=[]
    for week, rows in sorted(weeks.items())[-6:]: trend.append({"month":f"W{week}","attendance":attendance_metrics(rows)["attendance_rate"],"headcount":active})
    return {"summary":{"totalEmployees":len(people),"activeEmployees":active,"employeesOnNotice":notice,"employeesExited":exited,"newHires":sum((date(2026,9,13)-p.join_date).days<=90 for p in people),"attendanceRate":am["attendance_rate"],"absenteeismRate":am["absenteeism_rate"],"lateRate":am["late_rate"],"averagePerformance":avg_rating,"averageEngagement":engagement,"attritionRate":pct(exited,len(people)),"totalRecruitmentCandidates":len(cands),"hiredCandidates":hired,"activeCandidates":active_c,"hiringConversion":pct(hired,len(cands)),"openRoles":len({(c.role_applied,c.department) for c in cands if c.status=="Active"})},"trends":trend,"department_mix":[{"name":k,"value":v} for k,v in Counter(p.department for p in people).items()],"filters":{"departments":sorted({p.department for p in db.query(Employee).all()}),"locations":sorted({p.location for p in db.query(Employee).all()})}}

def recruitment(db, department=None):
    q=db.query(Candidate)
    if department:q=q.filter(Candidate.department==department)
    rows=q.all(); counts=Counter(r.current_stage for r in rows); sources=Counter(r.source for r in rows); depts=Counter(r.department for r in rows); interview=[r.interview_score for r in rows if r.interview_score]
    open_roles=Counter((r.role_applied,r.department) for r in rows if r.status=="Active")
    funnel=[]
    for i,stage in enumerate(STAGES[:-1]):
        count=counts[stage]; previous=counts[STAGES[i-1]] if i else len(rows); funnel.append({"stage":stage,"count":count,"conversion":pct(count,previous)})
    return {"summary":{"total_candidates":len(rows),"hired_candidates":counts["Hired"],"active_candidates":sum(r.status=="Active" for r in rows),"hiring_conversion":pct(counts["Hired"],len(rows)),"average_interview_score":round(sum(interview)/len(interview),2) if interview else 0,"open_roles":len(open_roles)},"funnel":funnel,"sources":[{"name":k,"value":v} for k,v in sources.most_common()],"departments":[{"name":k,"value":v} for k,v in depts.most_common()],"open_roles":[{"role":r,"department":d,"candidate_count":n,"open_days":21+(i*5)} for i,((r,d),n) in enumerate(open_roles.most_common(8))],"recent_candidates":[{"candidate_id":r.candidate_id,"name":r.candidate_name,"role":r.role_applied,"department":r.department,"stage":r.current_stage,"source":r.source,"interview_score":r.interview_score} for r in sorted(rows,key=lambda x:x.application_date,reverse=True)[:12]]}

def attendance(db, department=None):
    people=filtered_people(db,department); ids=[p.employee_id for p in people]; rows=attendance_rows(db,ids); metrics=attendance_metrics(rows); by_date=defaultdict(list); by_person=defaultdict(list); by_dept=defaultdict(list)
    pmap={p.employee_id:p for p in people}
    for r in rows: by_date[r.date].append(r);by_person[r.employee_id].append(r);by_dept[pmap[r.employee_id].department].append(r)
    trends=[{"date":d.isoformat(),"attendance":attendance_metrics(v)["attendance_rate"],"late_rate":attendance_metrics(v)["late_rate"]} for d,v in sorted(by_date.items())]
    depts=[{"department":k,**attendance_metrics(v)} for k,v in sorted(by_dept.items())]
    risks=[]
    for eid,rs in by_person.items():
        absent=sum(x.attendance_status=="Absent" for x in rs); late=sum(x.attendance_status=="Late" for x in rs); score=min(100,absent*8+late*4)
        if score>=18: risks.append({"employee_id":eid,"employee":pmap[eid].full_name,"department":pmap[eid].department,"risk_score":score,"absences":absent,"late_arrivals":late,"attendance_rate":attendance_metrics(rs)["attendance_rate"],"severity":"HIGH" if score>=35 else "MEDIUM"})
    return {"summary":metrics,"trends":trends,"departments":depts,"risks":sorted(risks,key=lambda x:x["risk_score"],reverse=True)[:15]}

def performance(db, department=None):
    people=filtered_people(db,department); ids=[p.employee_id for p in people]; rows=performance_rows(db,ids); pmap={p.employee_id:p for p in people}; ratings=[r.performance_rating for r in rows]; goals=sum(r.goals_completed for r in rows); totals=sum(r.goals_total for r in rows)
    bins={"Exceeds":0,"Meets":0,"Developing":0,"At risk":0}
    groups=defaultdict(list)
    for r in rows:
        bins["Exceeds" if r.performance_rating>=4.5 else "Meets" if r.performance_rating>=3.7 else "Developing" if r.performance_rating>=3.2 else "At risk"]+=1;groups[pmap[r.employee_id].department].append(r)
    department_data=[]
    for d,rs in groups.items(): department_data.append({"department":d,"performance":round(sum(x.performance_rating for x in rs)/len(rs),2),"productivity":round(sum(x.productivity_score for x in rs)/len(rs),1),"goal_completion":pct(sum(x.goals_completed for x in rs),sum(x.goals_total for x in rs))})
    records=[{"employee_id":r.employee_id,"employee":pmap[r.employee_id].full_name,"department":pmap[r.employee_id].department,"rating":r.performance_rating,"productivity":r.productivity_score,"feedback":r.feedback_score,"goal_completion":pct(r.goals_completed,r.goals_total)} for r in rows]
    return {"summary":{"average_performance":round(sum(ratings)/len(ratings),2) if ratings else 0,"goal_completion":pct(goals,totals),"average_productivity":round(sum(r.productivity_score for r in rows)/len(rows),1) if rows else 0},"distribution":[{"name":k,"value":v} for k,v in bins.items()],"departments":department_data,"top_performers":sorted(records,key=lambda x:x["rating"],reverse=True)[:10],"needs_improvement":sorted([r for r in records if r["rating"]<3.5],key=lambda x:x["rating"])[:10]}

def workforce(db, department=None):
    people=filtered_people(db,department); by=Counter(p.department for p in people); locations=Counter(p.location for p in people); work=Counter(p.work_mode for p in people); status=Counter(p.employment_status for p in people)
    tenure=Counter("0–1 year" if (date(2026,9,13)-p.join_date).days<365 else "1–3 years" if (date(2026,9,13)-p.join_date).days<1095 else "3+ years" for p in people)
    exp=Counter("0–3 years" if p.experience_years<=3 else "4–8 years" if p.experience_years<=8 else "9+ years" for p in people)
    return {"summary":{"headcount":len(people),"average_engagement":round(sum(p.engagement_score for p in people)/len(people),1) if people else 0,"active":status["Active"],"notice_period":status["Notice Period"],"exited":status["Exited"]},"departments":[{"department":k,"headcount":v} for k,v in by.items()],"distribution":{"locations":[{"name":k,"value":v} for k,v in locations.items()],"work_modes":[{"name":k,"value":v} for k,v in work.items()],"employment_status":[{"name":k,"value":v} for k,v in status.items()],"tenure":[{"name":k,"value":v} for k,v in tenure.items()],"experience":[{"name":k,"value":v} for k,v in exp.items()]}}

def risks(db, department=None):
    ov=overview(db); company=ov["summary"]; people=filtered_people(db,department); depts=sorted({p.department for p in people}); att_all=attendance(db,department); perf_all=performance(db,department); rec=recruitment(db,department)
    out=[]
    for d in depts:
        dp=[p for p in people if p.department==d]; ids=[p.employee_id for p in dp]; am=attendance_metrics(attendance_rows(db,ids)); pr=performance(db,d)["summary"]
        exits=sum(p.employment_status=="Exited" for p in dp); attr=pct(exits,len(dp)); engagement=round(sum(p.engagement_score for p in dp)/len(dp),1); pressure=sum(1 for r in rec["open_roles"] if r["department"]==d)
        score=min(100,round(max(0,attr-company["attritionRate"])*3+max(0,company["attendanceRate"]-am["attendance_rate"])*2+max(0,company["averagePerformance"]-pr["average_performance"])*12+max(0,company["averageEngagement"]-engagement)*1.3+am["late_rate"]*1.2+pressure*3))
        severity="CRITICAL" if score>=70 else "HIGH" if score>=45 else "MEDIUM" if score>=25 else "LOW"
        signals=[{"metric":"attrition_rate","value":attr,"companyAverage":company["attritionRate"]},{"metric":"attendance_rate","value":am["attendance_rate"],"companyAverage":company["attendanceRate"]},{"metric":"engagement_score","value":engagement,"companyAverage":company["averageEngagement"]},{"metric":"performance_rating","value":pr["average_performance"],"companyAverage":company["averagePerformance"]}]
        out.append({"department":d,"severity":severity,"riskScore":score,"signals":signals,"open_roles":pressure})
    return sorted(out,key=lambda x:x["riskScore"],reverse=True)
