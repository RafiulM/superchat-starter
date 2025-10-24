"use client"

import { useState } from "react"
import { IconCirclePlusFilled, IconMail, IconSearch, IconPhoto, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const handleAISearch = () => {
    setActiveFeature('ai-search')
    console.log('AI Search feature activated')
    // TODO: Navigate to AI Search page or open modal
  }

  const handleAIImageGeneration = () => {
    setActiveFeature('ai-image-generation')
    console.log('AI Image Generation feature activated')
    // TODO: Navigate to AI Image Generation page or open modal
  }
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 flex-wrap">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <div className="ai-feature-buttons">
              <Button
                size="icon"
                className={`size-8 group-data-[collapsible=icon]:opacity-0 sidebar-nav-item transition-all duration-200 ${
                  activeFeature === 'ai-search' ? 'ai-button-active' : ''
                }`}
                variant={activeFeature === 'ai-search' ? 'default' : 'outline'}
                tooltip="AI Search"
                onClick={handleAISearch}
                aria-label="AI Search"
                aria-pressed={activeFeature === 'ai-search'}
              >
                <IconSearch />
                <span className="sr-only">AI Search</span>
              </Button>
              <Button
                size="icon"
                className={`size-8 group-data-[collapsible=icon]:opacity-0 sidebar-nav-item transition-all duration-200 ${
                  activeFeature === 'ai-image-generation' ? 'ai-button-active' : ''
                }`}
                variant={activeFeature === 'ai-image-generation' ? 'default' : 'outline'}
                tooltip="AI Image Generation"
                onClick={handleAIImageGeneration}
                aria-label="AI Image Generation"
                aria-pressed={activeFeature === 'ai-image-generation'}
              >
                <IconPhoto />
                <span className="sr-only">AI Image Generation</span>
              </Button>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0 sidebar-nav-item transition-all duration-200"
                variant="outline"
                aria-label="Inbox"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
