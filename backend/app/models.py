from datetime import date, time
from sqlalchemy import Date, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase): pass

class Employee(Base):
    __tablename__ = "employees"
    employee_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    department: Mapped[str] = mapped_column(String(60), index=True)
    role: Mapped[str] = mapped_column(String(100))
    manager: Mapped[str] = mapped_column(String(100))
    location: Mapped[str] = mapped_column(String(60), index=True)
    join_date: Mapped[date] = mapped_column(Date)
    employment_status: Mapped[str] = mapped_column(String(30), index=True)
    salary_band: Mapped[str] = mapped_column(String(20))
    experience_years: Mapped[int] = mapped_column(Integer)
    age_band: Mapped[str] = mapped_column(String(20))
    work_mode: Mapped[str] = mapped_column(String(20))
    engagement_score: Mapped[float] = mapped_column(Float)

class Attendance(Base):
    __tablename__ = "attendance"
    attendance_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.employee_id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    attendance_status: Mapped[str] = mapped_column(String(20))
    check_in_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    check_out_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    hours_worked: Mapped[float] = mapped_column(Float)

class Performance(Base):
    __tablename__ = "performance"
    performance_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.employee_id"), index=True)
    review_period: Mapped[str] = mapped_column(String(30))
    performance_rating: Mapped[float] = mapped_column(Float)
    productivity_score: Mapped[float] = mapped_column(Float)
    feedback_score: Mapped[float] = mapped_column(Float)
    goals_completed: Mapped[int] = mapped_column(Integer)
    goals_total: Mapped[int] = mapped_column(Integer)

class Candidate(Base):
    __tablename__ = "candidates"
    candidate_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_name: Mapped[str] = mapped_column(String(100))
    role_applied: Mapped[str] = mapped_column(String(100))
    department: Mapped[str] = mapped_column(String(60), index=True)
    source: Mapped[str] = mapped_column(String(50))
    application_date: Mapped[date] = mapped_column(Date, index=True)
    current_stage: Mapped[str] = mapped_column(String(30))
    interview_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30))
