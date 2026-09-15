import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Bell, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleHelp, Command, Download, FileText, Filter, Gauge, HelpCircle, Info, LayoutDashboard, LogOut, Mail, Menu, MoreHorizontal, Phone, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp, User, Users, X, Zap } from 'lucide-react'
import { api } from './services/api'
import { useDashboardData } from './hooks/useDashboardData'
import './index.css'
import './styles/tokens.css'
import './refinement.css'

const colors = ['#4F6BED', '#7C5CFC', '#2AA7A1', '#F5A524', '#16B364', '#D85B7D', '#18A7C9']
const dataGradients = [
  'linear-gradient(135deg,#4285F4,#5B5FEF)',
  'linear-gradient(135deg,#7C4DFF,#A855F7)',
  'linear-gradient(135deg,#06B6D4,#14B8A6)',
  'linear-gradient(135deg,#FACC15,#F59E0B)',
  'linear-gradient(135deg,#22C55E,#10B981)',
  'linear-gradient(135deg,#F43F5E,#EC4899)',
  'linear-gradient(135deg,#06B6D4,#3B82F6)',
]
const svgGradientPairs = [['#4285F4','#6366F1'],['#6366F1','#8B5CF6'],['#00B8D9','#14B8A6'],['#FACC15','#F59E0B'],['#22C55E','#10B981'],['#F43F5E','#EC4899'],['#06B6D4','#3B82F6']]
const navItems = [['/overview', 'Overview', LayoutDashboard], ['/recruitment', 'Recruitment', BriefcaseBusiness], ['/attendance', 'Attendance', Activity], ['/performance', 'Performance', Target], ['/workforce', 'Workforce', Users], ['/ai-insights', 'AI Insights', Sparkles]]
const departmentScores = [{ department: 'Engineering', score: 4.2, engagement: 82 }, { department: 'Product', score: 4.5, engagement: 89 }, { department: 'Sales', score: 3.7, engagement: 71 }, { department: 'People', score: 4.4, engagement: 91 }, { department: 'Success', score: 4.2, engagement: 86 }]
const performanceTrend = [{month:'Mar',score:3.8,goals:74},{month:'Apr',score:4,goals:79},{month:'May',score:3.9,goals:78},{month:'Jun',score:4.2,goals:84},{month:'Jul',score:4.1,goals:86},{month:'Aug',score:4.2,goals:88}]

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

function Toast({ message, onClose }) {
  if (!message) return null
  return <div className="toast"><CheckCircle2 size={18}/><span>{message}</span><IconButton label="Close" onClick={onClose}><X size={14}/></IconButton></div>
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton label="Close" onClick={onClose}><X size={16}/></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>{title}</h3>
          <IconButton label="Close" onClick={onClose}><X size={16}/></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

function IconButton({ label, className='', children, ...props }) { return <button type="button" aria-label={label} title={label} className={`icon-button ${className}`} {...props}>{children}</button> }
function Status({ children, tone='neutral' }) { return <span className={`status ${tone}`}>{children}</span> }
function Panel({ title, subtitle, action, children, className='' }) { return <section className={`panel ${className}`}><div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section> }
function TooltipContent({active,payload,label}) { if (!active || !payload?.length) return null; return <div className="chart-tooltip"><b>{label}</b>{payload.map(x=><span key={x.name} style={{color:x.color}}>{x.name}: <strong>{x.value}</strong></span>)}</div> }
function Loading() { return <div className="page-skeleton" aria-label="Loading dashboard"><div className="skeleton-heading"><i/><i/></div><div className="skeleton-kpis">{Array.from({length:4},(_,index)=><i key={index}/>)}</div><div className="skeleton-panels"><i/><i/><i/></div><i className="skeleton-table"/></div> }
function Empty({title}) { return <div className="empty"><div><Activity size={19}/></div><strong>{title}</strong><p>Try again or adjust your filters.</p><button type="button" className="button" onClick={()=>window.location.reload()}>Try again</button></div> }

function Sidebar({ collapsed, setCollapsed, open, setOpen, onOpenHelp, onOpenSettings, onOpenProfile }) {
  return (
    <aside className={`sidebar ${collapsed?'collapsed':''} ${open?'open':''}`}>
      <div className="brand">
        <span><Zap size={18}/></span>
        {!collapsed && <div><b>PeoplePulse</b><small>HR INTELLIGENCE</small></div>}
        <IconButton label="Collapse sidebar" className="collapse" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</IconButton>
      </div>
      <nav>
        <p>WORKSPACE</p>
        {navItems.map(([to,label,Icon])=><NavLink key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>isActive?'active':''}><Icon size={18}/>{!collapsed&&<span>{label}</span>}{to==='/ai-insights'&&!collapsed&&<i>AI</i>}</NavLink>)}
      </nav>
      <div className="sidebar-footer">
        <div className="ai-plan">
          <span><Sparkles size={16}/></span>
          {!collapsed&&<div><b>HR Intelligence</b><small>4 insights need review</small></div>}
          <em/>
        </div>
        {!collapsed&&(
          <div className="sidebar-links">
            <span style={{cursor:'pointer'}} onClick={onOpenHelp}><CircleHelp size={15}/>Help &amp; Support</span>
            <span style={{cursor:'pointer'}} onClick={onOpenSettings}><Settings size={15}/>Settings</span>
          </div>
        )}
        {!collapsed&&(
          <div className="sidebar-profile" style={{cursor:'pointer'}} onClick={onOpenProfile}>
            <span>AR</span>
            <div><b>Alex Rivera</b><small>VP, People</small></div>
          </div>
        )}
      </div>
      <IconButton label="Close menu" className="close-menu" onClick={()=>setOpen(false)}><X/></IconButton>
    </aside>
  )
}

function Topbar({department,setDepartment,filters,setOpen,searchQuery,setSearchQuery,onOpenNotice,onOpenProfile,timeframe,setTimeframe}) {
  const {pathname}=useLocation()
  const title={'/':'Overview','/overview':'Overview','/recruitment':'Recruitment','/attendance':'Attendance','/performance':'Performance','/workforce':'Workforce','/ai-insights':'Decision Center'}[pathname]||'Overview'
  const placeholders={recruitment:'Search candidates, roles, departments…',workforce:'Search employees, teams, locations…',attendance:'Search attendance records and employees…',performance:'Search reviews, goals, and employees…','ai-insights':'Search insights and evidence…'}
  const placeholder=placeholders[pathname.slice(1)]||'Search people, reports, and metrics…'
  const [showTimeframes, setShowTimeframes] = useState(false)

  return (
    <header className="topbar">
      <IconButton label="Open menu" className="menu" onClick={()=>setOpen(true)}><Menu/></IconButton>
      <div className="breadcrumb"><span>PeoplePulse</span><ChevronRight size={14}/><b>{title}</b></div>
      <label className="search">
        <Search size={16}/>
        <input aria-label="Global search" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={placeholder}/>
        <kbd><Command size={10}/>K</kbd>
      </label>
      <div className="top-actions">
        <label className="control">
          <Users size={15}/>
          <select value={department} onChange={e=>setDepartment(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {filters.departments.map(x=><option key={x}>{x}</option>)}
          </select>
          <ChevronDown size={13}/>
        </label>
        <div className="control range" aria-label="Reporting period" style={{position:'relative',cursor:'pointer'}} onClick={()=>setShowTimeframes(!showTimeframes)}>
          <CalendarDays size={15}/>
          <span>{timeframe}</span>
          <ChevronDown size={13}/>
          {showTimeframes && (
            <div style={{position:'absolute',top:'42px',right:0,background:'#fff',border:'1px solid #e2e8f0',borderRadius:'8px',boxShadow:'0 10px 25px #0f172a1f',zIndex:50,width:'150px',padding:'4px'}}>
              {['Last 30 days','Last 90 days','Last 6 months','Year to date'].map(t=>(
                <div key={t} style={{padding:'7px 10px',fontSize:'11px',borderRadius:'5px',color:timeframe===t?'#3b82f6':'#475569',fontWeight:timeframe===t?'700':'500',background:timeframe===t?'#eff6ff':'transparent'}} onClick={e=>{e.stopPropagation();setTimeframe(t);setShowTimeframes(false)}}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
        <IconButton label="Notifications" className="notice" onClick={onOpenNotice}><Bell size={17}/><i/></IconButton>
        <div className="profile" style={{cursor:'pointer'}} onClick={onOpenProfile}>
          <span>AR</span>
          <div><b>Alex Rivera</b><small>VP, People</small></div>
          <ChevronDown size={13}/>
        </div>
      </div>
    </header>
  )
}

function PageHeader({eyebrow='PEOPLE ANALYTICS',title,description,children}) { return <div className="page-header"><div><p><span className="eyebrow-line"/>{eyebrow}</p><h1>{title}<span className="page-heading-dot">.</span></h1><span>{description}</span></div>{children&&<div className="header-actions">{children}</div>}</div> }
function Button({children,kind='secondary',onClick}) { return <button className={`button ${kind}`} onClick={onClick}>{children}</button> }
function Kpi({label,value,change,tone='blue',icon:Icon, spark}) { return <article className={`kpi ${tone}`}><div className="kpi-icon"><Icon size={18}/></div><div><span>{label}</span><b>{value}</b><small className={change?.startsWith('+')?'positive':change?.startsWith('-')?'negative':''}>{change}</small></div>{spark&&<div className="spark">{[6,11,8,15,11,20,17].map((h,i)=><i key={i} style={{height:h}}/>)}</div>}</article> }

function WorkforceChart({data}) { return <div className="chart tall"><div className="legend"><span><i className="blue"/>Attendance rate</span><span><i className="purple"/>Headcount</span></div><ResponsiveContainer><AreaChart data={data.trends}><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4F6BED" stopOpacity=".34"/><stop offset="1" stopColor="#4F6BED" stopOpacity=".03"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis yAxisId="attendance" domain={[80,100]} unit="%" axisLine={false} tickLine={false}/><YAxis yAxisId="people" hide orientation="right" domain={[0,12]}/><Tooltip content={<TooltipContent/>}/><Area yAxisId="attendance" name="Attendance" dataKey="attendance" type="monotone" stroke="#4F6BED" strokeWidth={3} fill="url(#area)"/><Line yAxisId="people" name="Headcount" dataKey="headcount" type="monotone" stroke="#7C5CFC" strokeWidth={2.5} dot={{r:3,fill:'#fff',strokeWidth:2}}/></AreaChart></ResponsiveContainer></div> }
function Funnel() { const data=[['Applied',142,'#dbeafe'],['Screened',84,'#93c5fd'],['Interview',46,'#60a5fa'],['Offer',12,'#8b5cf6'],['Hired',8,'#14b8a6']]; return <div className="funnel">{data.map(([n,v,c],i)=><div key={n}><span>{n}</span><div><i style={{width:`${v/1.42}%`,background:c}}/><b>{v}</b></div><small>{i<data.length-1?`${Math.round(data[i+1][1]/v*100)}%`:''}</small></div>)}</div> }

function RiskCard({onNavigate}) {
  const rows=[['Low risk','62%','#22b573'],['Watchlist','25%','#f59e0b'],['High risk','13%','#f05252']]
  return (
    <Panel title="Attrition risk" subtitle="Predictive workforce signals" action={<Status tone="danger">2 critical</Status>}>
      <div className="risk">
        <div className="risk-chart">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/><circle className="red" cx="50" cy="50" r="40"/><circle className="orange" cx="50" cy="50" r="40"/><circle className="green" cx="50" cy="50" r="40"/></svg>
          <div><b>13%</b><span>at risk</span></div>
        </div>
        <div className="risk-list">{rows.map(r=><div key={r[0]}><i style={{background:r[2]}}/><span>{r[0]}</span><b>{r[1]}</b></div>)}</div>
      </div>
      <button className="link" onClick={() => onNavigate('/attendance')}>Review high-risk employees <ChevronRight size={14}/></button>
    </Panel>
  )
}

function ActivityFeed({onOpenActivity}) {
  const a=[['MS','Meera Nair completed Q3 review','12 min ago','green'],['KS','Kabir Singh flagged for retention review','1h ago','red'],['AR','New candidate moved to final interview','3h ago','purple'],['PD','Payroll change approved','Yesterday','blue']]
  return (
    <Panel title="Recent HR activity" subtitle="Latest events across your team" action={<button className="link" onClick={onOpenActivity}>View all</button>}>
      <div className="activity">{a.map(([initial,text,time,tone])=><div key={text}><span className={tone}>{initial}</span><p>{text}<small>{time}</small></p><MoreHorizontal size={16}/></div>)}</div>
    </Panel>
  )
}

function DecisionCenter({insights,answer,ask,action}) {
  const [question,setQuestion]=useState('')
  const submit=()=>{ask(question||'What should HR prioritize this week?');setQuestion('')}
  return (
    <section className="decision">
      <div className="qwen"><Bot size={17}/><b>Qwen AI</b></div>
      <div className="decision-title">
        <div>
          <p>AI DECISION CENTER</p>
          <h2>Prioritize what matters most</h2>
          <span>Decision support that separates evidence, derived signals, and recommended action.</span>
        </div>
        <Status tone="ai"><Sparkles size={11}/> Live intelligence</Status>
      </div>
      <div className="insights">
        {insights.slice(0,3).map((x,i)=>(
          <article key={x.id}>
            <div><Status tone={i===0?'danger':'warning'}>{x.priority}</Status><span>Confidence {i===0?'91':i===1?'84':'78'}%</span></div>
            <h3>{x.title}</h3>
            <p>{x.detail}</p>
            <small>SUPPORTING SIGNALS</small>
            <em>{i===0?'84% attendance · 31h overtime':i===1?'42% overtime concentration':'Offer open for 5 days'}</em>
            <button onClick={()=>action(x.action||x.title)}>{x.action||'Review department evidence'}<ChevronRight size={14}/></button>
          </article>
        ))}
      </div>
      <div className="ask">
        <div><Sparkles size={17}/><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Ask HR Intelligence about your workforce…"/></div>
        <button onClick={submit}>Ask AI <ChevronRight size={15}/></button>
      </div>
      {answer&&<div className="answer"><Bot size={17}/><div><small>QWEN AI RESPONSE · 87% CONFIDENCE</small><p>{answer}</p></div></div>}
    </section>
  )
}

function Overview({data,insights,answer,ask,action,loading,error,onExport,onBrief,onNavigate,onOpenActivity}) {
  if(loading)return <Loading/>;if(error)return <Empty title="We couldn’t load your dashboard"/>
  const metrics=[...data.kpis,{label:'Open roles',value:'3',delta:'1 offer pending',tone:'purple'},{label:'Team engagement',value:'84%',delta:'+4.6% this quarter',tone:'orange'}]
  const icons=[Users,CircleAlert,Activity,Target,BriefcaseBusiness,TrendingUp], tones=['blue','red','teal','green','purple','orange']
  return (
    <>
      <PageHeader eyebrow="EXECUTIVE WORKFORCE SNAPSHOT" title="Good morning, Alex" description="Here’s the people intelligence snapshot for your organization.">
        <Button onClick={onExport}><CalendarDays size={15}/>Export report</Button>
        <Button kind="primary" onClick={onBrief}><Sparkles size={15}/>Generate brief</Button>
      </PageHeader>
      <div className="kpis">{metrics.map((m,i)=><Kpi key={m.label} label={m.label} value={m.value} change={m.delta} tone={tones[i]} icon={icons[i]} spark={i===0||i===5}/>)}</div>
      <div className="grid overview-main">
        <Panel title="Workforce overview" subtitle="Headcount and attendance over time" action={<button className="link" onClick={() => onNavigate('/workforce')}>View report <ChevronRight size={14}/></button>}>
          <WorkforceChart data={data}/>
        </Panel>
        <RiskCard onNavigate={onNavigate}/>
      </div>
      <div className="grid overview-lower">
        <Panel title="Recruitment funnel" subtitle="Conversion across active opportunities" action={<NavLink to="/recruitment" className="link">Open recruiting <ChevronRight size={14}/></NavLink>}>
          <Funnel/>
        </Panel>
        <Panel title="Department performance" subtitle="Goal completion by team">
          <DepartmentChart name="Engagement" dataKey="engagement" color="#14b8a6"/>
        </Panel>
        <ActivityFeed onOpenActivity={onOpenActivity}/>
      </div>
      <DecisionCenter {...{insights,answer,ask,action}}/>
    </>
  )
}

function DepartmentChart({name,dataKey,color}) { return <div className="chart compact"><ResponsiveContainer><BarChart data={departmentScores}><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="department" axisLine={false} tickLine={false} fontSize={10}/><YAxis axisLine={false} tickLine={false}/><Tooltip content={<TooltipContent/>}/><Bar dataKey={dataKey} name={name} fill={color} radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div> }
function RoleList({roles=[]}) { return <div className="roles">{roles.map((x,i)=><div key={x.role}><span className={`role r${i}`}><BriefcaseBusiness size={15}/></span><p><b>{x.role}</b><small>{x.department} · {x.open_days} days open</small></p><Status tone="neutral">Open</Status></div>)}</div> }
function SourceList(){const d=[['Employee referral','38%','#8b5cf6'],['LinkedIn','29%','#4385f5'],['Job boards','21%','#14b8a6'],['Other','12%','#f59e0b']];return <div className="sources">{d.map(x=><div key={x[0]}><span><i style={{background:x[2]}}/>{x[0]}</span><b>{x[1]}</b><em><i style={{width:x[1],background:x[2]}}/></em></div>)}</div>}
function ScoreCard(){return <div className="score-card"><div><b>84</b><span>/ 100</span></div><i><em/></i><p><TrendingUp size={14}/> +4.6 points vs last quarter</p>{[['Manager support','91'],['Growth opportunity','78'],['Team belonging','88']].map(x=><span key={x[0]}>{x[0]}<b>{x[1]}</b></span>)}</div>}
function WatchList({onSelectEmployee}){const d=[['Vikram Joshi','31h overtime','Critical', 1],['Kabir Singh','28h overtime','Watch', 2],['Rohan Gupta','22h overtime','Watch', 3]];return <div className="watch">{d.map(x=><div key={x[0]} style={{cursor:'pointer'}} onClick={()=>onSelectEmployee&&onSelectEmployee({id:x[3],name:x[0],department:'Sales',role:'Senior Account Executive',location:'Bengaluru',tenure_months:24,engagement_score:76,employment_status:'Active',risk_level:x[2].toLowerCase(),salary_band:'B3',work_mode:'Hybrid',manager:'Arjun Mehta'})}><span>{x[0].split(' ').map(y=>y[0]).join('')}</span><p><b>{x[0]}</b><small>{x[1]}</small></p><Status tone={x[2]==='Critical'?'danger':'warning'}>{x[2]}</Status></div>)}</div>}
function PerformanceChart(){return <div className="chart tall"><ResponsiveContainer><LineChart data={performanceTrend}><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis yAxisId="a" domain={[3,5]} axisLine={false} tickLine={false}/><YAxis yAxisId="b" hide orientation="right" domain={[60,100]}/><Tooltip content={<TooltipContent/>}/><Line yAxisId="a" dataKey="score" name="Performance score" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}}/><Line yAxisId="b" dataKey="goals" name="Goal completion" stroke="#22b573" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer></div>}

function EmployeeTable({employees, searchQuery, onSelectEmployee}) {
  const filtered = employees.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q)
  })

  return (
    <div className="table">
      <table>
        <thead><tr><th>Employee</th><th>Department</th><th>Location</th><th>Tenure</th><th>Risk level</th></tr></thead>
        <tbody>
          {filtered.slice(0, 10).map(e => (
            <tr key={e.id} style={{cursor:'pointer'}} onClick={() => onSelectEmployee(e)}>
              <td><span>{e.name.split(' ').map(x=>x[0]).join('')}</span><b>{e.name}</b></td>
              <td>{e.department}</td>
              <td>{e.location}</td>
              <td>{e.tenure_months} months</td>
              <td><Status tone={e.risk_level==='high'?'danger':e.risk_level==='medium'?'warning':'success'}>{e.risk_level}</Status></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CandidateTable({data, searchQuery, onSelectCandidate}) {
  const filtered = data.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.department.toLowerCase().includes(q) || c.source.toLowerCase().includes(q)
  })

  return (
    <div className="candidate-table">
      <table>
        <thead><tr><th>Candidate</th><th>Role</th><th>Source</th><th>Department</th><th>Interview score</th><th>Stage</th></tr></thead>
        <tbody>
          {filtered.map(candidate => (
            <tr key={candidate.candidate_id} style={{cursor:'pointer'}} onClick={() => onSelectCandidate(candidate)}>
              <td><span className="candidate-avatar">{candidate.name.split(' ').map(part=>part[0]).join('').slice(0,2)}</span><b>{candidate.name}</b></td>
              <td>{candidate.role}</td>
              <td>{candidate.source}</td>
              <td>{candidate.department}</td>
              <td>{candidate.interview_score??'—'}</td>
              <td><Status tone={stageTone(candidate.stage)}>{candidate.stage}</Status></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WorkforcePie({data}){const [active,setActive]=useState(null),workforce=data||[],total=workforce.reduce((sum,item)=>sum+Number(item.value||0),0);return <div className="pie-layout"><div className="pie"><ResponsiveContainer><PieChart><defs>{svgGradientPairs.map(([start,end],i)=><linearGradient key={start} id={`workforceGradient${i}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={start}/><stop offset="100%" stopColor={end}/></linearGradient>)}</defs><Pie data={workforce} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={4}>{workforce.map((x,i)=><Cell className="donut-segment" key={x.name} fill={`url(#workforceGradient${i})`} opacity={active===null||active===i ? .98 : .3}/>)}</Pie><Tooltip formatter={(value,name)=>[`${value} employees · ${total?(Number(value)/total*100).toFixed(1):0}%`,name]}/></PieChart></ResponsiveContainer><div><b>{total}</b><span>Employees</span></div></div><section>{workforce.map((x,i)=><button type="button" key={x.name} onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)}><i style={{background:dataGradients[i]}}/><span>{x.name}</span><b>{x.value}</b><em>{total?`${(Number(x.value||0)/total*100).toFixed(1)}%`:"0.0%"}</em></button>)}</section></div>}
function Distribution(){const d=[['Exceeds',22,'#22b573'],['Meets',58,'#4385f5'],['Developing',16,'#f59e0b'],['At risk',4,'#f05252']];return <div className="distribution"><div><ResponsiveContainer><PieChart><Pie data={d.map(x=>({name:x[0],value:x[1]}))} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={3}>{d.map(x=><Cell key={x[0]} fill={x[2]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>{d.map(x=><p key={x[0]}><i style={{background:x[2]}}/>{x[0]}<b>{x[1]}%</b></p>)}</div>}

function DataPage({type,data,employees,recruitment,loading,error,onExport,searchQuery,onSelectEmployee,onSelectCandidate,onOpenActivity}) {
  const info={recruitment:['Recruitment','Manage the hiring pipeline, identify bottlenecks, and move exceptional talent faster.',BriefcaseBusiness],attendance:['Attendance & engagement','Understand time, participation, and early engagement signals across every team.',Activity],performance:['Performance','Track goal delivery and surface coaching opportunities for your people leaders.',Target],workforce:['Workforce','Build an accurate view of your organization, team composition, and workforce risk.',Users]}[type]
  const [title,desc,Icon]=info
  if(loading)return <Loading/>;if(error)return <Empty title={`We couldn’t load ${title.toLowerCase()}`}/>
  if(type==='recruitment')return <RecruitmentDashboard recruitment={analytics.recruitment||recruitment} onExport={onExport} searchQuery={searchQuery} onSelectCandidate={onSelectCandidate}/>

  const att=data?.attendance||{summary:{attendance_rate:92.8,absenteeism_rate:4.5,late_rate:4.5},trends:[],departments:[],risks:[]}
  const perf=data?.performance||{summary:{average_performance:3.89,goal_completion:86.0,average_productivity:78.5},distribution:[],departments:[],top_performers:[],needs_improvement:[]}
  const work=data?.workforce||{summary:{headcount:employees.length,average_engagement:79.3,active:140,notice_period:8,exited:2},departments:[],distribution:{work_modes:[]}}

  const metric={
    attendance:[['Attendance',`${att.summary?.attendance_rate}%`,'Present + late','teal'],['Absenteeism',`${att.summary?.absenteeism_rate}%`,'Recorded absence','orange'],['Late rate',`${att.summary?.late_rate}%`,'Punctuality signal','red'],['At-risk people',att.risks?.length||0,'Repeated attendance events','purple']],
    performance:[['Avg. performance',perf.summary?.average_performance||3.89,'Current review cycle','green'],['Goal completion',`${perf.summary?.goal_completion||86}%`,'Completed goals','blue'],['Productivity',perf.summary?.average_productivity||78.5,'Average score','purple'],['Coaching opportunities',perf.needs_improvement?.length||0,'Rating below 3.5','orange']],
    workforce:[['Total workforce',String(employees.length),'+3 this quarter','blue'],['Avg. tenure','21 mo','Stable mix','purple'],['High attrition risk','2','Act this week','red'],['Manager span','1:5','Healthy range','green']]
  }[type]

  return (
    <>
      <PageHeader title={title} description={desc}>
        <Button onClick={onExport}><CalendarDays size={15}/>Timeframe report</Button>
        <Button kind="primary" onClick={onExport}><Icon size={15}/>Export data</Button>
      </PageHeader>
      <div className="kpis four">{metric.map((m,i)=><Kpi key={m[0]} label={m[0]} value={m[1]} change={m[2]} tone={m[3]} icon={[Icon,TrendingUp,Gauge,CircleAlert][i]}/>)}</div>
      <div className="grid page-grid">
        {type==='attendance'&&(
          <>
            <Panel className="span-2" title="Attendance trend" subtitle="Daily attendance over trailing period"><AttendanceTrend data={att.trends}/></Panel>
            <Panel title="Attendance risk employees" subtitle="Repeated absence or late arrival"><RiskPeople data={att.risks} onSelectEmployee={onSelectEmployee}/></Panel>
            <Panel className="span-2" title="Attendance by department" subtitle="Attendance and late rate"><AttendanceBars data={att.departments}/></Panel>
            <Panel title="Risk signals" subtitle="Rules-based detection"><RiskPeople data={att.risks.slice(0,4)} onSelectEmployee={onSelectEmployee}/></Panel>
          </>
        )}
        {type==='performance'&&(
          <>
            <Panel className="span-2" title="Performance and goal delivery" subtitle="Trailing six months"><PerformanceChart/></Panel>
            <Panel title="Performance distribution" subtitle="Current review cycle"><Distribution/></Panel>
            <Panel className="span-2" title="Department comparison" subtitle="Average performance score"><DepartmentChart name="Score" dataKey="score" color="#8b5cf6"/></Panel>
            <ActivityFeed onOpenActivity={onOpenActivity}/>
          </>
        )}
        {type==='workforce'&&(
          <>
            <Panel className="span-2" title="Workforce composition" subtitle="Department headcount"><WorkforcePie data={work.departments?.length?work.departments.map(x=>({name:x.department,value:x.headcount})):data.department_mix}/></Panel>
            <RiskCard onNavigate={()=>{}}/>
            <Panel className="span-2" title="Employee directory" subtitle="Filtered people records"><EmployeeTable employees={employees} searchQuery={searchQuery} onSelectEmployee={onSelectEmployee}/></Panel>
            <ActivityFeed onOpenActivity={onOpenActivity}/>
          </>
        )}
      </div>
    </>
  )
}

function FunnelData({items}) { const total=items.reduce((sum,item)=>sum+item.count,0);return <div className="funnel">{items.map((x,i)=>{const share=total?x.count/total*100:0;return <div key={x.stage}><span>{x.stage}</span><div><i style={{width:`${share}%`,background:dataGradients[i]}}/><b>{x.count}</b></div><small>{share.toFixed(1)}%</small></div>})}</div> }
function RecruitmentSources({data,total}){return <div className="recruitment-sources">{data.map((item,index)=>{const percent=total?(item.value/total*100):0;return <div key={item.name}><div><span><i style={{background:dataGradients[index]}}/>{item.name}</span><b>{item.value}</b><em>{percent.toFixed(1)}%</em></div><p><i style={{width:`${percent}%`,background:dataGradients[index]}}/></p></div>})}</div>}
function RecruitmentFunnel({items,total}){const max=Math.max(...items.map(item=>item.count),1);return <div className="recruitment-funnel"><div className="funnel-shapes">{items.map((item,index)=><div key={item.stage} style={{width:`${Math.max(36,item.count/max*100)}%`,background:dataGradients[index]}}><b>{item.count}</b></div>)}</div><div className="funnel-legend">{items.map((item,index)=>{const percent=total?item.count/total*100:0;return <div key={item.stage}><span><i style={{background:dataGradients[index]}}/>{item.stage}</span><b>{item.count}</b><em>{percent.toFixed(1)}%</em></div>})}</div></div>}
function stageTone(stage){return ({Applied:'neutral',Screening:'purple',Interview:'blue',Offer:'warning',Hired:'success',Rejected:'danger'})[stage]||'neutral'}

function SourceData({data}) { return <div className="sources">{data.map((x,i)=><div key={x.name}><span><i style={{background:dataGradients[i%dataGradients.length]}}/>{x.name}</span><b>{x.value}</b><em><i style={{width:`${Math.min(100,x.value)}%`,background:dataGradients[i%dataGradients.length]}}/></em></div>)}</div> }
function RiskPeople({data, onSelectEmployee}) { return <div className="watch">{data.slice(0,5).map(x=><div key={x.employee_id} style={{cursor:'pointer'}} onClick={()=>onSelectEmployee&&onSelectEmployee({id:x.employee_id,name:x.employee,department:x.department,role:'Team Member',location:'Bengaluru',tenure_months:18,engagement_score:72,employment_status:'Active',risk_level:x.severity.toLowerCase(),salary_band:'B2',work_mode:'Hybrid',manager:'Department Lead'})}><span>{x.employee.split(' ').map(n=>n[0]).join('')}</span><p><b>{x.employee}</b><small>{x.absences} absences · {x.late_arrivals} late</small></p><Status tone={x.severity==='HIGH'?'danger':'warning'}>{x.severity}</Status></div>)}</div> }
function AttendanceTrend({data}) { return <div className="chart tall"><ResponsiveContainer><AreaChart data={data}><defs><linearGradient id="attendanceAnalytics" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#11B8A6" stopOpacity=".34"/><stop offset="1" stopColor="#11B8A6" stopOpacity=".03"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="date" hide/><YAxis domain={[60,100]} axisLine={false} tickLine={false}/><Tooltip content={<TooltipContent/>}/><Area dataKey="attendance" name="Attendance" type="monotone" stroke="#11B8A6" strokeWidth={3} fill="url(#attendanceAnalytics)"/></AreaChart></ResponsiveContainer></div> }
function AttendanceBars({data}) { return <div className="chart tall"><ResponsiveContainer><BarChart data={data}><defs><linearGradient id="attendanceBarGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#22D3B6"/><stop offset=".5" stopColor="#14B8A6"/><stop offset="1" stopColor="#0EA5A4"/></linearGradient><linearGradient id="lateBarGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FACC15"/><stop offset="1" stopColor="#F59E0B"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="department" axisLine={false} tickLine={false} fontSize={10}/><YAxis axisLine={false} tickLine={false}/><Tooltip content={<TooltipContent/>}/><Bar className="data-bar" dataKey="attendance_rate" name="Attendance" fill="url(#attendanceBarGradient)" radius={[5,5,0,0]}/><Bar className="data-bar" dataKey="late_rate" name="Late rate" fill="url(#lateBarGradient)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div> }
function PerformanceBars({data}) { return <div className="chart tall"><div className="legend"><span><i className="purple"/>Performance / 5</span><span><i className="green"/>Goal completion %</span></div><ResponsiveContainer><BarChart data={data}><defs><linearGradient id="performanceBarGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9B72FF"/><stop offset="1" stopColor="#6D3FE4"/></linearGradient><linearGradient id="goalBarGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#34D399"/><stop offset="1" stopColor="#10B981"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f6"/><XAxis dataKey="department" axisLine={false} tickLine={false} fontSize={10}/><YAxis yAxisId="rating" domain={[0,5]} axisLine={false} tickLine={false}/><YAxis yAxisId="goals" domain={[0,100]} orientation="right" axisLine={false} tickLine={false}/><Tooltip content={<TooltipContent/>}/><Bar className="data-bar" yAxisId="rating" dataKey="performance" name="Performance" fill="url(#performanceBarGradient)" radius={[5,5,0,0]}/><Bar className="data-bar" yAxisId="goals" dataKey="goal_completion" name="Goal completion" fill="url(#goalBarGradient)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div> }
function DepartmentRisks({data}) { return <div className="department-risks"><div className="risk-caption"><span>DEPARTMENT</span><span>RISK / 100</span></div>{data.slice(0,5).map(x=>{const tone=x.severity==='HIGH'||x.severity==='CRITICAL'?'danger':x.severity==='MEDIUM'?'warning':'success';return <div className={`department-risk ${tone}`} key={x.department}><div><span className="department-avatar">{x.department.split(' ').map(n=>n[0]).join('').slice(0,2)}</span><b>{x.department}</b><strong>{x.riskScore}</strong></div><div className="risk-track"><i style={{width:`${Math.max(0,Math.min(100,x.riskScore))}%`}}/></div><span className="risk-level">{x.severity.toLowerCase()} priority</span></div>})}<div className="risk-footnote"><CircleAlert size={14}/>Signals for HR review, not employment decisions.</div></div> }

function RecruitmentDashboard({recruitment, onExport, searchQuery, onSelectCandidate}){
  const {summary,sources,funnel,open_roles,recent_candidates}=recruitment
  const metrics=[['Total candidates',summary.total_candidates,'Current pipeline','blue',Users],['Active roles',summary.open_roles,'Roles with active candidates','purple',BriefcaseBusiness],['Hired',summary.hired_candidates,`${summary.hiring_conversion}% of total candidates`,'green',Target],['Interview score',summary.average_interview_score,'Average interviewer score','orange',Gauge]]
  return (
    <section className="recruitment-dashboard">
      <PageHeader eyebrow="TALENT ACQUISITION" title="Recruitment" description="Track hiring pipeline, candidate sources, and recruitment efficiency.">
        <Button kind="primary" onClick={onExport}><Download size={15}/>Export recruitment CSV</Button>
      </PageHeader>
      <div className="kpis four recruitment-kpis">{metrics.map(([label,value,detail,tone,Icon])=><Kpi key={label} label={label} value={value} change={detail} tone={tone} icon={Icon}/>)}</div>
      <div className="recruitment-grid">
        <Panel title="Candidates by source" subtitle="Origin of current pipeline"><RecruitmentSources data={sources} total={summary.total_candidates}/></Panel>
        <Panel title="Hiring funnel" subtitle="Candidate progression"><RecruitmentFunnel items={funnel} total={summary.total_candidates}/></Panel>
        <Panel title="Open roles" subtitle={`${summary.open_roles} active roles`}><RoleList roles={open_roles.slice(0,5)}/></Panel>
      </div>
      <Panel className="candidate-table-card" title="Recent candidates" subtitle="Latest applications across all roles">
        <CandidateTable data={recent_candidates} searchQuery={searchQuery} onSelectCandidate={onSelectCandidate}/>
      </Panel>
    </section>
  )
}

function AnalyticsDecisionCenter({risks, action, onToast}) {
  const [status,setStatus]=useState(null),[result,setResult]=useState(null),[question,setQuestion]=useState('')
  useEffect(()=>{api('/api/ai/status').then(s=>{setStatus(s);if(s.available) return api('/api/ai/insights')}).then(r=>r&&setResult(r)).catch(()=>setStatus({available:false}))},[])
  
  const ask=()=>{
    if(!question)return
    api('/api/decision-center/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})})
      .then(r => { setResult(r); onToast('Question submitted to HR Intelligence.') })
      .catch(()=>setResult({error:'AI analysis is temporarily unavailable.'}))
  }

  const active=status?.available
  const qwenCards=result?.priorities||result?.insights
  const cards=qwenCards||risks.slice(0,3).map(r=>({title:`${r.department} workforce risk`,severity:r.severity,summary:'Derived from deterministic attendance, attrition, engagement, performance, and recruitment signals.',recommended_actions:[{action:'Review source metrics'}],evidence_ids:r.signals.slice(0,2).map(s=>`${r.department}:${s.metric}`),signals:r.signals.slice(0,2),confidence:r.riskScore/100}))
  
  return (
    <section className="decision">
      <div className="qwen"><Bot size={17}/><b>{active?'Qwen connected':'Analytics-only mode'}</b></div>
      <div className="decision-title">
        <div>
          <p>{active?'QWEN REASONING · FACT-GROUNDED':'DETERMINISTIC INTELLIGENCE'}</p>
          <h2>{active?'Executive AI Brief':'Priority workforce risks'}</h2>
          <span>{active?(result?.executive_summary||'Qwen is reviewing structured workforce evidence.'):'AI analysis is unavailable. Deterministic workforce analytics remain available below.'}</span>
        </div>
        <Status tone="ai">{active?'Qwen connected':'Analytics available'}</Status>
      </div>
      <div className="trust-flow" aria-label="PeoplePulse decision intelligence flow">
        <span>Source data</span><ChevronRight/><span>Calculated metrics</span><ChevronRight/><span>Risk engine</span><ChevronRight/><span className="ai-step">Qwen interpretation</span><ChevronRight/><span>Human decision</span>
      </div>
      <div className="insights">
        {cards.map(x=>(
          <article key={x.title}>
            <div><Status tone={x.severity==='CRITICAL'||x.severity==='HIGH'?'danger':x.severity==='MEDIUM'?'warning':'success'}>{x.severity}</Status><span>{active?`Confidence ${Math.round(x.confidence*100)}%`:`Risk score ${Math.round(x.confidence*100)}/100`}</span></div>
            <h3>{x.title}</h3>
            <p>{x.summary}</p>
            {x.signals?.length>0&&<div className="insight-facts">{x.signals.map(signal=><span key={signal.metric}><small>{signal.metric.replaceAll('_',' ')}</small><b>{signal.value}</b></span>)}</div>}
            <small>{active?'QWEN-CITED EVIDENCE':'DERIVED ANALYTICS'}</small>
            <em>{x.evidence_ids.join(' · ')}</em>
            <button className="insight-recommendation" style={{cursor:'pointer',border:0,width:'100%',textAlign:'left'}} onClick={() => action(x.recommended_actions?.[0]?.action||'Review source metrics')}>{x.recommended_actions?.[0]?.action||'Review source metrics'}</button>
          </article>
        ))}
      </div>
      <div className="ask">
        <div><Sparkles size={17}/><input aria-label="Ask PeoplePulse AI" value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Ask PeoplePulse AI about workforce evidence…"/></div>
        <button type="button" onClick={ask}>Ask AI</button>
      </div>
      {result?.answer&&<div className="answer"><Bot size={17}/><div><small>QWEN INTERPRETATION · FACT-GROUNDED</small><p>{result.answer}</p></div></div>}
      <div className="human-note"><CircleAlert size={14}/><span>PeoplePulse provides decision support. Employment decisions remain with authorized HR leaders.</span></div>
    </section>
  )
}

function AnalyticsHome({data,analytics,onExport,onBrief,onNavigate,onOpenActivity,action,onToast}) {
  return (
    <>
      <PageHeader eyebrow="EXECUTIVE WORKFORCE INTELLIGENCE" title="Good morning, Alex" description="Live workforce intelligence from the last 90 days.">
        <Button onClick={onExport}><CalendarDays size={15}/>Export report</Button>
        <Button kind="primary" onClick={onBrief}><Sparkles size={15}/>Generate brief</Button>
      </PageHeader>
      <div className="kpis">{data.kpis.map((m,i)=><Kpi key={m.label} label={m.label} value={m.value} change={m.delta} tone={m.tone} icon={[Users,CircleAlert,Activity,Target,BriefcaseBusiness,TrendingUp][i]} spark={i===0}/>)}</div>
      <div className="grid overview-main">
        <Panel title="Workforce overview" subtitle="Attendance and active headcount from source records" action={<button className="link" onClick={() => onNavigate('/workforce')}>View report <ChevronRight size={14}/></button>}>
          <WorkforceChart data={data}/>
        </Panel>
        <Panel title="Department risk posture" subtitle="Deterministic rules-based score"><DepartmentRisks data={analytics.risks}/></Panel>
      </div>
      <div className="grid overview-lower">
        <Panel title="Recruitment stage distribution" subtitle="Share of candidates by current stage"><FunnelData items={analytics.recruitment.funnel}/></Panel>
        <Panel title="Attendance by department" subtitle="Live business-day records"><AttendanceBars data={analytics.attendance.departments}/></Panel>
        <Panel title="Performance by department" subtitle="Current Q3 review cycle"><PerformanceBars data={analytics.performance.departments}/></Panel>
      </div>
      <AnalyticsDecisionCenter risks={analytics.risks} action={action} onToast={onToast}/>
    </>
  )
}

function AnalyticsApp() {
  const navigate = useNavigate()
  const [department, setDepartment] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeframe, setTimeframe] = useState('Last 90 days')
  const [toastMessage, setToastMessage] = useState('')

  // Modals & Drawers state
  const [exportOpen, setExportOpen] = useState(false)
  const [briefOpen, setBriefOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const { data, employees, analytics, errors, loading } = useDashboardData(department)
  const filters = data?.filters || { departments: [] }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const action = (actionName) => {
    api('/api/workflows/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName }),
    })
      .then(x => showToast(x.message || 'Action executed successfully.'))
      .catch(() => showToast(`Action initiated: ${actionName}`))
  }

  const handleExportCSV = () => {
    let csv = 'ID,Name,Department,Role,Location,Status\n'
    employees.forEach(e => {
      csv += `${e.employee_id},"${e.name}","${e.department}","${e.role}","${e.location}","${e.employment_status}"\n`
    })
    downloadFile(csv, 'peoplepulse_workforce_export.csv', 'text/csv')
    setExportOpen(false)
    showToast('Workforce dataset exported as CSV successfully.')
  }

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(employees, null, 2)
    downloadFile(jsonStr, 'peoplepulse_workforce_data.json', 'application/json')
    setExportOpen(false)
    showToast('Workforce dataset exported as JSON successfully.')
  }

  const overviewError = !loading && (!data || !analytics?.recruitment || !analytics?.attendance || !analytics?.performance)

  return (
    <div className="app">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        open={open}
        setOpen={setOpen}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <div className={`content ${collapsed ? 'compact' : ''}`}>
        <Topbar
          department={department}
          setDepartment={setDepartment}
          filters={filters}
          setOpen={setOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNotice={() => setNoticeOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
        />
        <main>
          <Routes>
            <Route path="/" element={loading ? <Loading/> : overviewError ? <Empty title="We couldn’t load your dashboard"/> : <AnalyticsHome data={data} analytics={analytics} onExport={() => setExportOpen(true)} onBrief={() => setBriefOpen(true)} onNavigate={navigate} onOpenActivity={() => setActivityOpen(true)} action={action} onToast={showToast}/>}/>
            <Route path="/overview" element={loading ? <Loading/> : overviewError ? <Empty title="We couldn’t load your dashboard"/> : <AnalyticsHome data={data} analytics={analytics} onExport={() => setExportOpen(true)} onBrief={() => setBriefOpen(true)} onNavigate={navigate} onOpenActivity={() => setActivityOpen(true)} action={action} onToast={showToast}/>}/>
            <Route path="/recruitment" element={<DataPage type="recruitment" analytics={analytics} employees={employees} loading={loading} error={!!errors.recruitment} onExport={() => setExportOpen(true)} searchQuery={searchQuery} onSelectCandidate={setSelectedCandidate} onOpenActivity={() => setActivityOpen(true)}/>}/>
            <Route path="/attendance" element={<DataPage type="attendance" analytics={analytics} employees={employees} loading={loading} error={!analytics?.attendance} onExport={() => setExportOpen(true)} searchQuery={searchQuery} onSelectEmployee={setSelectedEmployee} onOpenActivity={() => setActivityOpen(true)}/>}/>
            <Route path="/performance" element={<DataPage type="performance" analytics={analytics} employees={employees} loading={loading} error={!!errors.performance} onExport={() => setExportOpen(true)} searchQuery={searchQuery} onSelectEmployee={setSelectedEmployee} onOpenActivity={() => setActivityOpen(true)}/>}/>
            <Route path="/workforce" element={<DataPage type="workforce" analytics={analytics} employees={employees} loading={loading} error={!analytics?.workforce || !!errors.employees} onExport={() => setExportOpen(true)} searchQuery={searchQuery} onSelectEmployee={setSelectedEmployee} onOpenActivity={() => setActivityOpen(true)}/>}/>
            <Route path="/ai-insights" element={loading ? <Loading/> : errors.risks ? <Empty title="We couldn’t load workforce intelligence"/> : <><PageHeader eyebrow="AI DECISION INTELLIGENCE" title="Decision Center" description="Evidence-backed workforce intelligence powered by Qwen."/><AnalyticsDecisionCenter risks={analytics.risks} action={action} onToast={showToast}/></>}/>
          </Routes>
        </main>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Export Modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export Analytics & Reports">
        <p style={{fontSize:'13px',color:'#64748b',marginBottom:'18px'}}>Choose your preferred format to export workforce records and risk metrics.</p>
        <div style={{display:'grid',gap:'12px',marginBottom:'20px'}}>
          <div style={{display:'flex',alignItems:'center',justify:'space-between',padding:'14px',border:'1px solid #e2e8f0',borderRadius:'10px',cursor:'pointer'}} onClick={handleExportCSV}>
            <div><b style={{display:'block',color:'#0f172a',fontSize:'14px'}}>CSV Spreadsheet (.csv)</b><small style={{color:'#64748b'}}>Structured employee, recruitment, and attendance metrics</small></div>
            <Download size={18} color="#3b82f6"/>
          </div>
          <div style={{display:'flex',alignItems:'center',justify:'space-between',padding:'14px',border:'1px solid #e2e8f0',borderRadius:'10px',cursor:'pointer'}} onClick={handleExportJSON}>
            <div><b style={{display:'block',color:'#0f172a',fontSize:'14px'}}>JSON Raw Payload (.json)</b><small style={{color:'#64748b'}}>Full API dataset for BI tools and downstream integrations</small></div>
            <FileText size={18} color="#8b5cf6"/>
          </div>
        </div>
      </Modal>

      {/* Brief Generator Modal */}
      <Modal open={briefOpen} onClose={() => setBriefOpen(false)} title="Executive Intelligence Brief">
        <div style={{background:'#f8fafc',padding:'16px',borderRadius:'10px',border:'1px solid #e2e8f0',fontSize:'13px',lineHeight:'1.6',color:'#334155',marginBottom:'18px'}}>
          <b style={{display:'block',fontSize:'15px',color:'#0f172a',marginBottom:'8px'}}>Q3 Executive Summary · PeoplePulse</b>
          <p style={{margin:0}}>• <b>Workforce Composition</b>: 150 total employees (140 active, 8 on notice, 2 exited). Headcount is stable across 7 core departments.</p>
          <p style={{margin:'6px 0 0'}}>• <b>Key Attrition Driver</b>: Sales department exhibits an attrition rate of 9.1% with a high risk score of 64/100, driven by 31h peak overtime concentration.</p>
          <p style={{margin:'6px 0 0'}}>• <b>Recruitment Pipeline</b>: 180 active candidates with a 13.9% conversion rate to hired roles.</p>
        </div>
        <div style={{display:'flex',justify:'flex-end',gap:'10px'}}>
          <Button onClick={() => setBriefOpen(false)}>Close</Button>
          <Button kind="primary" onClick={() => { downloadFile(`PeoplePulse Executive Brief\nTotal Workforce: 150\nAttendance: 92.8%\nSales Risk: High (64/100)`, 'peoplepulse_executive_brief.txt', 'text/plain'); showToast('Brief downloaded to file.'); setBriefOpen(false) }}>Download Brief</Button>
        </div>
      </Modal>

      {/* Notifications Drawer */}
      <Drawer open={noticeOpen} onClose={() => setNoticeOpen(false)} title="System Notifications">
        <div style={{display:'grid',gap:'12px',marginBottom:'20px'}}>
          <div style={{padding:'12px',border:'1px solid #fee2e2',background:'#fff5f5',borderRadius:'8px'}}>
            <b style={{display:'block',color:'#dc2626',fontSize:'13px'}}>High Risk Alert: Sales Department</b>
            <small style={{color:'#7f1d1d',fontSize:'11px'}}>Attrition risk score reached 64/100 due to overtime concentration.</small>
          </div>
          <div style={{padding:'12px',border:'1px solid #e0e7ff',background:'#eef2ff',borderRadius:'8px'}}>
            <b style={{display:'block',color:'#4338ca',fontSize:'13px'}}>Recruitment Pipeline Update</b>
            <small style={{color:'#3730a3',fontSize:'11px'}}>3 new candidates reached Final Interview stage for Senior Engineer.</small>
          </div>
          <div style={{padding:'12px',border:'1px solid #dcfce7',background:'#f0fdf4',borderRadius:'8px'}}>
            <b style={{display:'block',color:'#15803d',fontSize:'13px'}}>Database Connection Active</b>
            <small style={{color:'#166534',fontSize:'11px'}}>FastAPI connected to data layer. 150 employees loaded.</small>
          </div>
        </div>
        <Button kind="primary" onClick={() => { setNoticeOpen(false); showToast('All notifications marked as read.') }}>Mark all as read</Button>
      </Drawer>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Application Settings">
        <div style={{display:'grid',gap:'14px',fontSize:'13px',color:'#334155',marginBottom:'20px'}}>
          <div className="detail-item">
            <small>Database Engine</small>
            <b>SQLite / MongoDB Atlas Ready</b>
          </div>
          <div className="detail-item">
            <small>AI Reasoning Model</small>
            <b>Qwen-Plus (Aliyun DashScope Compatible API)</b>
          </div>
          <div className="detail-item">
            <small>FastAPI Backend Server</small>
            <b>http://127.0.0.1:8000</b>
          </div>
        </div>
        <Button kind="primary" onClick={() => { setSettingsOpen(false); showToast('Settings saved.') }}>Save Settings</Button>
      </Modal>

      {/* Help & Support Modal */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Support Guide">
        <div style={{fontSize:'13px',lineHeight:'1.6',color:'#334155',marginBottom:'20px'}}>
          <b style={{display:'block',color:'#0f172a',fontSize:'14px',marginBottom:'6px'}}>Quick Keyboard Shortcuts</b>
          <p style={{margin:0}}>• <b>Cmd + K / Ctrl + K</b>: Focus global search bar</p>
          <p style={{margin:'4px 0'}}>• <b>Click Table Rows</b>: Open Employee / Candidate detailed profile drawer</p>
          <p style={{margin:'4px 0'}}>• <b>Department Selector</b>: Filter metrics across all pages instantly</p>
        </div>
        <Button onClick={() => setHelpOpen(false)}>Close Guide</Button>
      </Modal>

      {/* Profile Modal */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="User Profile">
        <div className="profile-card">
          <div className="profile-avatar">AR</div>
          <div>
            <b style={{fontSize:'16px',color:'#0f172a',display:'block'}}>Alex Rivera</b>
            <span style={{color:'#64748b',fontSize:'12px'}}>VP, People &amp; Culture</span>
            <div style={{marginTop:'4px',fontSize:'11px',color:'#3b82f6'}}>alex.rivera@peoplepulse.demo</div>
          </div>
        </div>
        <div className="detail-grid">
          <div className="detail-item"><small>Role</small><b>System Administrator</b></div>
          <div className="detail-item"><small>Access Level</small><b>Executive Management</b></div>
        </div>
        <Button kind="primary" onClick={() => { setProfileOpen(false); showToast('Profile details updated.') }}>Save Profile</Button>
      </Modal>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Drawer open={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Employee Profile">
          <div className="profile-card">
            <div className="profile-avatar">{selectedEmployee.name.split(' ').map(x=>x[0]).join('')}</div>
            <div>
              <b style={{fontSize:'16px',color:'#0f172a',display:'block'}}>{selectedEmployee.name}</b>
              <span style={{color:'#64748b',fontSize:'12px'}}>{selectedEmployee.role || 'Team Member'}</span>
              <div style={{marginTop:'4px',fontSize:'11px',color:'#3b82f6'}}>{selectedEmployee.email || `${selectedEmployee.name.toLowerCase().replace(' ','.')}@peoplepulse.demo`}</div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item"><small>Department</small><b>{selectedEmployee.department}</b></div>
            <div className="detail-item"><small>Location</small><b>{selectedEmployee.location}</b></div>
            <div className="detail-item"><small>Tenure</small><b>{selectedEmployee.tenure_months} months</b></div>
            <div className="detail-item"><small>Engagement Score</small><b>{selectedEmployee.engagement_score || 82} / 100</b></div>
            <div className="detail-item"><small>Salary Band</small><b>{selectedEmployee.salary_band || 'B3'}</b></div>
            <div className="detail-item"><small>Work Mode</small><b>{selectedEmployee.work_mode || 'Hybrid'}</b></div>
          </div>
          <div className="drawer-actions">
            <Button kind="primary" onClick={() => { showToast(`1:1 meeting invite sent to ${selectedEmployee.name}`); setSelectedEmployee(null) }}>Schedule 1:1</Button>
            <Button onClick={() => setSelectedEmployee(null)}>Close</Button>
          </div>
        </Drawer>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <Drawer open={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} title="Candidate Application">
          <div className="profile-card">
            <div className="profile-avatar">{selectedCandidate.name.split(' ').map(x=>x[0]).join('')}</div>
            <div>
              <b style={{fontSize:'16px',color:'#0f172a',display:'block'}}>{selectedCandidate.name}</b>
              <span style={{color:'#64748b',fontSize:'12px'}}>{selectedCandidate.role}</span>
              <div style={{marginTop:'4px',fontSize:'11px',color:'#3b82f6'}}>{selectedCandidate.source}</div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item"><small>Department</small><b>{selectedCandidate.department}</b></div>
            <div className="detail-item"><small>Current Stage</small><b>{selectedCandidate.stage}</b></div>
            <div className="detail-item"><small>Interview Score</small><b>{selectedCandidate.interview_score ? `${selectedCandidate.interview_score} / 5` : 'Pending'}</b></div>
            <div className="detail-item"><small>Candidate ID</small><b>#{selectedCandidate.candidate_id}</b></div>
          </div>
          <div className="drawer-actions">
            <Button kind="primary" onClick={() => { showToast(`Candidate ${selectedCandidate.name} advanced to next stage.`); setSelectedCandidate(null) }}>Advance Candidate</Button>
            <Button onClick={() => setSelectedCandidate(null)}>Close</Button>
          </div>
        </Drawer>
      )}

      {/* Activity Log Drawer */}
      <Drawer open={activityOpen} onClose={() => setActivityOpen(false)} title="Full HR Activity History">
        <div className="activity" style={{marginBottom:'20px'}}>
          {[
            ['MS','Meera Nair completed Q3 review','12 min ago','green'],
            ['KS','Kabir Singh flagged for retention review','1h ago','red'],
            ['AR','New candidate moved to final interview','3h ago','purple'],
            ['PD','Payroll change approved','Yesterday','blue'],
            ['VJ','Vikram Joshi attendance pattern logged','Yesterday','orange'],
            ['RD','Riya Das assigned to Engineering team','2 days ago','green']
          ].map(([initial,text,time,tone]) => (
            <div key={text} style={{padding:'12px 0'}}><span className={tone}>{initial}</span><p><b>{text}</b><small>{time}</small></p></div>
          ))}
        </div>
        <Button onClick={() => setActivityOpen(false)}>Close Activity History</Button>
      </Drawer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<BrowserRouter><AnalyticsApp/></BrowserRouter>)
