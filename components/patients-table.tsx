"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, MoreHorizontal, Eye, Activity } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PatientRow } from "@/lib/actions/patients"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="status-active text-[10px] h-5">Active</Badge>
  if (status === "pending") return <Badge className="status-pending text-[10px] h-5">Pending</Badge>
  return <Badge className="status-inactive text-[10px] h-5">Inactive</Badge>
}

const GOAL_OPTIONS = ["All Goals", "Weight Loss", "Muscle Gain", "Diabetes Management", "Heart Health", "Athletic Performance", "Gut Health & Energy"]
const STATUS_OPTIONS = ["All Status", "active", "inactive", "pending"]

export function PatientsTable({ patients }: { patients: PatientRow[] }) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage || "pt-BR"
  const [search, setSearch] = useState("")
  const [goalFilter, setGoalFilter] = useState("All Goals")
  const [statusFilter, setStatusFilter] = useState("All Status")

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.goal ?? "").toLowerCase().includes(search.toLowerCase())
      const matchGoal = goalFilter === "All Goals" || p.goal === goalFilter
      const matchStatus = statusFilter === "All Status" || p.status === statusFilter
      return matchSearch && matchGoal && matchStatus
    })
  }, [patients, search, goalFilter, statusFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <div className="relative w-full sm:flex-1 sm:min-w-56">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, goal..."
            className="h-10 pl-8 text-sm sm:h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
          <Select value={goalFilter} onValueChange={setGoalFilter}>
            <SelectTrigger className="h-10 w-full text-xs sm:h-9 sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.map((g) => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full text-xs sm:h-9 sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">
                  {s === "All Status" ? s : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(goalFilter !== "All Goals" || statusFilter !== "All Status" || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-full text-xs text-muted-foreground sm:h-9 sm:w-auto"
              onClick={() => { setGoalFilter("All Goals"); setStatusFilter("All Status"); setSearch("") }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {patients.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <p>No patients yet.</p>
                <Link href="/dashboard/patients/new">
                  <Button size="sm" className="mt-1 h-9 gap-1.5">Add your first patient</Button>
                </Link>
              </div>
            ) : "No patients match your filters."}
          </div>
        ) : (
          filtered.map((patient) => (
            <div key={patient.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/dashboard/patients/${patient.id}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{patient.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{patient.email ?? "—"}</p>
                  </div>
                </Link>
                <StatusBadge status={patient.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="text-muted-foreground">Goal: <span className="text-foreground">{patient.goal ?? "—"}</span></p>
                <p className="text-muted-foreground">Sex: <span className="text-foreground capitalize">{patient.sex ?? "—"}</span></p>
                <p className="text-muted-foreground">Since: <span className="text-foreground">{new Date(patient.created_at).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</span></p>
                <p className="col-span-2 truncate text-muted-foreground">
                  Conditions: <span className="text-foreground">{!patient.conditions || patient.conditions.length === 0 ? "—" : patient.conditions.join(", ")}</span>
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link href={`/dashboard/patients/${patient.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="h-9 w-full">View profile</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <Link href={`/dashboard/assessments/new?patientId=${patient.id}`}>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                        <Activity className="h-3.5 w-3.5" /> New assessment
                      </DropdownMenuItem>
                    </Link>
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                        <Eye className="h-3.5 w-3.5" /> Open profile
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[220px] text-xs font-semibold">Patient</TableHead>
              <TableHead className="text-xs font-semibold">Sex</TableHead>
              <TableHead className="text-xs font-semibold">Goal</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Since</TableHead>
              <TableHead className="text-xs font-semibold">Conditions</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  {patients.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <p>No patients yet.</p>
                      <Link href="/dashboard/patients/new">
                        <Button size="sm" className="mt-1 gap-1.5">Add your first patient</Button>
                      </Link>
                    </div>
                  ) : "No patients match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-muted/20">
                  <TableCell>
                    <Link href={`/dashboard/patients/${patient.id}`} className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium transition-colors hover:text-primary">{patient.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{patient.email ?? "—"}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">{patient.sex ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{patient.goal ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={patient.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(patient.created_at).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {!patient.conditions || patient.conditions.length === 0 ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : (
                      <span className="block max-w-[180px] truncate">{patient.conditions.join(", ")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                            <Eye className="h-3.5 w-3.5" /> View profile
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/dashboard/assessments/new?patientId=${patient.id}`}>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                            <Activity className="h-3.5 w-3.5" /> New assessment
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {patients.length} patients</p>
    </div>
  )
}
