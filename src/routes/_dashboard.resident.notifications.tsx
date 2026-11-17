import { createFileRoute } from "@tanstack/react-router";
import { Bell, Coins, Gift, Lightbulb, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/remake/ui";
import { useRemake } from "@/lib/remake/store";
import { residentNotifications } from "@/lib/remake/notifications";
import { fmtShortDate } from "@/lib/remake/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/resident/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Remake" },
      { name: "description", content: "Pickup updates, Green Coin releases and reward confirmations." },
      { property: "og:title", content: "Notifications — Remake" },
      { property: "og:description", content: "Stay updated on your Remake pickups and rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

const ICON = { pickup: Truck, coins: Coins, reward: Gift, tip: Lightbulb };

function NotificationsPage() {
  const { state, markNotificationsRead } = useRemake();
  const list = residentNotifications(state);
  const unread = list.filter((n) => !state.readNotifications.includes(n.id));
  return (
    <div>
      <PageHeader eyebrow="Resident" title="Notifications" description={`${unread.length} unread`} actions={<Button variant="outline" disabled={!unread.length} onClick={() => markNotificationsRead(list.map((n) => n.id))}>Mark all as read</Button>} />
      <Panel>
        {list.length === 0 ? <EmptyState icon={Bell} title="No notifications" /> : (
          <ul className="space-y-2">
            {list.map((n) => {
              const Icon = ICON[n.kind];
              const isUnread = !state.readNotifications.includes(n.id);
              return (
                <li key={n.id}>
                  <button onClick={() => markNotificationsRead([n.id])} className={cn("flex w-full items-start gap-4 rounded-2xl p-4 text-left transition", isUnread ? "bg-mint" : "hover:bg-muted")}>
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", isUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold">{n.title}{isUnread && <span className="size-2 rounded-full bg-destructive" />}</span>
                      <span className="block text-sm text-muted-foreground">{n.body}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtShortDate(n.date)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
