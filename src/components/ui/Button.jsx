// Button.jsx - A versatile button component with multiple variants and sizes, including a premium liquid glass button and a retro metal button, built using Tailwind CSS and React.

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ==========================================
// 1. STANDARD BASE UI BUTTON (Your Original)
// ==========================================
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const DefaultButton = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

DefaultButton.displayName = "DefaultButton"

// ==========================================
// 2. PREMIUM LIQUID GLASS BUTTON
// ==========================================
const liquidbuttonVariants = cva(
  "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:scale-105 duration-300 transition text-primary",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 has-[>svg]:px-6",
        xxl: "h-14 rounded-md px-10 has-[>svg]:px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xxl",
    },
  }
)

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="30" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="2" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

function LiquidButton({ className, variant, size, asChild = false, children, ...props }) {
  const Comp = asChild ? Slot : "button"

  return (
    <>
      <Comp
        data-slot="button"
        className={cn("relative", liquidbuttonVariants({ variant, size, className }))}
        {...props}
      >
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-md shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] transition-all dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]" />
        <div className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-md" style={{ backdropFilter: 'url("#container-glass")' }} />
        <div className="pointer-events-none z-10">{children}</div>
        <GlassFilter />
      </Comp>
    </>
  )
}

// ==========================================
// 3. PREMIUM RETRO METAL BUTTON
// ==========================================
const colorVariants = {
  default: { outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]", inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]", button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]", textColor: "text-white", textShadow: "[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]" },
  primary: { outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]", inner: "bg-gradient-to-b from-primary via-secondary to-muted", button: "bg-gradient-to-b from-primary to-primary/40", textColor: "text-white", textShadow: "[text-shadow:_0_-1px_0_rgb(30_58_138_/_100%)]" },
  success: { outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]", inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]", button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]", textColor: "text-[#FFF7F0]", textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]" },
  error: { outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]", inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]", button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]", textColor: "text-[#FFF7F0]", textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]" },
  gold: { outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]", inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]", button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]", textColor: "text-[#FFFDE5]", textShadow: "[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]" },
  bronze: { outer: "bg-gradient-to-b from-[#864813] to-[#E9B486]", inner: "bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]", button: "bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]", textColor: "text-[#FFF7F0]", textShadow: "[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]" },
}

const metalButtonVariants = (variant = "default", isPressed, isHovered, isTouchDevice) => {
  const colors = colorVariants[variant] || colorVariants.default
  const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"

  return {
    wrapper: cn("relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform", colors.outer),
    wrapperStyle: {
      transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
      boxShadow: isPressed ? "0 1px 2px rgba(0, 0, 0, 0.15)" : isHovered && !isTouchDevice ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition: transitionStyle,
      transformOrigin: "center center",
    },
    inner: cn("absolute inset-[1px] transform-gpu rounded-lg will-change-transform", colors.inner),
    innerStyle: { transition: transitionStyle, transformOrigin: "center center", filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none" },
    button: cn("relative z-10 m-[1px] inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm leading-none font-semibold will-change-transform outline-none", colors.button, colors.textColor, colors.textShadow),
    buttonStyle: { transform: isPressed ? "scale(0.97)" : "scale(1)", transition: transitionStyle, transformOrigin: "center center", filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none" },
  }
}

const ShineEffect = ({ isPressed }) => (
  <div className={cn("pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300", isPressed ? "opacity-20" : "opacity-0")}>
    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
  </div>
)

const MetalButton = React.forwardRef(({ children, className, variant = "default", ...props }, ref) => {
  const [isPressed, setIsPressed] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  const variants = metalButtonVariants(variant, isPressed, isHovered, isTouchDevice)

  return (
    <div className={variants.wrapper} style={variants.wrapperStyle}>
      <div className={variants.inner} style={variants.innerStyle}></div>
      <button
        ref={ref}
        className={cn(variants.button, className)}
        style={variants.buttonStyle}
        {...props}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => { setIsPressed(false); setIsHovered(false) }}
        onMouseEnter={() => { if (!isTouchDevice) setIsHovered(true) }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
      >
        <ShineEffect isPressed={isPressed} />
        {children || "Button"}
        {isHovered && !isPressed && !isTouchDevice && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t rounded-lg from-transparent to-white/5" />
        )}
      </button>
    </div>
  )
})
MetalButton.displayName = "MetalButton"
const Button = React.forwardRef(
  (
    {
      variant = "default",
      className,
      size = "default",
      children,
      ...props
    },
    ref
  ) => {

    // PREMIUM LIQUID BUTTON
    if (variant === "liquid") {
      return (
        <LiquidButton
          className={className}
          size={size}
          {...props}
        >
          {children}
        </LiquidButton>
      )
    }

    // PREMIUM METAL BUTTON
    if (
      [
        "metal",
        "primary",
        "success",
        "error",
        "gold",
        "bronze",
      ].includes(variant)
    ) {
      return (
        <MetalButton
          ref={ref}
          variant={variant === "metal" ? "default" : variant}
          className={className}
          {...props}
        >
          {children}
        </MetalButton>
      )
    }

    // DEFAULT SHADCN BUTTON
    return (
      <DefaultButton
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      >
        {children}
      </DefaultButton>
    )
  }
)

Button.displayName = "Button"

// ==========================================
// EXPORTS
// ==========================================
export {
  Button,
  buttonVariants,
  liquidbuttonVariants,
}