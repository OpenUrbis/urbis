import { signal } from "@preact/signals";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

import { Debugger } from "../Debugger";
import { MenuToggleButton } from "../MenuToogleButton";
import { ModeToggle } from "../ModeToggle";

const isMenuOpenSignal = signal(false);

const Header = () => {
  return (
    <header className="sticky top-0 z-[50] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 w-full">
        <div className="mr-2 flex items-center">
          <MenuToggleButton />
        </div>
        {/* Logo */}
        <div className="mr-4 flex items-center">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <img
              fetchPriority="high"
              src="https://urbis.sampa.br/assets/images/logo.webp"
              className="h-6 w-auto object-contain"
              alt="Urbis"
            />
            <span className="hidden font-bold sm:inline-block text-muted-foreground text-sm">
              DEMO
            </span>
          </a>
        </div>

        {/* Desktop Menu - NavigationMenu */}
        <div className="hidden md:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              {["Início", "Mapa", "Viabiliza", "Dados Abertos", "GitHub", "Documentação"].map((item) => (
                <NavigationMenuItem key={item}>
                  <NavigationMenuLink
                    href="#"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "rounded-full border border-input h-8 px-4 bg-transparent hover:bg-accent"
                    )}
                  >
                    {item}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center gap-2">
             <ModeToggle />
             <div className="hidden lg:block">
               <Debugger />
             </div>
             
             {/* Mobile Menu Drawer */}
             <div className="md:hidden">
               <Drawer>
                 <DrawerTrigger asChild>
                   <Button variant="ghost" size="icon">
                     <span className="material-symbols-outlined text-xl">expand_more</span>
                     <span className="sr-only">Toggle Menu</span>
                   </Button>
                 </DrawerTrigger>
                 <DrawerContent>
                   <DrawerHeader>
                     <DrawerTitle>Menu</DrawerTitle>
                   </DrawerHeader>
                   <div className="p-4 flex flex-col gap-4">
                     {["Início", "Mapa", "Viabiliza", "Dados Abertos", "GitHub", "Documentação"].map((item) => (
                       <a
                         key={item}
                         href="#"
                         className="text-lg font-medium hover:text-primary transition-colors"
                       >
                         {item}
                       </a>
                     ))}
                   </div>
                   <DrawerFooter>
                     <DrawerClose asChild>
                       <Button variant="outline">Fechar</Button>
                     </DrawerClose>
                   </DrawerFooter>
                 </DrawerContent>
               </Drawer>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
