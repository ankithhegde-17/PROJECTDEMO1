import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function useDashboardData(department) {
  const [state, setState] = useState({ data: null, insights: [], employees: [], analytics: null, errors: {}, loading: true })

  useEffect(() => {
    let current = true
    const query = department ? `?department=${encodeURIComponent(department)}` : ''
    const requests = {
      overview: `/api/dashboard/overview${query}`,
      insights: `/api/decision-center/insights${query}`,
      employees: `/api/employees${query}`,
      recruitment: `/api/recruitment${query}`,
      attendanceSummary: `/api/attendance/summary${query}`,
      attendanceTrends: `/api/attendance/trends${query}`,
      attendanceDepartments: `/api/attendance/departments${query}`,
      attendanceRisks: `/api/attendance/risks${query}`,
      performance: `/api/performance/employees${query}`,
      workforceSummary: `/api/workforce/summary${query}`,
      workforceDistribution: `/api/workforce/distribution${query}`,
      workforceDepartments: `/api/workforce/departments${query}`,
      risks: `/api/risks${query}`,
    }

    setState(previous => ({ ...previous, loading: true, errors: {} }))
    Promise.allSettled(Object.entries(requests).map(async ([key, path]) => [key, await api(path)]))
      .then(results => {
        if (!current) return
        const values = {}
        const errors = {}
        results.forEach((result, index) => {
          const key = Object.keys(requests)[index]
          if (result.status === 'fulfilled') values[result.value[0]] = result.value[1]
          else errors[key] = true
        })
        setState({
          data: values.overview || null,
          insights: values.insights || [],
          employees: values.employees || [],
          analytics: {
            recruitment: values.recruitment || null,
            attendance: values.attendanceSummary && values.attendanceTrends && values.attendanceDepartments && values.attendanceRisks ? {
              summary: values.attendanceSummary,
              trends: values.attendanceTrends,
              departments: values.attendanceDepartments,
              risks: values.attendanceRisks,
            } : null,
            performance: values.performance || null,
            workforce: values.workforceSummary && values.workforceDistribution && values.workforceDepartments ? {
              summary: values.workforceSummary,
              distribution: values.workforceDistribution,
              departments: values.workforceDepartments,
            } : null,
            risks: values.risks || [],
          },
          errors,
          loading: false,
        })
      })
    return () => { current = false }
  }, [department])

  return state
}
