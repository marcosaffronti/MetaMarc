"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/database";
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, User } from "lucide-react";

interface RecentTasksProps {
  tasks: Task[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tareas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tareas pendientes
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{task.title}</p>
                  {task.client && (
                    <p className="text-xs text-muted-foreground">
                      {task.client.company}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd MMM", { locale: es })}
                    </span>
                  )}
                  {task.assigned_user && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assigned_user.full_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
