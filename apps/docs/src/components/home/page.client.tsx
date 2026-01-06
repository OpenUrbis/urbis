"use client";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight, TerminalIcon } from "lucide-react";
import Image from "next/image";
import {
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  lazy,
  type ReactElement,
  type ReactNode,
  type RefObject,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "src/lib/cn";
import MainImg from "./main.png";
import NotebookImg from "./notebook.png";
import OpenAPIImg from "./openapi.png";

const GrainGradient = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.GrainGradient,
  })),
);

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

export function Hero() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-transparent">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-[url('/bg-light.svg')] dark:bg-[url('/bg-dark.svg')]"
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-1/4 -top-1/3 h-[70vmax] w-[70vmax] rounded-full bg-[#B34CDC]/25 blur-[140px] mix-blend-screen"
        initial={{ opacity: 0.35, scale: 0.9 }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [0.85, 1.15, 0.85],
          x: [0, -50, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/3 bottom-[-20%] h-[60vmax] w-[60vmax] rounded-full bg-[#16C2F2]/20 blur-[120px] mix-blend-screen"
        initial={{ opacity: 0.3, scale: 0.95 }}
        animate={{
          opacity: [0.35, 0.7, 0.35],
          scale: [0.9, 1.2, 0.9],
          x: [0, 40, 0],
          y: [0, -55, 0],
        }}
        transition={{
          duration: 7,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-10%] top-1/2 h-[40vmax] -translate-y-1/2 rounded-[999px] bg-linear-to-r from-brand-200/30 via-transparent to-brand-500/30 blur-[90px]"
        initial={{ opacity: 0.2, y: "-50%" }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          y: ["-55%", "-45%", "-55%"],
        }}
        transition={{
          duration: 9,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function CreateAppAnimation() {
  const installCmd = "git clone atlas-monorepo";
  const tickTime = 100;
  const timeCommandEnter = installCmd.length;
  const timeCommandRun = timeCommandEnter + 3;
  const timeCommandEnd = timeCommandRun + 3;
  const timeWindowOpen = timeCommandEnd + 1;
  const timeEnd = timeWindowOpen + 1;

  const [tick, setTick] = useState(timeEnd);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev >= timeEnd ? prev : prev + 1));
    }, tickTime);

    return () => {
      clearInterval(timer);
    };
  }, [timeEnd]);

  const lines: ReactElement[] = [];

  lines.push(
    <span key="command_type">
      {installCmd.substring(0, tick)}
      {tick < timeCommandEnter && (
        <div className="inline-block h-3 w-1 animate-pulse bg-white" />
      )}
    </span>,
  );

  if (tick >= timeCommandEnter) {
    lines.push(<span key="space"> </span>);
  }

  if (tick > timeCommandRun)
    lines.push(
      <Fragment key="command_response">
        {tick > timeCommandRun + 1 && (
          <>
            <span className="font-bold">◇ Cloning atlas-monorepo...</span>
            <span>│ Done</span>
          </>
        )}
        {tick > timeCommandRun + 2 && (
          <>
            <span>│</span>
            <span className="font-bold">◆ Installing dependencies...</span>
          </>
        )}
        {tick > timeCommandRun + 3 && (
          <>
            <span>│ ● NestJS / Node.js</span>
            <span>│ ● Angular / React</span>
            <span>│ ● Docker / K8s</span>
          </>
        )}
      </Fragment>,
    );

  return (
    <section
      aria-label="Animation container"
      className="relative mt-4 w-full mx-auto max-w-[800px]"
      onMouseEnter={() => {
        if (tick >= timeEnd) {
          setTick(0);
        }
      }}
    >
      {tick > timeWindowOpen && (
        <LaunchAppWindow className="absolute bottom-5 right-4 z-10 animate-in fade-in slide-in-from-top-10" />
      )}
      <pre className="overflow-hidden rounded-xl border text-sm shadow-lg bg-fd-card">
        <div className="flex flex-row items-center gap-2 border-b px-4 py-2">
          <TerminalIcon className="size-4" />{" "}
          <span className="font-bold">Terminal</span>
          <div className="grow" />
          <div className="size-2 rounded-full bg-red-400" />
        </div>
        <div className="">
          <code className="grid p-4">{lines}</code>
        </div>
      </pre>
    </section>
  );
}

function LaunchAppWindow(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden rounded-md border bg-fd-background shadow-xl max-[480px]:hidden ",
        props.className,
      )}
    >
      <div className="relative flex h-6 flex-row items-center border-b bg-fd-muted px-4 text-xs text-fd-muted-foreground">
        <p className="absolute inset-x-0 text-neutral-500 font-semibold text-center">
          localhost:3010
        </p>
      </div>
      <div className="p-4 text-sm">Workspace Ready!</div>
    </div>
  );
}

const previewButtonVariants = cva(
  "w-20 h-8 text-sm font-medium transition-colors rounded-full", // Classes Base
  {
    variants: {
      active: {
        true: "bg-brand text-neutral-50", // NOVO: BG e Text para ativo
        false: "text-neutral-800 dark:text-neutral-300",
      },
    },
  },
);
export function PreviewImages(props: ComponentProps<"div">) {
  const [active, setActive] = useState(1);
  const previews = [
    {
      image: MainImg,
      name: "Docs",
    },
    {
      image: NotebookImg,
      name: "Notebook",
    },
    {
      image: OpenAPIImg,
      name: "OpenAPI",
    },
  ];

  return (
    <div {...props} className={cn("relative grid", props.className)}>
      <div className="absolute flex flex-row left-1/2 -translate-1/2 bottom-0 z-2 p-0.5 rounded-xl bg-neutral-300 dark:bg-neutral-700 border shadow-xl">
        <div
          role="none"
          className="absolute bg-brand rounded-lg w-20 h-8 transition-transform z-[-1]"
          style={{
            // Note: O -translate-1/2 no div pai probably está incorreto. Deveria ser -translate-x-1/2
            transform: `translateX(calc(var(--spacing) * 20 * ${active}))`,
          }}
        />
        {previews.map((item, i) => (
          <button
            key={item.name}
            type="button"
            className={previewButtonVariants({ active: active === i })}
            onClick={() => setActive(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
      {previews.map((item, i) => (
        <Image
          key={item.name}
          src={item.image}
          alt="preview"
          className={cn(
            "col-start-1 row-start-1 select-none",
            active === i
              ? "animate-in fade-in slide-in-from-bottom-12 duration-800"
              : "invisible",
          )}
        />
      ))}
    </div>
  );
}

const WritingTabs = [
  {
    name: "DevOps & Infra",
    value: "writer",
  },
  {
    name: "Product & Design",
    value: "developer",
  },
  {
    name: "Development",
    value: "automation",
  },
] as const;

export function Writing({
  tabs: tabContents,
}: {
  tabs: Record<(typeof WritingTabs)[number]["value"], ReactNode>;
}) {
  const [tab, setTab] =
    useState<(typeof WritingTabs)[number]["value"]>("writer");

  return (
    <div className="col-span-full my-20">
      <h2 className="text-4xl text-brand dark:text-brand-500 mb-8 text-center font-medium tracking-tight">
        Accelerate every area of your product.
      </h2>
      <p className="text-center mb-8 mx-auto w-full max-w-[800px]">
        Technical and strategic expertise to transform your business.
      </p>
      <div className="flex justify-center items-center gap-4 text-fd-muted-foreground mb-6">
        {WritingTabs.map((item) => (
          <Fragment key={item.value}>
            <ArrowRight className="size-4 first:hidden" />
            <button
              type="button"
              className={cn(
                "text-lg font-medium transition-colors",
                item.value === tab && "text-brand dark:text-brand-500",
              )}
              onClick={() => setTab(item.value)}
            >
              {item.name}
            </button>
          </Fragment>
        ))}
      </div>
      {Object.entries(tabContents).map(([key, value]) => (
        <div
          key={key}
          aria-hidden={key !== tab}
          className={cn("animate-fd-fade-in", key !== tab && "hidden")}
        >
          {value}
        </div>
      ))}
    </div>
  );
}

export function AgnosticBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(ref);

  return (
    <div
      ref={ref}
      className="absolute inset-0 -z-1 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
    >
      <Suspense fallback={null}>
        <Dithering
          colorBack="#00000000"
          colorFront="#16C2F2"
          shape="warp"
          type="4x4"
          speed={visible ? 0.4 : 0}
          className="size-full"
          minPixelRatio={1}
        />
      </Suspense>
    </div>
  );
}

export function ContentAdoptionBackground(
  props: ComponentProps<typeof GrainGradient>,
) {
  return (
    <Suspense fallback={null}>
      <GrainGradient
        colors={["#167BF2", "#16C2F2", "#E716F2"]}
        speed={0}
        colorBack="#1D1004"
        shape="sphere"
        {...props}
      />
    </Suspense>
  );
}

let observer: IntersectionObserver;
const observerTargets = new WeakMap<
  Element,
  (entry: IntersectionObserverEntry) => void
>();

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        observerTargets.get(entry.target)?.(entry);
      }
    });

    const element = ref.current;
    if (!element) return;
    observerTargets.set(element, (entry) => {
      setVisible(entry.isIntersecting);
    });
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string | number;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/30 stroke-neutral-300 dark:stroke-neutral-800",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
