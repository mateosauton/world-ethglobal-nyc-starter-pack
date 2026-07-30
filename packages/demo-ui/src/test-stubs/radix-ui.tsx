import * as React from "react"

const TabsContext = React.createContext<string | undefined>(undefined)

function TabsRoot({ defaultValue, children, ...props }: React.ComponentProps<"div"> & { defaultValue?: string }) {
  return <TabsContext value={defaultValue}><div {...props}>{children}</div></TabsContext>
}

function TabsList(props: React.ComponentProps<"div">) { return <div role="tablist" {...props} /> }
function TabsTrigger({ value, children, ...props }: React.ComponentProps<"button"> & { value: string }) {
  const selected = React.use(TabsContext) === value
  return <button role="tab" aria-selected={selected} {...props}>{children}</button>
}
function TabsContent({ value, children, ...props }: React.ComponentProps<"div"> & { value: string }) {
  return React.use(TabsContext) === value ? <div role="tabpanel" {...props}>{children}</div> : null
}

function SeparatorRoot({ orientation = "horizontal", decorative: _decorative, ...props }: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }) {
  return <div role="separator" aria-orientation={orientation} {...props} />
}

export const Tabs = { Root: TabsRoot, List: TabsList, Trigger: TabsTrigger, Content: TabsContent }
export const Separator = { Root: SeparatorRoot }
