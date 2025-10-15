import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: string
}

export function TransactionTimeline({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="clay-element">
      <CardHeader>
        <CardTitle>Timeline & Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    task.completed ? "bg-green-500" : "clay-accent-blue"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <Clock className="h-4 w-4 text-white" />
                  )}
                </div>
                {index < tasks.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
              </div>

              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{task.title}</h4>
                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="capitalize">
                    {task.priority}
                  </Badge>
                </div>
                {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}

          {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">No tasks yet</p>}
        </div>
      </CardContent>
    </Card>
  )
}
