import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Landmark, UserRound } from "lucide-react";
import { useEffect } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRemake } from "@/lib/remake/store";
import { cn } from "@/lib/utils";
import { INSTITUTION_KEYS, PRIMARY_ROLES, personaFor, roleByKey, roleFor } from "./nav";

const itemCls = "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm";

export function AccountMenu({ name }: { name: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const persona = personaFor(path);
  const active = roleFor(path).key;
  const { setWorkspace } = useRemake();
  const navigate = useNavigate();
  const inInstitution = (INSTITUTION_KEYS as readonly string[]).includes(active);

  // Keep the stored workspace in step with the page being viewed.
  useEffect(() => setWorkspace(active), [active, setWorkspace]);

  const go = (key: string) => {
    setWorkspace(key);
    navigate({ to: roleByKey(key).home });
  };

  const Option = ({ k }: { k: string }) => {
    const r = roleByKey(k);
    const on = active === k;
    return (
      <DropdownMenuItem onSelect={() => go(k)} className={cn(itemCls, on && "bg-mint font-semibold text-mint-foreground focus:bg-mint")}>
        <r.icon className="size-4" />
        <span className="flex-1">{r.label}</span>
        {on && <Check className="size-4 text-primary" />}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-full border bg-card py-1 pl-1 pr-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30" title={persona.org} aria-label="Account menu">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{persona.initials}</span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{name}</span>
            <span className="block text-[11px] text-muted-foreground">{persona.role}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account</DropdownMenuLabel>
        <DropdownMenuItem asChild className={itemCls}>
          <Link to="/resident/profile" onClick={() => setWorkspace("resident")}><UserRound className="size-4" /> User profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Switch workspace</DropdownMenuLabel>
        {PRIMARY_ROLES.map((k) => <Option key={k} k={k} />)}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(itemCls, inInstitution && "bg-mint font-semibold text-mint-foreground")}>
            <Landmark className="size-4" />
            <span className="flex-1">Institution</span>
            {inInstitution && <span className="text-[11px] font-normal">{roleByKey(active).label}</span>}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent collisionPadding={12} className="w-52 rounded-xl p-1.5">
            {INSTITUTION_KEYS.map((k) => <Option key={k} k={k} />)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
