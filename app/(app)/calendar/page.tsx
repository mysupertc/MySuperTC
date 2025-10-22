import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Plus } from "lucide-react"

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get current month events
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, transactions(property_address)")
    .eq("profile_id", user.id)
    .gte("start_time", startOfMonth.toISOString())
    .lte("start_time", endOfMonth.toISOString())
    .order("start_time", { ascending: true })

  // Group events by date
  const eventsByDate = events?.reduce((acc: Record<string, any[]>, event) => {
    const date = new Date(event.start_time).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  // Generate calendar grid
  const firstDay = startOfMonth.getDay()
  const daysInMonth = endOfMonth.getDate()
  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <Button className="clay-accent-mint">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Monthly View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const date = new Date(now.getFullYear(), now.getMonth(), day)
              const dateString = date.toDateString()
              const dayEvents = eventsByDate?.[dateString] || []
              const isToday = dateString === new Date().toDateString()

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  } hover:bg-muted/50 transition-colors`}
                >
                  <div className="text-sm font-medium mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="text-xs p-1 rounded clay-accent-mint text-white truncate">
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card className="clay-element">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events && events.length > 0 ? (
              events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg clay-accent-blue flex flex-col items-center justify-center text-white">
                      <span className="text-xs font-medium">
                        {new Date(event.start_time).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold">{new Date(event.start_time).getDate()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    {event.description && <p className="text-sm text-muted-foreground mb-2">{event.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(event.start_time).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.transactions && (
                      <Badge variant="secondary" className="mt-2">
                        {event.transactions.property_address}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No upcoming events</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
