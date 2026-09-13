"""Deterministic mock HR data with department-level behavioral patterns."""
from datetime import date, datetime, time, timedelta
from random import Random
from sqlalchemy.orm import Session
from .models import Attendance, Candidate, Employee, Performance

RNG, TODAY = Random(2409), date(2026, 9, 13)
DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "Human Resources", "Customer Support", "Operations"]
LOCATIONS = ["Bengaluru", "Mumbai", "Delhi", "Pune", "Hyderabad"]
ROLES = {"Engineering":["Software Engineer","Data Engineer","Engineering Manager"],"Sales":["Account Executive","Sales Manager","Sales Development Rep"],"Marketing":["Growth Marketer","Content Strategist","Marketing Manager"],"Finance":["Financial Analyst","Finance Manager"],"Human Resources":["HR Business Partner","Talent Partner"],"Customer Support":["Support Specialist","Support Manager"],"Operations":["Operations Analyst","Program Manager"]}
MANAGERS = {"Engineering":"Maya Rao","Sales":"Arjun Mehta","Marketing":"Priya Shah","Finance":"Nikhil Iyer","Human Resources":"Leena Das","Customer Support":"Nisha Ali","Operations":"Rahul Verma"}
# engagement, performance rating, absence probability, late probability
PROFILES = {"Engineering":(88,4.25,.025,.025),"Sales":(70,3.65,.085,.07),"Marketing":(78,3.85,.04,.04),"Finance":(86,4.1,.02,.02),"Human Resources":(81,4.0,.03,.03),"Customer Support":(73,3.75,.07,.10),"Operations":(80,3.95,.035,.035)}
FIRST=["Aarav","Diya","Kabir","Ananya","Rohan","Meera","Vikram","Sara","Ishaan","Kavya","Aditya","Riya","Arjun","Nisha","Priya","Rahul","Neha","Siddharth","Tanvi","Karan"]
LAST=["Shah","Patel","Singh","Iyer","Gupta","Nair","Joshi","Khan","Rao","Mehta","Das","Verma","Kapoor","Bose","Menon"]

def seed(db: Session):
    if db.query(Employee).count() >= 150: return
    db.query(Attendance).delete(); db.query(Performance).delete(); db.query(Candidate).delete(); db.query(Employee).delete(); db.commit()
    people=[]
    for i in range(150):
        department=DEPARTMENTS[i % len(DEPARTMENTS)]; engagement, _, _, _=PROFILES[department]
        status="Exited" if department=="Sales" and i%9==0 else "Notice Period" if i%19==0 else "Active"
        name=f"{FIRST[i%len(FIRST)]} {LAST[(i*3)%len(LAST)]}"
        people.append(Employee(full_name=name,email=f"{name.lower().replace(' ','.')}{i}@peoplepulse.demo",department=department,role=RNG.choice(ROLES[department]),manager=MANAGERS[department],location=RNG.choice(LOCATIONS),join_date=TODAY-timedelta(days=RNG.randint(45,1900)),employment_status=status,salary_band=RNG.choice(["B1","B2","B3","B4"]),experience_years=RNG.randint(1,15),age_band=RNG.choice(["22-27","28-34","35-44","45+"]),work_mode=RNG.choices(["Hybrid","Remote","Office"],[.55,.25,.2])[0],engagement_score=round(max(48,min(98,RNG.gauss(engagement,7))),1)))
    db.add_all(people); db.flush()
    attendance=[]; performance=[]
    for person in people:
        _, rating, absent, late=PROFILES[person.department]
        if person.employment_status=="Exited": absent += .04
        for offset in range(90):
            day=TODAY-timedelta(days=89-offset)
            if day.weekday()>4: continue
            roll=RNG.random(); state="Present"
            if roll < absent: state="Absent"
            elif roll < absent+.03: state="Leave"
            elif roll < absent+.03+late: state="Late"
            check_in=check_out=None; hours=0.0
            if state in ("Present","Late"):
                minute=RNG.randint(0,25)+(35 if state=="Late" else 0); check_in=time(9+minute//60,minute%60); hours=round(RNG.uniform(7.1,9.7),1); check_out=(datetime.combine(day,check_in)+timedelta(hours=hours)).time()
            attendance.append(Attendance(employee_id=person.employee_id,date=day,attendance_status=state,check_in_time=check_in,check_out_time=check_out,hours_worked=hours))
        goals=RNG.randint(5,9); done=max(1,min(goals,round(goals*RNG.uniform(.65,1.08))))
        performance.append(Performance(employee_id=person.employee_id,review_period="Q3 2026",performance_rating=round(max(2.3,min(5,RNG.gauss(rating,.38))),1),productivity_score=round(max(45,min(98,RNG.gauss(rating*20,7))),1),feedback_score=round(max(2.3,min(5,RNG.gauss(rating,.35))),1),goals_completed=done,goals_total=goals))
    db.add_all(attendance); db.add_all(performance)
    stages=["Applied","Screening","Interview","Offer","Hired","Rejected"]
    weights=[.26,.22,.2,.08,.12,.12]; candidates=[]
    for i in range(180):
        department=RNG.choices(DEPARTMENTS,[.29,.18,.1,.08,.08,.15,.12])[0]; stage=RNG.choices(stages,weights)[0]; name=f"{FIRST[(i+4)%len(FIRST)]} {LAST[(i*5+2)%len(LAST)]}"
        candidates.append(Candidate(candidate_name=name,role_applied=RNG.choice(ROLES[department]),department=department,source=RNG.choices(["Employee Referral","LinkedIn","Job Board","Career Site","Campus"],[.31,.28,.18,.15,.08])[0],application_date=TODAY-timedelta(days=RNG.randint(2,180)),current_stage=stage,interview_score=round(RNG.uniform(2.8,4.9),1) if stage in ("Interview","Offer","Hired") else None,status="Active" if stage in ("Applied","Screening","Interview","Offer") else stage))
    db.add_all(candidates); db.commit()
