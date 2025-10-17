
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { getLeaderboardData } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function LeaderboardPage() {
  const leaderboardData = await getLeaderboardData();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Sales Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          A performance overview of the entire sales team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance Rankings</CardTitle>
          <CardDescription>Ranked by total revenue generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Sales Representative</TableHead>
                <TableHead className="text-right">Revenue Generated (₹)</TableHead>
                <TableHead className="text-right">Deals Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.length > 0 ? (
                leaderboardData.map((data, index) => (
                  <TableRow key={data.user.id}>
                    <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={`https://picsum.photos/seed/${data.user.id}/40/40`} alt={data.user.name} data-ai-hint="person" />
                              <AvatarFallback>{data.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-medium">{data.user.name}</span>
                              <span className="text-sm text-muted-foreground">{data.user.email}</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {data.revenueGenerated.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {data.dealsClosed}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No leaderboard data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
